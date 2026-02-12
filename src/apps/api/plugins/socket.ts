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

  console.log(
    '⚙️ Setting up Socket.io handlers, allowMockTokens:',
    allowMockTokens
  );

  // Auth middleware - verify JWT before allowing connection
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      console.log('🔐 Socket auth: New connection attempt');
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error('❌ Socket auth: No token provided');
        return next(new Error('Authentication required'));
      }

      console.log(
        '🔑 Socket auth: Token received:',
        token.substring(0, 20) + '...'
      );

      // Handle mock tokens (for development)
      if (allowMockTokens && token.startsWith('mock.')) {
        console.log('🧪 Socket auth: Mock token detected');
        const parts = token.split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString()
            );
            socket.userId = payload.sub || payload.userId;
            socket.email = payload.email;
            console.log(
              '✅ Socket auth: Mock token accepted for user:',
              socket.userId
            );
            return next();
          } catch {
            console.error('❌ Socket auth: Invalid mock token format');
            return next(new Error('Invalid mock token'));
          }
        }
      }

      // Verify JWT (decode for now - Cognito tokens are verified via JWKS in HTTP routes)
      // Note: app.jwt.decode returns { header, payload } when complete: true
      const decoded = app.jwt.decode(token) as {
        header?: unknown;
        payload?: { sub: string; email?: string };
        sub?: string;
        email?: string;
      } | null;

      if (!decoded) {
        app.log.error('Socket auth: Failed to decode token');
        console.error('❌ Socket auth: Failed to decode token');
        return next(new Error('Invalid token'));
      }

      // Handle both complete and non-complete decode formats
      const payload = decoded.payload || decoded;
      const sub = payload.sub;
      const email = payload.email;

      if (!sub) {
        app.log.error('Socket auth: No sub claim in token');
        console.error('❌ Socket auth: No sub claim in token');
        return next(new Error('Invalid token - missing sub'));
      }

      socket.userId = sub;
      socket.email = email;
      console.log('✅ Socket auth: Token accepted for user:', sub);
      next();
    } catch (err) {
      console.error('❌ Socket auth: Authentication failed:', err);
      next(new Error('Authentication failed'));
    }
  });

  // Debug: Log all connection attempts before middleware
  io.engine.on('connection_error', (err) => {
    console.log('🚫 Socket.io engine connection error:', err);
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    app.log.debug(`User connected: ${userId}`);
    console.log('👤 User connected via Socket.io:', userId);

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
      console.log('🚪 Backend: User', userId, 'joining channel:', channelId);
      socket.join(`channel:${channelId}`);
      console.log(
        '✅ Backend: User joined room. Current rooms:',
        Array.from(socket.rooms)
      );

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
          console.log(
            '📩 Backend: Received message from user:',
            userId,
            'channel:',
            data.channelId,
            'content:',
            data.content
          );

          const message = await messageService.createMessage({
            channelId: data.channelId,
            authorId: userId,
            content: data.content,
            parentId: data.parentId
          });

          console.log('💾 Backend: Message saved to DB:', message.id);

          // Broadcast to all in channel (including sender)
          io.to(`channel:${data.channelId}`).emit(
            SOCKET_EVENTS.MESSAGE_NEW,
            message
          );

          console.log(
            '📡 Backend: Broadcasted message to channel:',
            data.channelId,
            'rooms:',
            Array.from(socket.rooms)
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
