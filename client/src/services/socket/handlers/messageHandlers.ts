// Message Event Handlers - Channel messages (not DMs)
import { queryKeys } from '../../../hooks/useQuery';
import { useChatStore } from '../../../store/chat';
import { playMessageNotification } from '../../../utils/notificationSound';
import { logger } from '../../../utils/logger';
import type { PaginatedMessages, Channel, Message } from '../../../types';
import type { SocketHandlerContext } from '../types';

export function registerMessageHandlers(context: SocketHandlerContext): void {
  const {
    socket,
    queryClient,
    getCurrentUserId,
    getCurrentWorkspaceId,
    isViewingChannel
  } = context;

  // message:new - New message in a channel
  socket.on('message:new', (message: Message) => {
    const currentUserId = getCurrentUserId();
    const currentWorkspaceId = getCurrentWorkspaceId();
    const isOwnMessage = message.authorId === currentUserId;
    const isViewing = isViewingChannel(message.channelId);

    if (message.channelId) {
      // ONLY update message cache if user is actively viewing this channel
      if (isViewing) {
        const exactKey = queryKeys.messages(message.channelId, undefined);
        queryClient.setQueryData<PaginatedMessages>(exactKey, (old) => {
          if (!old) return { items: [message], hasMore: false };
          if (!old.items) return { ...old, items: [message] };
          if (old.items.some((m) => m.id === message.id)) return old;
          return { ...old, items: [...old.items, message] };
        });
      } else {
        // Not viewing: invalidate ALL message queries for this channel
        queryClient.invalidateQueries({
          queryKey: ['messages', message.channelId],
          exact: false
        });
      }

      // Play sound if not own message AND not currently viewing this channel
      if (!isOwnMessage && !isViewing && currentWorkspaceId) {
        const channelsKey = queryKeys.channels(currentWorkspaceId);
        const channels = queryClient.getQueryData<Channel[]>(channelsKey);
        const isCurrentWorkspace = channels?.some(
          (ch) => ch.id === message.channelId
        );

        if (isCurrentWorkspace) {
          playMessageNotification();
          // Increment unreadCount in cache directly
          queryClient.setQueryData<Channel[]>(channelsKey, (old) => {
            if (!old) return old;
            return old.map((ch) =>
              ch.id === message.channelId
                ? { ...ch, unreadCount: (ch.unreadCount ?? 0) + 1 }
                : ch
            );
          });
        }
      }
    }
  });

  // message:edit - Message edited
  socket.on('message:edit', (message: Message) => {
    if (message.channelId) {
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

  // message:delete - Message deleted
  socket.on(
    'message:delete',
    ({ messageId, channelId }: { messageId: string; channelId: string }) => {
      if (channelId) {
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

  // channel:typing - Typing indicator
  socket.on(
    'channel:typing',
    ({ userId, channelId }: { userId: string; channelId: string }) => {
      useChatStore.getState().setTyping(channelId, userId);
      // Clear after 3 seconds
      setTimeout(() => {
        useChatStore.getState().clearTyping(channelId, userId);
      }, 3000);
    }
  );

  // reaction:update - Reaction toggled (from WebSocket)
  socket.on(
    'reaction:update',
    (data: {
      messageId: string;
      channelId: string;
      userId: string;
      emoji: string;
      added: boolean;
    }) => {
      logger.log('Reaction update:', data);
      updateReactionCache(queryClient, data);
    }
  );

  // reaction:toggle - Reaction toggled (from REST API)
  socket.on(
    'reaction:toggle',
    (data: {
      messageId: string;
      channelId: string;
      userId: string;
      emoji: string;
      added: boolean;
    }) => {
      logger.log('Reaction toggle:', data);
      updateReactionCache(queryClient, data);
    }
  );
}

// Helper function to update reaction in message cache
function updateReactionCache(
  queryClient: SocketHandlerContext['queryClient'],
  data: {
    messageId: string;
    channelId: string;
    userId: string;
    emoji: string;
    added: boolean;
  }
) {
  const exactKey = queryKeys.messages(data.channelId, undefined);
  queryClient.setQueryData<PaginatedMessages>(exactKey, (old) => {
    if (!old?.items) return old;
    return {
      ...old,
      items: old.items.map((m) => {
        if (m.id !== data.messageId) return m;

        const currentReactions = m.reactions || [];
        let newReactions: Array<{ emoji: string; userId: string }>;

        if (data.added) {
          // Add reaction if not already present
          const exists = currentReactions.some(
            (r) => r.emoji === data.emoji && r.userId === data.userId
          );
          if (exists) return m;
          newReactions = [
            ...currentReactions,
            { emoji: data.emoji, userId: data.userId }
          ];
        } else {
          // Remove reaction
          newReactions = currentReactions.filter(
            (r) => !(r.emoji === data.emoji && r.userId === data.userId)
          );
        }

        return { ...m, reactions: newReactions };
      })
    };
  });
}
