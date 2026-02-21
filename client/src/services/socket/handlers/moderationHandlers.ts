// User Moderation Event Handlers
import { queryKeys } from '../../../hooks/useQuery';
import type { SocketHandlerContext } from '../types';

export interface ModerationPayload {
  workspaceId: string;
  userId: string;
  moderatorId: string;
  reason?: string;
}

export function registerModerationHandlers(
  context: SocketHandlerContext
): void {
  const { socket, queryClient, getCurrentUserId } = context;

  // user:kicked - User kicked from workspace
  socket.on('user:kicked', (payload: ModerationPayload) => {
    const { workspaceId, userId, reason } = payload;
    const currentUserId = getCurrentUserId();

    // If current user was kicked, show alert and redirect to home
    if (userId === currentUserId) {
      // Using simple alert since this is an immediate action before app state updates
      // TODO: Consider using a more sophisticated modal/toast notification system
      const message = reason
        ? `You were kicked from the workspace. Reason: ${reason}`
        : 'You were kicked from the workspace.';
      alert(message);
      window.location.href = '/';
      return;
    }

    // Invalidate workspace members list to reflect user removal
    queryClient.invalidateQueries({
      queryKey: queryKeys.workspaceMembers(workspaceId)
    });
  });

  // user:banned - User banned from workspace
  socket.on('user:banned', (payload: ModerationPayload) => {
    const { workspaceId, userId, reason } = payload;
    const currentUserId = getCurrentUserId();

    // If current user was banned, show alert and redirect to home
    if (userId === currentUserId) {
      const message = reason
        ? `You were banned from the workspace. Reason: ${reason}`
        : 'You were banned from the workspace.';
      alert(message);
      window.location.href = '/';
      return;
    }

    // Invalidate workspace members list to reflect ban
    queryClient.invalidateQueries({
      queryKey: queryKeys.workspaceMembers(workspaceId)
    });
  });

  // user:unbanned - User ban removed
  socket.on(
    'user:unbanned',
    ({
      workspaceId,
      userId
    }: {
      workspaceId: string;
      userId: string;
      moderatorId: string;
    }) => {
      const currentUserId = getCurrentUserId();

      // If current user was unbanned, show success message
      if (userId === currentUserId) {
        alert('Your ban has been removed. You can now rejoin the workspace.');
      }

      // Invalidate workspace members list to reflect unban
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceMembers(workspaceId)
      });
    }
  );
}
