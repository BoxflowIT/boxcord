// User Status & DND Event Handlers
import { queryKeys } from '../../../hooks/useQuery';
import type { SocketHandlerContext } from '../types';

export interface UserStatusPayload {
  userId: string;
  status: string | null;
  statusEmoji: string | null;
}

export interface UserDNDPayload {
  userId: string;
  dndMode: boolean;
  dndUntil?: Date | null;
}

export function registerUserStatusHandlers(
  context: SocketHandlerContext
): void {
  const { socket, queryClient } = context;

  // user:status-changed - User custom status updated
  socket.on('user:status-changed', (payload: UserStatusPayload) => {
    const { userId } = payload;

    // Invalidate user queries to refetch with new status
    queryClient.invalidateQueries({
      queryKey: queryKeys.user(userId)
    });

    // Invalidate all workspace members lists that might include this user
    // Using exact: false to match all workspaceMembers queries regardless of workspace ID
    queryClient.invalidateQueries({
      queryKey: ['workspaceMembers'],
      exact: false
    });
  });

  // user:dnd-changed - User DND mode updated
  socket.on('user:dnd-changed', (payload: UserDNDPayload) => {
    const { userId } = payload;

    // Invalidate user queries to refetch with new DND status
    queryClient.invalidateQueries({
      queryKey: queryKeys.user(userId)
    });

    // Invalidate all workspace members lists that might include this user
    queryClient.invalidateQueries({
      queryKey: ['workspaceMembers'],
      exact: false
    });
  });
}
