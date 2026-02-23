/**
 * useMarkAsRead - Mark channel/DM as read after viewing for 1 second
 * Shared logic between ChannelView and DMView
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { queryKeys } from './useQuery';
import type { Channel, DMChannel } from '../types';

interface UseMarkAsReadOptions {
  channelId: string | undefined;
  workspaceId?: string | undefined;
  isDM?: boolean;
}

export function useMarkAsRead({
  channelId,
  workspaceId,
  isDM = false
}: UseMarkAsReadOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId) return;
    // For channels, also need workspaceId; for DMs it's optional
    if (!isDM && !workspaceId) return;

    const timer = setTimeout(async () => {
      try {
        if (isDM) {
          await api.markDMAsRead(channelId);
          // Update cache directly with setQueryData (avoids race conditions with refetch)
          queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
            if (!old) return old;
            return old.map((ch) =>
              ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
            );
          });
        } else {
          await api.post(`/channels/${channelId}/read`);
          // Update cache directly with setQueryData (avoids race conditions with refetch)
          queryClient.setQueryData<Channel[]>(
            queryKeys.channels(workspaceId!),
            (old) => {
              if (!old) return old;
              return old.map((ch) =>
                ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
              );
            }
          );
        }
      } catch (error) {
        // Silently ignore errors for non-existent channels (foreign key constraint violations)
        if (
          error instanceof Error &&
          error.message.includes('Foreign key constraint')
        ) {
          // Channel doesn't exist in database anymore, ignore
          return;
        }
        logger.error('Failed to mark as read:', error);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [channelId, workspaceId, isDM, queryClient]);
}
