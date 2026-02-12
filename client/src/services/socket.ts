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
    if (!token) {
      console.error('Socket: No token available, cannot connect');
      return;
    }
    if (this.socket) {
      if (this.socket.connected) {
        console.log('Socket: Already connected');
        return;
      }
      console.log('Socket: Socket exists but not connected, reconnecting...');
      this.socket.connect();
      return;
    }

    console.log(
      'Socket: Connecting with token:',
      token.substring(0, 20) + '...'
    );

    // Always connect directly to backend (bypassing Vite proxy which has issues with socket.io)
    const socketUrl = import.meta.env.DEV
      ? 'http://localhost:3001'
      : window.location.origin;
    console.log('Socket: Connection URL:', socketUrl);

    // Create socket with minimal config first
    console.log('Socket: Creating socket instance...');
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['polling'], // Use only polling for reliability
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    console.log(
      'Socket: Instance created, type:',
      typeof socket,
      'connected:',
      socket.connected
    );
    this.socket = socket;

    // Register event listeners
    socket.on('connect', () => {
      console.log(
        '✅ Socket: Connected! ID:',
        socket.id,
        'Transport:',
        socket.io?.engine?.transport?.name
      );
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket: Connection error:', error.message);
      console.error('Error details:', {
        type: error.type,
        description: error.description,
        context: error.context
      });
    });

    socket.on('disconnect', (reason, details) => {
      console.log('🔌 Socket: Disconnected, reason:', reason);
      if (details) console.log('Disconnect details:', details);
    });

    console.log('Socket: Event handlers registered. Connecting now...');
    socket.connect(); // Use connect() instead of open()
    console.log('Socket: Connection initiated');

    // Fallback: Check connection after 2 seconds
    setTimeout(() => {
      if (!socket.connected) {
        console.warn('⚠️ Socket: Not connected after 2s. State:', {
          connected: socket.connected,
          disconnected: socket.disconnected,
          active: socket.active
        });
        if (!socket.connected && !socket.active) {
          console.log('🔄 Socket: Forcing reconnect...');
          socket.disconnect().connect();
        }
      }
    }, 2000);

    // Message events
    socket.on('message:new', (message: Message) => {
      console.log('✅ Socket: Received new message:', message);
      useChatStore.getState().addMessage(message);
    });

    this.socket.on('message:edit', (message: Message) => {
      console.log('✏️ Socket: Message edited:', message.id);
      useChatStore.getState().updateMessage(message);
    });

    this.socket.on('message:delete', ({ messageId }: { messageId: string }) => {
      console.log('🗑️ Socket: Message deleted:', messageId);
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

  // Ensure socket is connected (auto-connect if needed)
  private ensureConnected(): boolean {
    if (!this.socket || this.socket.disconnected) {
      console.log('🔄 Socket: Auto-connecting...');
      this.connect();
      return false; // Not connected yet
    }
    return true;
  }

  // Channel methods
  joinChannel(channelId: string) {
    if (!this.ensureConnected()) {
      console.log('🔗 Socket: Queueing join for when connected:', channelId);
      // Queue for connection
      if (this.socket) {
        this.socket.once('connect', () => {
          console.log('🔗 Socket: Joining channel (queued):', channelId);
          this.socket!.emit('channel:join', channelId);
        });
      }
      return;
    }
    console.log('🔗 Socket: Joining channel now:', channelId);
    this.socket.emit('channel:join', channelId);
  }

  leaveChannel(channelId: string) {
    if (!this.socket) return;
    this.socket.emit('channel:leave', channelId);
  }

  sendMessage(channelId: string, content: string, parentId?: string) {
    if (!this.ensureConnected()) {
      console.error('❌ Socket: Not connected - attempting to connect...');
      // Queue the message for after connection
      this.socket?.once('connect', () => {
        console.log('📤 Socket: Sending queued message to:', channelId);
        this.socket!.emit('message:send', { channelId, content, parentId });
      });
      return;
    }
    console.log('📤 Socket: Sending message to:', channelId);
    this.socket.emit('message:send', { channelId, content, parentId });
  }

  editMessage(messageId: string, content: string) {
    if (!this.ensureConnected()) {
      console.error('❌ Socket: Not connected - cannot edit message');
      return;
    }
    console.log('✏️ Socket: Editing message:', messageId);
    this.socket!.emit('message:edit', { messageId, content });
  }

  deleteMessage(messageId: string) {
    if (!this.ensureConnected()) {
      console.error('❌ Socket: Not connected - cannot delete message');
      return;
    }
    console.log('🗑️ Socket: Deleting message:', messageId);
    this.socket!.emit('message:delete', { messageId });
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

// Preserve socket instance across HMR reloads
let socketServiceInstance: SocketService;

if (import.meta.hot?.data.socketService) {
  // Reuse existing instance after HMR
  console.log('♻️ HMR: Reusing existing socket service');
  socketServiceInstance = import.meta.hot.data.socketService;
} else {
  // Create new instance
  socketServiceInstance = new SocketService();
}

export const socketService = socketServiceInstance;

// Hot Module Replacement: preserve socket across reloads
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose((data) => {
    console.log('♻️ HMR: Preserving socket service for next reload');
    // Store the instance for next reload
    data.socketService = socketServiceInstance;
  });
}
