// User Status & DND Event Handlers
import { queryKeys } from '../../../hooks/useQuery';
import type { SocketHandlerContext } from '../types';
import type { User } from '../../../types';

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
  const { socket, queryClient, getCurrentUserId } = context;

  // user:status-changed - User custom status updated
  socket.on('user:status-changed', (payload: UserStatusPayload) => {
    const { userId, status, statusEmoji } = payload;
    const currentUserId = getCurrentUserId();

    // If this is the current user, update cache immediately
    if (userId === currentUserId) {
      queryClient.setQueryData<User>(queryKeys.currentUser, (old) => {
        if (!old) return old;
        return {
          ...old,
          status: status ?? undefined,
          statusEmoji: statusEmoji ?? undefined
        };
      });
    }

    // Update user cache if it exists
    queryClient.setQueryData<User>(queryKeys.user(userId), (old) => {
      if (!old) return old;
      return {
        ...old,
        status: status ?? undefined,
        statusEmoji: statusEmoji ?? undefined
      };
    });

    // Update workspace members cache directly for immediate UI update
    queryClient.setQueriesData<User[]>(
      { queryKey: ['workspaceMembers'], exact: false },
      (old) => {
        if (!old) return old;
        return old.map((member) =>
          member.id === userId
            ? {
                ...member,
                status: status ?? undefined,
                statusEmoji: statusEmoji ?? undefined
              }
            : member
        );
      }
    );
  });

  // user:dnd-changed - User DND mode updated
  socket.on('user:dnd-changed', (payload: UserDNDPayload) => {
    const { userId, dndMode, dndUntil } = payload;
    const currentUserId = getCurrentUserId();
    const dndUntilStr = dndUntil ? new Date(dndUntil).toISOString() : undefined;

    // If this is the current user, update cache immediately
    if (userId === currentUserId) {
      queryClient.setQueryData<User>(queryKeys.currentUser, (old) => {
        if (!old) return old;
        return { ...old, dndMode, dndUntil: dndUntilStr };
      });
    }

    // Update user cache if it exists
    queryClient.setQueryData<User>(queryKeys.user(userId), (old) => {
      if (!old) return old;
      return { ...old, dndMode, dndUntil: dndUntilStr };
    });

    // Update workspace members cache directly for immediate UI update
    queryClient.setQueriesData<User[]>(
      { queryKey: ['workspaceMembers'], exact: false },
      (old) => {
        if (!old) return old;
        return old.map((member) =>
          member.id === userId
            ? { ...member, dndMode, dndUntil: dndUntilStr }
            : member
        );
      }
    );
  });
}
