// Socket.io Client Service
import { io, Socket } from 'socket.io-client';
import { useChatStore, Message } from '../store/chat';
import { useAuthStore } from '../store/auth';

class SocketService {
  private socket: Socket | null = null;
  private dmMessageHandlers: Map<string, (message: Message) => void> =
    new Map();
  private connecting: boolean = false;
  private pendingOperations: Array<() => void> = [];

  connect() {
    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('Socket: No token available, cannot connect');
      return;
    }

    // Already connected
    if (this.socket?.connected) {
      console.log('Socket: Already connected');
      this.executePendingOperations();
      return;
    }

    // Currently connecting
    if (this.connecting) {
      console.log('Socket: Connection already in progress...');
      return;
    }

    // Socket exists but disconnected - reconnect
    if (this.socket && !this.socket.connected) {
      console.log('Socket: Socket exists but not connected, reconnecting...');
      this.connecting = true;
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

    // Create socket with optimized config
    console.log('Socket: Creating socket instance...');
    this.connecting = true;
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'], // Try websocket after polling
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 15000,
      forceNew: false, // Reuse connection if possible
      autoConnect: false // We'll connect manually
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
      this.connecting = false;
      console.log(
        '✅ Socket: Connected! ID:',
        socket.id,
        'Transport:',
        socket.io?.engine?.transport?.name
      );
      this.executePendingOperations();
    });

    socket.on('connect_error', (error) => {
      this.connecting = false;
      console.error('❌ Socket: Connection error:', error.message);
    });

    socket.on('disconnect', (reason, details) => {
      this.connecting = false;
      console.log('🔌 Socket: Disconnected, reason:', reason);
      if (details) console.log('Disconnect details:', details);
    });

    console.log('Socket: Event handlers registered. Connecting now...');
    socket.connect();
    console.log('Socket: Connection initiated');

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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connecting = false;
      this.pendingOperations = [];
    }
  }

  // Execute pending operations after connection
  private executePendingOperations() {
    while (this.pendingOperations.length > 0) {
      const operation = this.pendingOperations.shift();
      if (operation) operation();
    }
  }

  // Helper to queue or execute socket operation
  private queueOrExecute(
    operation: () => void,
    logMessage?: string
  ): void {
    if (!this.ensureConnected()) {
      if (logMessage) {
        console.log(`🔗 Socket: Queueing ${logMessage} for when connected`);
      }
      this.pendingOperations.push(operation);
      return;
    }
    operation();
  }

  // Helper to emit socket event
  private emit(event: string, data: unknown, logMessage?: string): void {
    this.queueOrExecute(() => {
      if (this.socket && this.socket.connected) {
        if (logMessage) {
          console.log(logMessage);
        }
        this.socket.emit(event, data);
      }
    }, logMessage?.replace(/^.*Socket: /, ''));
  }

  // Ensure socket is connected (auto-connect if needed)
  private ensureConnected(): boolean {
    if (!this.socket || this.socket.disconnected) {
      if (!this.connecting) {
        console.log('🔄 Socket: Auto-connecting...');
        this.connect();
      }
      return false; // Not connected yet
    }
    return true;
  }

  // Channel methods
  joinChannel(channelId: string) {
    this.emit(
      'channel:join',
      channelId,
      `🔗 Socket: Joining channel: ${channelId}`
    );
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', channelId);
  }

  sendMessage(channelId: string, content: string, parentId?: string) {
    this.emit(
      'message:send',
      { channelId, content, parentId },
      `📤 Socket: Sending message to: ${channelId}`
    );
  }

  editMessage(messageId: string, content: string) {
    this.emit(
      'message:edit',
      { messageId, content },
      `✏️ Socket: Editing message: ${messageId}`
    );
  }

  deleteMessage(messageId: string) {
    this.emit(
      'message:delete',
      { messageId },
      `🗑️ Socket: Deleting message: ${messageId}`
    );
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

  editDM(messageId: string, content: string) {
    this.emit(
      'dm:edit',
      { messageId, content },
      `✏️ Socket: Editing DM: ${messageId}`
    );
  }

  deleteDM(messageId: string) {
    this.emit(
      'dm:delete',
      { messageId },
      `🗑️ Socket: Deleting DM: ${messageId}`
    );
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
