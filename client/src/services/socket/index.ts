// ============================================================================
// SOCKET SERVICE - WebSocket-First Architecture (Refactored)
// ============================================================================
// All server data updates go through React Query cache
// Zustand only holds transient UI state (typing indicators)
// ============================================================================

import { io, Socket } from 'socket.io-client';
import { QueryClient } from '@tanstack/react-query';
import { useChatStore } from '../../store/chat';
import { useAuthStore } from '../../store/auth';
import { logger } from '../../utils/logger';
import type { Message } from '../../types';
import type { SocketHandlerContext } from './types';
import {
  registerMessageHandlers,
  registerDMHandlers,
  registerChannelHandlers,
  registerVoiceHandlers,
  registerPresenceHandlers,
  registerCategoryHandlers,
  registerModerationHandlers,
  registerUserStatusHandlers,
  onDMMessage,
  offDMMessage,
  onDMEdit,
  offDMEdit,
  onDMDelete,
  offDMDelete,
  onPresenceUpdate,
  offPresenceUpdate
} from './handlers';

// QueryClient instance for cache updates
let queryClient: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClient = client;
}

export function getQueryClient(): QueryClient | null {
  return queryClient;
}

class SocketService {
  private socket: Socket | null = null;
  private connecting: boolean = false;
  private pendingOperations: Array<() => void> = [];
  private listenersRegistered: boolean = false;

  connect() {
    const token = useAuthStore.getState().token;
    if (!token) {
      logger.error('Socket: No token available, cannot connect');
      return;
    }

    // Already connected
    if (this.socket?.connected) {
      logger.log('Socket: Already connected');
      this.executePendingOperations();
      return;
    }

    // Currently connecting
    if (this.connecting) {
      logger.debug(
        'Socket: Connection already in progress, skipping duplicate connect'
      );
      return;
    }

    // Socket exists but disconnected - clean up and create fresh connection
    if (this.socket && !this.socket.connected) {
      logger.log('Socket: Cleaning up old socket before reconnecting...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.listenersRegistered = false;
    }

    // Always connect directly to backend
    const socketUrl = import.meta.env.DEV
      ? 'http://localhost:3001'
      : window.location.origin;

    // Create socket with optimized config
    this.connecting = true;
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 15000,
      forceNew: true,
      autoConnect: false,
      closeOnBeforeunload: true
    });

    this.socket = socket;

    // Register connection event handlers
    socket.on('connect', () => {
      this.connecting = false;
      this.executePendingOperations();
    });

    socket.on('connect_error', (error) => {
      this.connecting = false;
      logger.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (_reason) => {
      this.connecting = false;
    });

    socket.on('error', (error: { message: string }) => {
      logger.error('Socket error:', error.message);
    });

    socket.connect();

    // Only register event listeners once PER SOCKET INSTANCE
    if (this.listenersRegistered) {
      return;
    }
    this.listenersRegistered = true;

    // Create handler context
    if (!queryClient) {
      logger.error('[SOCKET] QueryClient not set, cannot register handlers');
      return;
    }

    const context: SocketHandlerContext = {
      socket,
      queryClient,
      getCurrentUserId: () => useAuthStore.getState().user?.id,
      getCurrentWorkspaceId: () => useChatStore.getState().currentWorkspace?.id,
      isViewingChannel: (channelId: string) =>
        window.location.pathname.includes(`/chat/channels/${channelId}`),
      isViewingDM: (channelId: string) =>
        window.location.pathname.includes(`/chat/dm/${channelId}`)
    };

    // Register all handlers
    registerMessageHandlers(context);
    registerDMHandlers(context, this.emit.bind(this));
    registerChannelHandlers(context);
    registerVoiceHandlers(context);
    registerPresenceHandlers(context);
    registerCategoryHandlers(context);
    registerModerationHandlers(context);
    registerUserStatusHandlers(context);
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connecting = false;
      this.pendingOperations = [];
      this.listenersRegistered = false;
    }
  }

  // Clean up socket for HMR reloads
  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connecting = false;
      this.pendingOperations = [];
      this.listenersRegistered = false;
    }
  }

  // Reconnect with new token (after login)
  reconnect() {
    this.disconnect();
    this.connect();
  }

  // Execute pending operations after connection
  private executePendingOperations() {
    while (this.pendingOperations.length > 0) {
      const operation = this.pendingOperations.shift();
      if (operation) operation();
    }
  }

  // Helper to queue or execute socket operation
  private queueOrExecute(operation: () => void): void {
    if (!this.ensureConnected()) {
      this.pendingOperations.push(operation);
      return;
    }
    operation();
  }

  // Helper to emit socket event
  private emit(event: string, data: unknown): void {
    this.queueOrExecute(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(event, data);
      }
    });
  }

  // Ensure socket is connected (auto-connect if needed)
  private ensureConnected(): boolean {
    if (!this.socket || this.socket.disconnected) {
      if (!this.connecting) {
        this.connect();
      }
      return false;
    }
    return true;
  }

  // ============================================
  // CHANNEL METHODS
  // ============================================

  joinChannel(channelId: string) {
    this.emit('channel:join', channelId);
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', channelId);
  }

  sendMessage(channelId: string, content: string, parentId?: string) {
    this.emit('message:send', { channelId, content, parentId });
  }

  editMessage(messageId: string, content: string) {
    this.emit('message:edit', { messageId, content });
  }

  deleteMessage(messageId: string) {
    this.emit('message:delete', { messageId });
  }

  sendTyping(channelId: string) {
    this.socket?.emit('channel:typing', channelId);
  }

  // ============================================
  // REACTION METHODS
  // ============================================

  toggleReaction(messageId: string, emoji: string) {
    this.emit('reaction:toggle', { messageId, emoji });
  }

  // ============================================
  // DM METHODS
  // ============================================

  joinDM(channelId: string) {
    this.socket?.emit('dm:join', channelId);
  }

  leaveDM(channelId: string) {
    this.socket?.emit('dm:leave', channelId);
  }

  sendDM(channelId: string, content: string) {
    this.emit('dm:send', { channelId, content });
  }

  editDM(messageId: string, content: string) {
    this.emit('dm:edit', { messageId, content });
  }

  deleteDM(messageId: string, channelId?: string) {
    this.emit('dm:delete', { messageId, channelId });
  }

  sendDMTyping(channelId: string) {
    this.socket?.emit('dm:typing', channelId);
  }

  // ============================================
  // LEGACY HANDLER REGISTRATION (for backward compatibility)
  // ============================================

  onDMMessage(id: string, handler: (message: Message) => void) {
    onDMMessage(id, handler);
  }

  offDMMessage(id: string) {
    offDMMessage(id);
  }

  onDMEdit(id: string, handler: (message: Message) => void) {
    onDMEdit(id, handler);
  }

  offDMEdit(id: string) {
    offDMEdit(id);
  }

  onDMDelete(id: string, handler: (data: { messageId: string }) => void) {
    onDMDelete(id, handler);
  }

  offDMDelete(id: string) {
    offDMDelete(id);
  }

  onPresenceUpdate(
    id: string,
    handler: (data: { userId: string; status: string }) => void
  ) {
    onPresenceUpdate(id, handler);
  }

  offPresenceUpdate(id: string) {
    offPresenceUpdate(id);
  }

  // Get socket instance (for direct event listeners when needed)
  getSocket() {
    return this.socket;
  }
}

// Preserve socket instance across HMR reloads
let socketServiceInstance: SocketService;

if (import.meta.hot?.data.socketService) {
  socketServiceInstance = import.meta.hot.data.socketService;
} else {
  socketServiceInstance = new SocketService();
}

export const socketService = socketServiceInstance;

// Hot Module Replacement: preserve socket across reloads
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose((data) => {
    data.socketService = socketServiceInstance;
  });
}
