// ============================================================================
// SOCKET SERVICE - WebSocket-First Architecture
// ============================================================================
// All server data updates go through React Query cache
// Zustand only holds transient UI state (typing indicators)
// ============================================================================

import { io, Socket } from 'socket.io-client';
import { QueryClient } from '@tanstack/react-query';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { queryKeys } from '../hooks/useQuery';
import type { Message, PaginatedMessages, Channel } from '../types';
import { logger } from '../utils/logger';
import { playMessageNotification } from '../utils/notificationSound';

// QueryClient instance for cache updates
let queryClient: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClient = client;
}

class SocketService {
  private socket: Socket | null = null;
  private dmMessageHandlers: Map<string, (message: Message) => void> =
    new Map();
  private dmEditHandlers: Map<string, (message: Message) => void> = new Map();
  private dmDeleteHandlers: Map<string, (data: { messageId: string }) => void> =
    new Map();
  private presenceHandlers: Map<
    string,
    (data: { userId: string; status: string }) => void
  > = new Map();
  private connecting: boolean = false;
  private pendingOperations: Array<() => void> = [];
  private listenersRegistered: boolean = false; // Track if listeners are already registered

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
      logger.log('Socket: Connection already in progress...');
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
      transports: ['websocket', 'polling'], // Prefer WebSocket (cleaner disconnects), fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 15000,
      forceNew: true, // Always create fresh connection (fixes 400 on reload)
      autoConnect: false, // We'll connect manually
      closeOnBeforeunload: true // Automatically close on page unload
    });

    this.socket = socket;

    // Register event listeners
    socket.on('connect', () => {
      this.connecting = false;
      this.executePendingOperations();
    });

    socket.on('connect_error', (error) => {
      this.connecting = false;
      logger.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', () => {
      this.connecting = false;
    });

    socket.connect();

    // Only register event listeners once
    if (this.listenersRegistered) {
      return;
    }
    this.listenersRegistered = true;

    // Message events - update React Query cache ONLY
    socket.on('message:new', (message: Message) => {
      const currentUserId = useAuthStore.getState().user?.id;
      const currentWorkspaceId = useChatStore.getState().currentWorkspace?.id;
      const isOwnMessage = message.authorId === currentUserId;

      if (queryClient && message.channelId) {
        const exactKey = queryKeys.messages(message.channelId, undefined);
        const cacheData = queryClient.getQueryData<PaginatedMessages>(exactKey);
        
        // If message is for a channel we're NOT viewing, force refetch channels list for unread badges
        if (!cacheData) {
          queryClient.refetchQueries({ queryKey: ['channels'] });
          
          // Play sound ONLY if: 1) not own message, 2) not viewing channel, 3) in current workspace
          // Check if message is from current workspace by finding channel in cache
          if (!isOwnMessage && currentWorkspaceId) {
            const channelsKey = queryKeys.channels(currentWorkspaceId);
            const channels = queryClient.getQueryData<Channel[]>(channelsKey);
            const isCurrentWorkspace = channels?.some(ch => ch.id === message.channelId);
            
            if (isCurrentWorkspace) {
              playMessageNotification();
            }
          }
          return;
        }

        // Update cache for currently open channel
        queryClient.setQueryData<PaginatedMessages>(exactKey, (old) => {
          if (!old || !old.items) {
            return old ? { ...old, items: [message] } : old;
          }
          // Don't add duplicate
          if (old.items.some((m) => m.id === message.id)) {
            return old;
          }
          return { ...old, items: [...old.items, message] };
        });
        // No sound when viewing the channel (user is actively in the chat)
      }
    });

    this.socket.on('message:edit', (message: Message) => {
      if (queryClient && message.channelId) {
        const exactKey = queryKeys.messages(message.channelId, undefined);
        queryClient.setQueryData<PaginatedMessages>(exactKey, (old) => {
          if (!old?.items) return old;
          if (!old.items.some((m) => m.id === message.id)) return old;
          return {
            ...old,
            items: old.items.map((m) =>
              m.id === message.id ? { ...m, ...message, edited: true } : m
            )
          };
        });
      }
    });

    this.socket.on(
      'message:delete',
      ({ messageId, channelId }: { messageId: string; channelId: string }) => {
        if (queryClient && channelId) {
          const exactKey = queryKeys.messages(channelId, undefined);
          queryClient.setQueryData<PaginatedMessages>(exactKey, (old) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.filter((m) => m.id !== messageId)
            };
          });
        }
      }
    );

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
        logger.log('Reaction update:', data);
      }
    );

    // DM events - update React Query cache directly
    this.socket.on('dm:new', (message: Message) => {
      const currentUserId = useAuthStore.getState().user?.id;
      const isOwnMessage = message.authorId === currentUserId;

      if (queryClient && message.channelId) {
        const dmKey = queryKeys.dmMessages(message.channelId, undefined);
        const cacheData = queryClient.getQueryData<PaginatedMessages>(dmKey);

        if (!cacheData) {
          queryClient.refetchQueries({ queryKey: queryKeys.dmChannels });
          // Play sound ONLY if: 1) not own message, 2) not viewing the DM
          if (!isOwnMessage) {
            playMessageNotification();
          }
          return;
        }

        queryClient.setQueryData<PaginatedMessages>(dmKey, (old) => {
          if (!old || !old.items) {
            return old ? { ...old, items: [message] } : old;
          }
          if (old.items.some((m) => m.id === message.id)) {
            return old;
          }
          return { ...old, items: [...old.items, message] };
        });
        
        queryClient.refetchQueries({ queryKey: queryKeys.dmChannels });
        // No sound when viewing the DM (user is actively in the chat)
      }

      // Also notify any active DM handlers (legacy support)
      this.dmMessageHandlers.forEach((handler) => handler(message));
    });

    this.socket.on('dm:edit', (message: Message) => {
      if (queryClient && message.channelId) {
        queryClient.setQueryData<PaginatedMessages>(
          queryKeys.dmMessages(message.channelId),
          (old) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.map((m) => (m.id === message.id ? message : m))
            };
          }
        );
      }

      // Also notify any active DM edit handlers (legacy support)
      this.dmEditHandlers.forEach((handler) => handler(message));
    });

    this.socket.on(
      'dm:delete',
      ({ messageId, channelId }: { messageId: string; channelId?: string }) => {
        if (queryClient && channelId) {
          queryClient.setQueryData<PaginatedMessages>(
            queryKeys.dmMessages(channelId),
            (old) => {
              if (!old?.items) return old;
              return {
                ...old,
                items: old.items.filter((m) => m.id !== messageId)
              };
            }
          );
        } else if (queryClient && !channelId) {
          queryClient.invalidateQueries({ queryKey: ['dmMessages'] });
        }

        // Also notify any active DM delete handlers (legacy support)
        this.dmDeleteHandlers.forEach((handler) => handler({ messageId }));
      }
    );

    this.socket.on('dm:typing', () => {
      // Handle DM typing indicator
    });

    // Channel lifecycle events - update React Query cache
    this.socket.on('channel:created', (channel: Channel) => {
      if (queryClient) {
        queryClient.setQueryData<Channel[]>(
          queryKeys.channels(channel.workspaceId),
          (old) => {
            if (!old) return [channel];
            if (old.some((ch) => ch.id === channel.id)) return old;
            return [...old, channel];
          }
        );
      }
    });

    this.socket.on(
      'channel:deleted',
      ({
        channelId,
        workspaceId
      }: {
        channelId: string;
        workspaceId: string;
      }) => {
        if (queryClient) {
          queryClient.setQueryData<Channel[]>(
            queryKeys.channels(workspaceId),
            (old) => {
              if (!old) return old;
              return old.filter((ch) => ch.id !== channelId);
            }
          );
        }
      }
    );

    // Presence
    this.socket.on('user:online', ({ userId }: { userId: string }) => {
      this.presenceHandlers.forEach((handler) =>
        handler({ userId, status: 'ONLINE' })
      );
    });

    this.socket.on('user:offline', ({ userId }: { userId: string }) => {
      this.presenceHandlers.forEach((handler) =>
        handler({ userId, status: 'OFFLINE' })
      );
    });

    // Errors
    this.socket.on('error', (error: { message: string }) => {
      logger.error('Socket error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      // Aggressively disconnect: remove listeners first
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connecting = false;
      this.pendingOperations = [];
      this.listenersRegistered = false; // Reset listeners flag
    }
  }

  // Clean up socket for HMR reloads (prevents 400 errors with stale session IDs)
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

  // Channel methods
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

  // Register handler for DM messages
  onDMMessage(id: string, handler: (message: Message) => void) {
    this.dmMessageHandlers.set(id, handler);
  }

  offDMMessage(id: string) {
    this.dmMessageHandlers.delete(id);
  }

  // Register handler for DM edits
  onDMEdit(id: string, handler: (message: Message) => void) {
    this.dmEditHandlers.set(id, handler);
  }

  offDMEdit(id: string) {
    this.dmEditHandlers.delete(id);
  }

  // Register handler for DM deletes
  onDMDelete(id: string, handler: (data: { messageId: string }) => void) {
    this.dmDeleteHandlers.set(id, handler);
  }

  offDMDelete(id: string) {
    this.dmDeleteHandlers.delete(id);
  }

  // Register handler for presence updates
  onPresenceUpdate(
    id: string,
    handler: (data: { userId: string; status: string }) => void
  ) {
    this.presenceHandlers.set(id, handler);
  }

  offPresenceUpdate(id: string) {
    this.presenceHandlers.delete(id);
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
    socketServiceInstance.cleanup();
    data.socketService = socketServiceInstance;
  });
}
