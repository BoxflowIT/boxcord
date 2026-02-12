// Socket.io Client Service
import { io, Socket } from 'socket.io-client';
import { useChatStore, Message } from '../store/chat';
import { useAuthStore } from '../store/auth';

class SocketService {
  private socket: Socket | null = null;
  private dmMessageHandlers: Map<string, (message: Message) => void> =
    new Map();

  connect() {
    const token = useAuthStore.getState().token;
    if (!token || this.socket?.connected) return;

    this.socket = io(window.location.origin, {
      auth: { token },
      transports: ['polling', 'websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    // Message events
    this.socket.on('message:new', (message: Message) => {
      useChatStore.getState().addMessage(message);
    });

    this.socket.on('message:edit', (message: Message) => {
      useChatStore.getState().updateMessage(message);
    });

    this.socket.on('message:delete', ({ messageId }: { messageId: string }) => {
      useChatStore.getState().removeMessage(messageId);
    });

    // Typing indicator
    this.socket.on(
      'channel:typing',
      ({ userId, channelId }: { userId: string; channelId: string }) => {
        useChatStore.getState().setTyping(channelId, userId);
        // Clear after 3 seconds
        setTimeout(() => {
          useChatStore.getState().clearTyping(channelId, userId);
        }, 3000);
      }
    );

    // Reaction updates
    this.socket.on(
      'reaction:update',
      (data: {
        messageId: string;
        userId: string;
        emoji: string;
        added: boolean;
      }) => {
        // Handle reaction update - could update message in store
        console.log('Reaction update:', data);
      }
    );

    // DM events
    this.socket.on('dm:new', (message: Message) => {
      // Notify any active DM handlers
      this.dmMessageHandlers.forEach((handler) => handler(message));
    });

    this.socket.on(
      'dm:typing',
      ({ userId, channelId }: { userId: string; channelId: string }) => {
        console.log('DM typing:', userId, channelId);
      }
    );

    // Presence
    this.socket.on('user:online', ({ userId }: { userId: string }) => {
      console.log('User online:', userId);
    });

    this.socket.on('user:offline', ({ userId }: { userId: string }) => {
      console.log('User offline:', userId);
    });

    // Errors
    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Channel methods
  joinChannel(channelId: string) {
    this.socket?.emit('channel:join', channelId);
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', channelId);
  }

  sendMessage(channelId: string, content: string, parentId?: string) {
    this.socket?.emit('message:send', { channelId, content, parentId });
  }

  editMessage(messageId: string, content: string) {
    this.socket?.emit('message:edit', { messageId, content });
  }

  deleteMessage(messageId: string) {
    this.socket?.emit('message:delete', { messageId });
  }

  sendTyping(channelId: string) {
    this.socket?.emit('channel:typing', channelId);
  }

  // Reaction methods
  toggleReaction(messageId: string, emoji: string) {
    this.socket?.emit('reaction:toggle', { messageId, emoji });
  }

  // DM methods
  joinDM(channelId: string) {
    this.socket?.emit('dm:join', channelId);
  }

  leaveDM(channelId: string) {
    this.socket?.emit('dm:leave', channelId);
  }

  sendDM(channelId: string, content: string) {
    this.socket?.emit('dm:send', { channelId, content });
  }

  sendDMTyping(channelId: string) {
    this.socket?.emit('dm:typing', channelId);
  }

  // Register handler for DM messages
  onDMMessage(id: string, handler: (message: Message) => void) {
    this.dmMessageHandlers.set(id, handler);
  }

  offDMMessage(id: string) {
    this.dmMessageHandlers.delete(id);
  }
}

export const socketService = new SocketService();
