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

// Utility: Decode base64url (JWT payload)
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString();
}

export function setupSocketHandlers(
  io: Server,
  app: FastifyInstance,
  prisma: PrismaClient
) {
  const messageService = new MessageService(prisma);
  const onlineUsers = new Map<string, Set<string>>(); // channelId -> Set of userIds
  const isDev = process.env.NODE_ENV !== 'production';
  const allowMockTokens = isDev || process.env.ALLOW_MOCK_TOKENS === 'true';

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

      // Decode JWT manually (Cognito tokens)
      // Note: We don't verify signature here - it was verified during HTTP auth
      const parts = token.split('.');
      if (parts.length !== 3) {
        app.log.error('Socket auth: Invalid JWT format');
        return next(new Error('Invalid token format'));
      }

      const payload = JSON.parse(decodeBase64Url(parts[1]));
      if (!payload.sub) {
        app.log.error('Socket auth: No sub claim in token');
        return next(new Error('Invalid token - missing sub'));
      }

      socket.userId = payload.sub;
      socket.email = payload.email;
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
    app.log.debug(`User connected: ${userId}`);

    // Update presence to online
    prisma.userPresence
      .upsert({
        where: { userId },
        create: { userId, status: 'ONLINE' },
        update: { status: 'ONLINE', lastSeen: new Date() }
      })
      .catch(console.error);

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
        app.log.debug(`User ${userId} joined workspace room: ${ws.id}`);
      });
    } catch (err) {
      app.log.error(
        'Failed to auto-join workspace rooms: ' + (err as Error).message
      );
    }

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
