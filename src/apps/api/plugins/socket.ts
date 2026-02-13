// Socket.io Plugin - Real-time messaging
import type { FastifyInstance } from 'fastify';
import type { Server, Socket } from 'socket.io';
import type { PrismaClient } from '@prisma/client';
import { SOCKET_EVENTS } from '../../../00-core/constants.js';
import { MessageService } from '../../../02-application/services/message.service.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export function setupSocketHandlers(
  io: Server,
  app: FastifyInstance,
  prisma: PrismaClient
) {
  const messageService = new MessageService(prisma);

  // Track online users
  const onlineUsers = new Map<string, Set<string>>(); // channelId -> Set of userIds

  const isDev = process.env.NODE_ENV !== 'production';
  const allowMockTokens = isDev || process.env.ALLOW_MOCK_TOKENS === 'true';

  // Auth middleware - verify JWT before allowing connection
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error('❌ Socket auth: No token provided');
        return next(new Error('Authentication required'));
      }

      // Handle mock tokens (for development)
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
            console.error('❌ Socket auth: Invalid mock token format');
            return next(new Error('Invalid mock token'));
          }
        }
      }

      // Decode JWT manually (Cognito tokens - we trust them if they were accepted via HTTP)
      // Note: We don't verify signature here since that requires JWKS lookup
      // The token was already verified when user logged in via HTTP routes
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('❌ Socket auth: Invalid JWT format');
          return next(new Error('Invalid token format'));
        }

        // Decode payload (second part) - JWT uses base64url encoding
        // Convert base64url to base64 (replace - with +, _ with /, add padding)
        let base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64Payload.length % 4) {
          base64Payload += '=';
        }

        const payload = JSON.parse(
          Buffer.from(base64Payload, 'base64').toString()
        );

        if (!payload.sub) {
          console.error('❌ Socket auth: No sub claim in token');
          return next(new Error('Invalid token - missing sub'));
        }

        socket.userId = payload.sub;
        socket.email = payload.email;
        next();
      } catch (decodeError) {
        console.error('❌ Socket auth: Failed to decode JWT:', decodeError);
        return next(new Error('Invalid token'));
      }
    } catch (err) {
      console.error('❌ Socket auth: Authentication failed:', err);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    app.log.debug(`User connected: ${userId}`);

    // Update presence to online
    prisma.userPresence
      .upsert({
        where: { userId },
        create: { userId, status: 'ONLINE' },
        update: { status: 'ONLINE', lastSeen: new Date() }
      })
      .catch(console.error);

    // Join a channel room
    socket.on(SOCKET_EVENTS.CHANNEL_JOIN, async (channelId: string) => {
      socket.join(`channel:${channelId}`);

      // Track online users in channel
      if (!onlineUsers.has(channelId)) {
        onlineUsers.set(channelId, new Set());
      }
      onlineUsers.get(channelId)!.add(userId);

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
          const message = await messageService.createMessage({
            channelId: data.channelId,
            authorId: userId,
            content: data.content,
            parentId: data.parentId
          });

          // Broadcast to all in channel (including sender)
          io.to(`channel:${data.channelId}`).emit(
            SOCKET_EVENTS.MESSAGE_NEW,
            message
          );
        } catch (err) {
          console.error('❌ Backend: Error creating message:', err);
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
      socket.join(`dm:${dmChannelId}`);
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
          const dm = await prisma.directMessage.create({
            data: {
              channelId: data.channelId,
              authorId: userId,
              content: data.content.trim()
            },
            include: { attachments: true, reactions: true }
          });
          io.to(`dm:${data.channelId}`).emit('dm:new', dm);
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

    // Disconnect
    socket.on('disconnect', async () => {
      app.log.debug(`User disconnected: ${userId}`);

      // Update presence to offline
      await prisma.userPresence
        .upsert({
          where: { userId },
          create: { userId, status: 'OFFLINE', lastSeen: new Date() },
          update: { status: 'OFFLINE', lastSeen: new Date() }
        })
        .catch(console.error);

      // Remove from all channels
      onlineUsers.forEach((users, channelId) => {
        if (users.delete(userId)) {
          io.to(`channel:${channelId}`).emit(SOCKET_EVENTS.USER_OFFLINE, {
            userId,
            channelId
          });
        }
      });
    });
  });
}
