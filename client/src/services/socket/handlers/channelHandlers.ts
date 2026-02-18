// Channel Lifecycle Event Handlers
import { queryKeys } from '../../../hooks/useQuery';
import type { Channel } from '../../../types';
import type {
  SocketHandlerContext,
  ChannelPayload,
  ChannelDeletePayload
} from '../types';

export function registerChannelHandlers(context: SocketHandlerContext): void {
  const { socket, queryClient } = context;

  // channel:created - New channel created
  socket.on('channel:created', (channel: ChannelPayload) => {
    queryClient.setQueryData<Channel[]>(
      queryKeys.channels(channel.workspaceId),
      (old) => {
        if (!old) return [channel as Channel];
        if (old.some((ch) => ch.id === channel.id)) return old;
        return [...old, channel as Channel];
      }
    );
  });

  // channel:deleted - Channel deleted
  socket.on(
    'channel:deleted',
    ({ channelId, workspaceId }: ChannelDeletePayload) => {
      queryClient.setQueryData<Channel[]>(
        queryKeys.channels(workspaceId),
        (old) => {
          if (!old) return old;
          return old.filter((ch) => ch.id !== channelId);
        }
      );
    }
  );

  // channel:updated - Channel updated (name, settings, etc.)
  socket.on('channel:updated', (channel: ChannelPayload) => {
    queryClient.setQueryData<Channel[]>(
      queryKeys.channels(channel.workspaceId),
      (old) => {
        if (!old) return old;
        return old.map((ch) =>
          ch.id === channel.id ? { ...ch, ...channel } : ch
        );
      }
    );
  });
}
