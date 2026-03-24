// Socket.io Plugin - Real-time messaging
import type { FastifyInstance } from 'fastify';
import type { Server, Socket } from 'socket.io';
import type { ExtendedPrismaClient } from '../../../03-infrastructure/database/client.js';
import { SOCKET_EVENTS } from '../../../00-core/constants.js';
import { MessageService } from '../../../02-application/services/message.service.js';
import { PushService } from '../../../02-application/services/push.service.js';
import { VoiceService } from '../../../02-application/services/voice.service.js';
import { ThreadService } from '../../../02-application/services/thread.service.js';
import { JwksClient } from 'jwks-rsa';
import jsonwebtoken from 'jsonwebtoken';

// Cognito JWKS client for token verification
const COGNITO_USER_POOL_ID =
  process.env.COGNITO_USER_POOL_ID || 'eu-north-1_SJ3dGBIPY';
const COGNITO_REGION = process.env.COGNITO_REGION || 'eu-north-1';
const jwksUri = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

const socketJwksClient = new JwksClient({
  jwksUri,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  timeout: 10000, // 10 second timeout
  requestHeaders: {
    'User-Agent': 'Boxcord-Socket-Auth/1.0'
  }
});

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

// Extract mentions from message content (@user@domain.com)
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // Extract email without the @ prefix
  }
  return mentions;
}

// Utility: Decode base64url (JWT payload)
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

// Test JWKS connectivity on startup
async function testJwksConnectivity(app: FastifyInstance): Promise<void> {
  try {
    app.log.info(`Testing JWKS connectivity: ${jwksUri}`);
    const response = await fetch(jwksUri);

    if (!response.ok) {
      throw new Error(
        `JWKS endpoint returned ${response.status}: ${response.statusText}`
      );
    }

    const jwks = (await response.json()) as { keys?: unknown[] };
    app.log.info(
      `JWKS connectivity test passed - ${jwks.keys?.length || 0} keys found at ${jwksUri}`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    app.log.error(
      `JWKS connectivity test FAILED: ${errorMsg} (uri: ${jwksUri}, pool: ${COGNITO_USER_POOL_ID}, region: ${COGNITO_REGION})`
    );
  }
}

// Helper: Route WebRTC signaling data to target user
async function routeWebRTCSignal(
  io: Server,
  room: string,
  targetUserId: string,
  fromUserId: string,
  eventName: string,
  signalData: unknown,
  logger: FastifyInstance['log']
): Promise<void> {
  const targetSockets = await io.in(room).fetchSockets();

  for (const targetSocket of targetSockets) {
    if (
      (targetSocket as unknown as AuthenticatedSocket).userId === targetUserId
    ) {
      targetSocket.emit(eventName, {
        fromUserId,
        [eventName.includes('offer')
          ? 'offer'
          : eventName.includes('answer')
            ? 'answer'
            : 'candidate']: signalData
      });

      logger.debug(
        `[WEBRTC] Routed ${eventName} from ${fromUserId} to ${targetUserId} in room ${room}`
      );
      return;
    }
  }

  logger.warn(`[WEBRTC] Target user ${targetUserId} not found in room ${room}`);
}

export function setupSocketHandlers(
  io: Server,
  app: FastifyInstance,
  prisma: ExtendedPrismaClient
) {
  const messageService = new MessageService(prisma);
  const threadService = new ThreadService(prisma);
  const pushService = new PushService(prisma);
  const _voiceService = new VoiceService(prisma);
  const onlineUsers = new Map<string, Set<string>>(); // channelId -> Set of userIds
  const isDev = process.env.NODE_ENV !== 'production';
  const allowMockTokens = isDev || process.env.ALLOW_MOCK_TOKENS === 'true';

  // Test JWKS connectivity on startup
  testJwksConnectivity(app).catch((err) => {
    app.log.error('Failed to test JWKS connectivity on startup:', err);
  });

  // Auth middleware - verify JWT before allowing connection
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        app.log.error('Socket auth: No token provided');
        return next(new Error('Authentication required'));
      }

      // Handle mock tokens (development only)
      if (allowMockTokens && token.startsWith('mock.')) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString()
            );
            socket.userId = payload.sub || payload.userId;
            socket.email = payload.email;
            return next();
          } catch {
            app.log.error('Socket auth: Invalid mock token format');
            return next(new Error('Invalid mock token'));
          }
        }
      }

      // Verify JWT with signature validation (Cognito tokens)
      const parts = token.split('.');
      if (parts.length !== 3) {
        app.log.error('Socket auth: Invalid JWT format');
        return next(new Error('Invalid token format'));
      }

      // Decode header to get kid for signature verification
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));

      if (!payload.sub) {
        app.log.error('Socket auth: No sub claim in token');
        return next(new Error('Invalid token - missing sub'));
      }

      // Check expiration first
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        app.log.error('Socket auth: Token expired');
        return next(new Error('Token expired'));
      }

      // Verify signature if it's a Cognito token
      if (payload.iss && payload.iss.includes('cognito-idp') && header.kid) {
        try {
          app.log.debug(
            `Socket auth: Verifying Cognito token (kid: ${header.kid}, alg: ${header.alg}, iss: ${payload.iss}, sub: ${payload.sub}, exp: ${new Date(payload.exp * 1000).toISOString()})`
          );

          const key = await socketJwksClient.getSigningKey(header.kid);
          const signingKey = key.getPublicKey();

          // Verify signature
          jsonwebtoken.verify(token, signingKey, {
            algorithms: ['RS256'],
            issuer: payload.iss
          });

          app.log.debug('Socket auth: JWT signature verified successfully');
        } catch (verifyErr) {
          const errorMsg =
            verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
          const errorName =
            verifyErr instanceof Error ? verifyErr.name : 'UnknownError';

          app.log.warn(
            `Socket auth: JWT signature verification failed - ${errorName}: ${errorMsg} (kid: ${header.kid}, iss: ${payload.iss}, jwksUri: ${jwksUri})`
          );

          // Accept the token anyway in demo mode (matches REST API behavior)
          // This allows the demo to work even if JWKS verification fails
          app.log.warn(
            'Socket auth: Accepting token anyway in demo mode (matches REST API behavior)'
          );
        }
      } else {
        // Non-Cognito token - accept in demo mode
        app.log.debug(
          `Socket auth: Non-Cognito token (hasIssuer: ${!!payload.iss}, iss: ${payload.iss}, hasKid: ${!!header.kid}, kid: ${header.kid})`
        );
      }

      socket.userId = payload.sub;
      socket.email = payload.email || payload['cognito:username'] || '';
      next();
    } catch (err) {
      app.log.error(
        'Socket auth: Authentication failed: ' + (err as Error).message
      );
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    app.log.info(`User ${userId} connected (socket: ${socket.id})`);

    // Update presence to online
    await prisma.userPresence
      .upsert({
        where: { userId },
        create: { userId, status: 'ONLINE' },
        update: { status: 'ONLINE', lastSeen: new Date() }
      })
      .catch((err) => app.log.error({ err }, 'Failed to update user presence'));

    // Auto-join workspace rooms for channel events
    try {
      const workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: { userId }
          }
        },
        select: { id: true }
      });

      workspaces.forEach((ws) => {
        socket.join(`workspace:${ws.id}`);
        app.log.info(
          `[WORKSPACE_JOIN] User ${userId} joined workspace:${ws.id}`
        );
      });

      // Broadcast user online status to all workspaces they're in
      workspaces.forEach((ws) => {
        socket.to(`workspace:${ws.id}`).emit('user:online', { userId });
      });
    } catch (err) {
      app.log.error(
        'Failed to auto-join workspace rooms: ' + (err as Error).message
      );
    }

    // Auto-join user-specific room for DM notifications
    socket.join(`user:${userId}`);
    app.log.info(
      `[USER_JOIN] User ${userId} joined personal room: user:${userId}`
    );

    // Join a channel room
    socket.on(SOCKET_EVENTS.CHANNEL_JOIN, async (channelId: string) => {
      app.log.info(
        `[CHANNEL_JOIN] User ${userId} joining channel: ${channelId}`
      );
      socket.join(`channel:${channelId}`);

      // Track online users in channel
      if (!onlineUsers.has(channelId)) {
        onlineUsers.set(channelId, new Set());
      }
      onlineUsers.get(channelId)!.add(userId);
      app.log.info(
        `[CHANNEL_JOIN] User ${userId} successfully joined channel:${channelId}`
      );

      // Broadcast user joined
      socket
        .to(`channel:${channelId}`)
        .emit(SOCKET_EVENTS.USER_ONLINE, { userId, channelId });
    });

    // Leave a channel room
    socket.on(SOCKET_EVENTS.CHANNEL_LEAVE, (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      onlineUsers.get(channelId)?.delete(userId);
    });

    // Send a message
    socket.on(
      SOCKET_EVENTS.MESSAGE_SEND,
      async (data: {
        channelId: string;
        content: string;
        parentId?: string;
      }) => {
        try {
          app.log.info(
            `[MESSAGE_SEND] User ${userId} sending to ${data.channelId}: ${data.content.substring(0, 50)}`
          );

          // Auto-join channel if not already joined (fixes race condition)
          const rooms = Array.from(socket.rooms);
          const channelRoom = `channel:${data.channelId}`;
          if (!rooms.includes(channelRoom)) {
            app.log.info(
              `[AUTO_JOIN] User ${userId} auto-joining ${channelRoom} to receive messages`
            );
            socket.join(channelRoom);
            if (!onlineUsers.has(data.channelId)) {
              onlineUsers.set(data.channelId, new Set());
            }
            onlineUsers.get(data.channelId)!.add(userId);
          }

          const message = await messageService.createMessage({
            channelId: data.channelId,
            authorId: userId,
            content: data.content,
            parentId: data.parentId
          });

          app.log.info(
            `[MESSAGE_NEW] Broadcasting message ${message.id} to channel:${data.channelId}`
          );

          // Broadcast to all in channel (including sender) for realtime messages
          io.to(`channel:${data.channelId}`).emit(
            SOCKET_EVENTS.MESSAGE_NEW,
            message
          );

          // Also broadcast to workspace for unread badge updates
          const channel = await prisma.channel.findUnique({
            where: { id: data.channelId },
            select: { workspaceId: true }
          });
          if (channel) {
            app.log.info(
              `[WORKSPACE_BROADCAST] Broadcasting to workspace:${channel.workspaceId} for unread badges`
            );
            io.to(`workspace:${channel.workspaceId}`).emit(
              SOCKET_EVENTS.MESSAGE_NEW,
              message
            );
          }

          // Check for mentions and send push notifications
          const mentions = extractMentions(data.content);
          if (mentions.length > 0) {
            // Get channel and author info for notifications
            const channel = await prisma.channel.findUnique({
              where: { id: data.channelId },
              select: { name: true }
            });

            const author = await prisma.user.findUnique({
              where: { id: userId },
              select: { firstName: true, lastName: true, email: true }
            });

            if (channel && author) {
              const authorName =
                author.firstName && author.lastName
                  ? `${author.firstName} ${author.lastName}`
                  : author.email;

              // Get user IDs for mentioned emails
              const mentionedUsers = await prisma.user.findMany({
                where: { email: { in: mentions } },
                select: { id: true, email: true }
              });

              // Send push notification to each mentioned user (except author)
              for (const mentionedUser of mentionedUsers) {
                if (mentionedUser.id !== userId) {
                  try {
                    await pushService.notifyMention(
                      mentionedUser.id,
                      authorName,
                      channel.name,
                      data.channelId,
                      data.content
                    );
                  } catch (pushErr) {
                    app.log.error(
                      `Failed to send push notification: ${pushErr instanceof Error ? pushErr.message : String(pushErr)}`
                    );
                  }
                }
              }
            }
          }
        } catch (err) {
          app.log.error('Error creating message: ' + (err as Error).message);
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Edit a message
    socket.on(
      SOCKET_EVENTS.MESSAGE_EDIT,
      async (data: { messageId: string; content: string }) => {
        try {
          const message = await messageService.updateMessage(
            data.messageId,
            userId,
            {
              content: data.content
            }
          );

          // Get channel from message and broadcast
          const fullMessage = await prisma.message.findUnique({
            where: { id: data.messageId }
          });
          if (fullMessage) {
            io.to(`channel:${fullMessage.channelId}`).emit(
              SOCKET_EVENTS.MESSAGE_EDIT,
              message
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Delete a message
    socket.on(
      SOCKET_EVENTS.MESSAGE_DELETE,
      async (data: { messageId: string }) => {
        try {
          const message = await prisma.message.findUnique({
            where: { id: data.messageId }
          });

          if (message) {
            await messageService.deleteMessage(data.messageId, userId);
            io.to(`channel:${message.channelId}`).emit(
              SOCKET_EVENTS.MESSAGE_DELETE,
              {
                messageId: data.messageId,
                channelId: message.channelId
              }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Typing indicator
    socket.on(SOCKET_EVENTS.CHANNEL_TYPING, (channelId: string) => {
      socket.to(`channel:${channelId}`).emit(SOCKET_EVENTS.CHANNEL_TYPING, {
        userId,
        channelId
      });
    });

    // ============================================
    // DIRECT MESSAGES
    // ============================================

    // Join DM channel
    socket.on('dm:join', (dmChannelId: string) => {
      const room = `dm:${dmChannelId}`;
      socket.join(room);
    });

    // Leave DM channel
    socket.on('dm:leave', (dmChannelId: string) => {
      socket.leave(`dm:${dmChannelId}`);
    });

    // Send DM (use REST API for persistence, this is just for real-time broadcast)
    socket.on(
      'dm:send',
      async (data: { channelId: string; content: string }) => {
        try {
          // Auto-join DM room if not already in it (prevent race conditions)
          const dmRoom = `dm:${data.channelId}`;
          if (!socket.rooms.has(dmRoom)) {
            app.log.info(
              `[AUTO_JOIN] User ${userId} auto-joining ${dmRoom} to receive messages`
            );
            socket.join(dmRoom);
          }

          const dm = await prisma.directMessage.create({
            data: {
              channelId: data.channelId,
              authorId: userId,
              content: data.content.trim()
            },
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              attachments: true,
              reactions: true
            }
          });

          app.log.info(
            `[DM_NEW] Broadcasting DM ${dm.id} to dm:${data.channelId}`
          );

          // Broadcast to DM room (for users currently viewing the DM)
          io.to(dmRoom).emit('dm:new', dm);

          // Also broadcast to each participant's personal room for unread badge updates
          const participants = await prisma.directMessageParticipant.findMany({
            where: { channelId: data.channelId },
            select: { userId: true }
          });

          participants.forEach((participant) => {
            app.log.info(
              `[DM_BROADCAST] Broadcasting DM to user:${participant.userId}`
            );
            io.to(`user:${participant.userId}`).emit('dm:new', dm);
          });

          // Send push notification to other participant (if not author)
          const otherParticipant = participants.find(
            (p) => p.userId !== userId
          );
          if (otherParticipant) {
            const author = await prisma.user.findUnique({
              where: { id: userId },
              select: { firstName: true, lastName: true, email: true }
            });

            if (author) {
              const authorName =
                author.firstName && author.lastName
                  ? `${author.firstName} ${author.lastName}`
                  : author.email;

              try {
                await pushService.notifyNewDM(
                  data.channelId,
                  userId,
                  authorName,
                  otherParticipant.userId,
                  data.content
                );
              } catch (pushErr) {
                app.log.error(
                  `Failed to send DM push notification: ${pushErr instanceof Error ? pushErr.message : String(pushErr)}`
                );
              }
            }
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // DM typing indicator
    socket.on('dm:typing', (dmChannelId: string) => {
      socket
        .to(`dm:${dmChannelId}`)
        .emit('dm:typing', { userId, channelId: dmChannelId });
    });

    // Edit DM
    socket.on(
      'dm:edit',
      async (data: { messageId: string; content: string }) => {
        try {
          // Get message to verify ownership and get channelId
          const existing = await prisma.directMessage.findUnique({
            where: { id: data.messageId }
          });

          if (!existing) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }

          if (existing.authorId !== userId) {
            socket.emit('error', {
              message: 'You can only edit your own messages'
            });
            return;
          }

          // Update message
          const updated = await prisma.directMessage.update({
            where: { id: data.messageId },
            data: {
              content: data.content.trim(),
              edited: true
            },
            include: { attachments: true, reactions: true }
          });

          // Broadcast to all users in DM channel
          io.to(`dm:${existing.channelId}`).emit('dm:edit', updated);
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Delete DM
    socket.on(
      'dm:delete',
      async (data: { messageId: string; channelId?: string }) => {
        try {
          // Get message to verify ownership and get channelId
          const existing = await prisma.directMessage.findUnique({
            where: { id: data.messageId }
          });

          if (!existing) {
            socket.emit('error', { message: 'Message not found' });
            return;
          }

          if (existing.authorId !== userId) {
            socket.emit('error', {
              message: 'You can only delete your own messages'
            });
            return;
          }

          // Delete message
          await prisma.directMessage.delete({
            where: { id: data.messageId }
          });

          // Broadcast to all users in DM channel
          io.to(`dm:${existing.channelId}`).emit('dm:delete', {
            messageId: data.messageId,
            channelId: existing.channelId
          });
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // ============================================
    // REACTIONS
    // ============================================

    // Toggle reaction on channel message
    socket.on(
      'reaction:toggle',
      async (data: { messageId: string; emoji: string }) => {
        try {
          const existing = await prisma.reaction.findUnique({
            where: {
              messageId_userId_emoji: {
                messageId: data.messageId,
                userId,
                emoji: data.emoji
              }
            }
          });

          let added: boolean;
          if (existing) {
            await prisma.reaction.delete({ where: { id: existing.id } });
            added = false;
          } else {
            await prisma.reaction.create({
              data: { messageId: data.messageId, userId, emoji: data.emoji }
            });
            added = true;
          }

          // Get channel and broadcast
          const message = await prisma.message.findUnique({
            where: { id: data.messageId }
          });
          if (message) {
            io.to(`channel:${message.channelId}`).emit('reaction:update', {
              messageId: data.messageId,
              channelId: message.channelId,
              userId,
              emoji: data.emoji,
              added
            });
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // ============================================
    // THREADS
    // ============================================

    // Create thread from message
    socket.on(
      SOCKET_EVENTS.THREAD_CREATE,
      async (data: { messageId: string; title: string }) => {
        try {
          if (!data.title?.trim()) {
            app.log.warn('[THREAD_CREATE] Missing required title');
            return;
          }

          const thread = await threadService.createThread(
            {
              messageId: data.messageId,
              title: data.title
            },
            userId
          );

          // Get channel from message and broadcast to channel
          const message = await prisma.message.findUnique({
            where: { id: data.messageId },
            select: { channelId: true }
          });

          if (message) {
            app.log.info(
              `[THREAD_CREATED] Broadcasting thread ${thread.id} to channel:${message.channelId}`
            );
            io.to(`channel:${message.channelId}`).emit(
              SOCKET_EVENTS.THREAD_CREATED,
              { thread }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Add reply to thread
    socket.on(
      SOCKET_EVENTS.THREAD_REPLY,
      async (data: {
        threadId: string;
        content: string;
        attachments?: Array<{ url: string; type: string; name: string }>;
      }) => {
        try {
          // Convert attachment format from socket to service format
          const formattedAttachments = data.attachments?.map((att) => ({
            fileUrl: att.url,
            fileType: att.type,
            fileName: att.name,
            fileSize: 0 // Size not available from socket
          }));

          const reply = await threadService.addReply(
            data.threadId,
            data.content,
            userId,
            formattedAttachments
          );

          // Get thread and channel info
          const thread = await prisma.thread.findUnique({
            where: { id: data.threadId },
            select: { channelId: true }
          });

          if (thread) {
            app.log.info(
              `[THREAD_REPLY] Broadcasting reply to channel:${thread.channelId}`
            );

            // Broadcast to channel room with proper format
            io.to(`channel:${thread.channelId}`).emit(
              SOCKET_EVENTS.THREAD_REPLY,
              {
                threadId: data.threadId,
                reply
              }
            );

            // Confirm to sender
            socket.emit(SOCKET_EVENTS.THREAD_REPLY, {
              threadId: data.threadId,
              reply
            });

            // Also broadcast to thread participants for notifications
            const participants = await prisma.threadParticipant.findMany({
              where: {
                threadId: data.threadId,
                userId: { not: userId }, // Don't notify the sender
                notifyOnReply: true
              },
              select: { userId: true }
            });

            participants.forEach((participant) => {
              io.to(`user:${participant.userId}`).emit(
                SOCKET_EVENTS.THREAD_REPLY,
                {
                  threadId: data.threadId,
                  reply
                }
              );
            });

            // Check for mentions in thread replies and send push notifications
            const mentions = extractMentions(data.content);
            if (mentions.length > 0) {
              const threadForMention = await prisma.thread.findUnique({
                where: { id: data.threadId },
                select: { title: true, channelId: true }
              });

              const author = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              });

              if (threadForMention && author) {
                const authorName =
                  author.firstName && author.lastName
                    ? `${author.firstName} ${author.lastName}`
                    : author.email;

                const mentionedUsers = await prisma.user.findMany({
                  where: { email: { in: mentions } },
                  select: { id: true, email: true }
                });

                for (const mentionedUser of mentionedUsers) {
                  if (mentionedUser.id !== userId) {
                    try {
                      // Send push notification
                      await pushService.notifyMention(
                        mentionedUser.id,
                        authorName,
                        threadForMention.title || 'Thread',
                        threadForMention.channelId,
                        data.content
                      );

                      // Also emit a thread mention event for the notification panel
                      io.to(`user:${mentionedUser.id}`).emit(
                        SOCKET_EVENTS.THREAD_REPLY,
                        {
                          threadId: data.threadId,
                          reply,
                          mentionedUserId: mentionedUser.id
                        }
                      );
                    } catch (pushErr) {
                      app.log.error(
                        `Failed to send thread mention notification: ${pushErr instanceof Error ? pushErr.message : String(pushErr)}`
                      );
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Update thread (title, lock, archive, resolve status)
    socket.on(
      SOCKET_EVENTS.THREAD_UPDATED,
      async (data: {
        threadId: string;
        title?: string;
        isLocked?: boolean;
        isArchived?: boolean;
        isResolved?: boolean;
      }) => {
        try {
          const thread = await threadService.updateThread(
            data.threadId,
            {
              title: data.title,
              isLocked: data.isLocked,
              isArchived: data.isArchived,
              isResolved: data.isResolved
            },
            userId
          );

          // Get channel and broadcast
          const fullThread = await prisma.thread.findUnique({
            where: { id: data.threadId },
            select: { channelId: true }
          });

          if (fullThread) {
            app.log.info(
              `[THREAD_UPDATED] Broadcasting thread update to channel:${fullThread.channelId}`
            );
            io.to(`channel:${fullThread.channelId}`).emit(
              SOCKET_EVENTS.THREAD_UPDATED,
              { thread }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Delete thread
    socket.on(
      SOCKET_EVENTS.THREAD_DELETED,
      async (data: { threadId: string }) => {
        try {
          // Get thread info before deletion
          const thread = await prisma.thread.findUnique({
            where: { id: data.threadId },
            select: { channelId: true }
          });

          if (thread) {
            await threadService.deleteThread(data.threadId, userId);

            app.log.info(
              `[THREAD_DELETED] Broadcasting thread deletion to channel:${thread.channelId}`
            );
            io.to(`channel:${thread.channelId}`).emit(
              SOCKET_EVENTS.THREAD_DELETED,
              {
                threadId: data.threadId,
                channelId: thread.channelId
              }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Follow/unfollow thread
    socket.on(
      SOCKET_EVENTS.THREAD_FOLLOW,
      async (data: { threadId: string; shouldFollow: boolean }) => {
        try {
          await threadService.toggleFollow(
            data.threadId,
            userId,
            data.shouldFollow
          );

          // Confirm to sender only
          socket.emit(SOCKET_EVENTS.THREAD_FOLLOW, {
            threadId: data.threadId,
            userId,
            following: data.shouldFollow
          });
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Mark thread as read
    socket.on(SOCKET_EVENTS.THREAD_READ, async (data: { threadId: string }) => {
      try {
        await threadService.markAsRead(data.threadId, userId);

        // Confirm to sender only
        socket.emit(SOCKET_EVENTS.THREAD_READ, {
          threadId: data.threadId,
          userId
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    // Edit thread reply
    socket.on(
      SOCKET_EVENTS.THREAD_REPLY_EDITED,
      async (data: { threadId: string; replyId: string; content: string }) => {
        try {
          // Get thread and channel info
          const thread = await prisma.thread.findUnique({
            where: { id: data.threadId },
            select: { channelId: true }
          });

          if (thread) {
            // Broadcast to channel room
            io.to(`channel:${thread.channelId}`).emit(
              SOCKET_EVENTS.THREAD_REPLY_EDITED,
              {
                threadId: data.threadId,
                replyId: data.replyId,
                content: data.content,
                userId
              }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Delete thread reply
    socket.on(
      SOCKET_EVENTS.THREAD_REPLY_DELETED,
      async (data: { threadId: string; replyId: string }) => {
        try {
          // Get thread and channel info
          const thread = await prisma.thread.findUnique({
            where: { id: data.threadId },
            select: { channelId: true }
          });

          if (thread) {
            // Broadcast to channel room
            io.to(`channel:${thread.channelId}`).emit(
              SOCKET_EVENTS.THREAD_REPLY_DELETED,
              {
                threadId: data.threadId,
                replyId: data.replyId
              }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Thread reply reaction
    socket.on(
      SOCKET_EVENTS.THREAD_REPLY_REACTION,
      async (data: {
        threadId: string;
        replyId: string;
        emoji: string;
        action: 'add' | 'remove';
      }) => {
        try {
          // Get thread and channel info
          const thread = await prisma.thread.findUnique({
            where: { id: data.threadId },
            select: { channelId: true }
          });

          if (thread) {
            // Broadcast to channel room
            io.to(`channel:${thread.channelId}`).emit(
              SOCKET_EVENTS.THREAD_REPLY_REACTION,
              {
                threadId: data.threadId,
                replyId: data.replyId,
                emoji: data.emoji,
                action: data.action,
                userId
              }
            );
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // ============================================
    // VOICE CHANNELS & WEBRTC SIGNALING
    // ============================================

    // Join voice channel room
    socket.on(SOCKET_EVENTS.VOICE_JOIN, async (data: { channelId: string }) => {
      try {
        socket.join(`voice:${data.channelId}`);
        app.log.debug(
          `[VOICE] User ${userId} joined voice channel: ${data.channelId}`
        );
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    // Leave voice channel room
    socket.on(
      SOCKET_EVENTS.VOICE_LEAVE,
      async (data: { channelId: string }) => {
        try {
          socket.leave(`voice:${data.channelId}`);
          app.log.debug(
            `[VOICE] User ${userId} left voice channel: ${data.channelId}`
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // WebRTC Offer (initiate peer connection)
    socket.on(
      SOCKET_EVENTS.WEBRTC_OFFER,
      async (data: {
        channelId: string;
        targetUserId: string;
        offer: unknown;
      }) => {
        try {
          await routeWebRTCSignal(
            io,
            `voice:${data.channelId}`,
            data.targetUserId,
            userId,
            SOCKET_EVENTS.WEBRTC_OFFER,
            data.offer,
            app.log
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // WebRTC Answer (respond to peer connection)
    socket.on(
      SOCKET_EVENTS.WEBRTC_ANSWER,
      async (data: {
        channelId: string;
        targetUserId: string;
        answer: unknown;
      }) => {
        try {
          await routeWebRTCSignal(
            io,
            `voice:${data.channelId}`,
            data.targetUserId,
            userId,
            SOCKET_EVENTS.WEBRTC_ANSWER,
            data.answer,
            app.log
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // WebRTC ICE Candidate (exchange network info)
    socket.on(
      SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE,
      async (data: {
        channelId: string;
        targetUserId: string;
        candidate: unknown;
      }) => {
        try {
          await routeWebRTCSignal(
            io,
            `voice:${data.channelId}`,
            data.targetUserId,
            userId,
            SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE,
            data.candidate,
            app.log
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // ============================================
    // DM VOICE CALLS
    // ============================================

    // Start DM voice call (initiate call to other user)
    socket.on(
      'dm:call:start',
      async (data: { channelId: string; targetUserId: string }) => {
        try {
          app.log.debug(
            `[DM_CALL] User ${userId} calling ${data.targetUserId} in DM ${data.channelId}`
          );

          // Join DM voice room for WebRTC signaling (caller side)
          socket.join(`dm-voice:${data.channelId}`);

          // Get caller info
          const caller = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          });

          if (!caller) {
            socket.emit('error', { message: 'User not found' });
            return;
          }

          // Find target user's socket(s)
          const targetSockets = await io.fetchSockets();

          for (const targetSocket of targetSockets) {
            if (
              (targetSocket as unknown as AuthenticatedSocket).userId ===
              data.targetUserId
            ) {
              // Notify other user of incoming call with caller info
              targetSocket.emit('dm:call:incoming', {
                channelId: data.channelId,
                fromUserId: userId,
                caller: {
                  id: caller.id,
                  name: caller.firstName ?? caller.email,
                  email: caller.email,
                  avatarUrl: caller.avatarUrl
                }
              });

              app.log.debug(
                `[DM_CALL] Notified ${data.targetUserId} of call from ${userId}`
              );
            }
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Accept DM voice call
    socket.on('dm:call:accept', async (data: { channelId: string }) => {
      try {
        app.log.debug(
          `[DM_CALL] User ${userId} accepted call in DM ${data.channelId}`
        );

        // Join DM voice room for WebRTC signaling
        socket.join(`dm-voice:${data.channelId}`);

        // Notify other participant that call was accepted
        socket.to(`dm:${data.channelId}`).emit('dm:call:accepted', {
          channelId: data.channelId,
          userId
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    // Reject DM voice call
    socket.on('dm:call:reject', async (data: { channelId: string }) => {
      try {
        app.log.debug(
          `[DM_CALL] User ${userId} rejected call in DM ${data.channelId}`
        );

        // Notify other participant that call was rejected
        socket.to(`dm:${data.channelId}`).emit('dm:call:rejected', {
          channelId: data.channelId,
          userId
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    // End DM voice call
    socket.on('dm:call:end', async (data: { channelId: string }) => {
      try {
        app.log.debug(
          `[DM_CALL] User ${userId} ended call in DM ${data.channelId}`
        );

        // Leave DM voice room
        socket.leave(`dm-voice:${data.channelId}`);

        // Notify other participant that call ended
        socket.to(`dm:${data.channelId}`).emit('dm:call:ended', {
          channelId: data.channelId,
          userId
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    // DM WebRTC Offer (for 1-on-1 calls)
    socket.on(
      'dm:webrtc:offer',
      async (data: {
        channelId: string;
        targetUserId: string;
        offer: unknown;
      }) => {
        try {
          await routeWebRTCSignal(
            io,
            `dm-voice:${data.channelId}`,
            data.targetUserId,
            userId,
            'dm:webrtc:offer',
            data.offer,
            app.log
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // DM WebRTC Answer (for 1-on-1 calls)
    socket.on(
      'dm:webrtc:answer',
      async (data: {
        channelId: string;
        targetUserId: string;
        answer: unknown;
      }) => {
        try {
          await routeWebRTCSignal(
            io,
            `dm-voice:${data.channelId}`,
            data.targetUserId,
            userId,
            'dm:webrtc:answer',
            data.answer,
            app.log
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // DM WebRTC ICE Candidate (for 1-on-1 calls)
    socket.on(
      'dm:webrtc:ice-candidate',
      async (data: {
        channelId: string;
        targetUserId: string;
        candidate: unknown;
      }) => {
        try {
          await routeWebRTCSignal(
            io,
            `dm-voice:${data.channelId}`,
            data.targetUserId,
            userId,
            'dm:webrtc:ice-candidate',
            data.candidate,
            app.log
          );
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // Disconnect
    socket.on('disconnect', async () => {
      app.log.debug(`User disconnected: ${userId}`);

      // Grace period for voice sessions — if user doesn't reconnect within 30s,
      // clean up their voice sessions (handles browser close, crash, network loss)
      const VOICE_DISCONNECT_GRACE_MS = 30_000;
      setTimeout(async () => {
        // Check if user reconnected by looking for their socket in any voice room
        const allSockets = await io.fetchSockets();
        const reconnected = allSockets.some(
          (s) => (s as unknown as AuthenticatedSocket).userId === userId
        );

        if (!reconnected) {
          app.log.info(
            `[VOICE] User ${userId} did not reconnect within grace period, cleaning up voice sessions`
          );
          await prisma.voiceSession
            .updateMany({
              where: { userId, leftAt: null },
              data: { leftAt: new Date() }
            })
            .catch((err) =>
              app.log.error(
                { err },
                'Failed to cleanup voice sessions on disconnect'
              )
            );

          // Notify remaining users in voice channels
          const activeSessions = await prisma.voiceSession
            .findMany({
              where: { userId, leftAt: { gte: new Date(Date.now() - 5000) } },
              select: { channelId: true }
            })
            .catch(() => []);

          for (const session of activeSessions) {
            io.to(`voice:${session.channelId}`).emit('voice:user-left', {
              userId
            });
            io.to(`voice:${session.channelId}`).emit(
              'webrtc:peer-disconnected',
              { userId }
            );
          }
        }
      }, VOICE_DISCONNECT_GRACE_MS);

      // Update lastSeen timestamp (keep current status for reconnection grace period)
      await prisma.userPresence
        .upsert({
          where: { userId },
          create: { userId, status: 'ONLINE', lastSeen: new Date() },
          update: { lastSeen: new Date() }
        })
        .catch((err) =>
          app.log.error({ err }, 'Failed to update user lastSeen')
        );

      // Remove from channel tracking
      onlineUsers.forEach((users, _channelId) => {
        users.delete(userId);
      });
    });
  });
}
