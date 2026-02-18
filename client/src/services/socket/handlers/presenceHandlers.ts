// Presence and User Update Event Handlers
import { queryKeys } from '../../../hooks/useQuery';
import { useAuthStore } from '../../../store/auth';
import type { User } from '../../../types';
import type { SocketHandlerContext } from '../types';

// Map for presence handlers
const presenceHandlers = new Map<
  string,
  (data: { userId: string; status: string }) => void
>();

export function registerPresenceHandlers(context: SocketHandlerContext): void {
  const { socket, queryClient } = context;

  // user:online - User came online
  socket.on('user:online', ({ userId }: { userId: string }) => {
    presenceHandlers.forEach((handler) =>
      handler({ userId, status: 'ONLINE' })
    );
  });

  // user:offline - User went offline
  socket.on('user:offline', ({ userId }: { userId: string }) => {
    presenceHandlers.forEach((handler) =>
      handler({ userId, status: 'OFFLINE' })
    );
  });

  // user:update - User profile updated
  socket.on(
    'user:update',
    (data: {
      userId: string;
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
    }) => {
      const currentUserId = useAuthStore.getState().user?.id;

      // If it's the current user, update auth store
      if (currentUserId === data.userId) {
        const { updateUser } = useAuthStore.getState();
        updateUser({
          firstName: data.firstName ?? undefined,
          lastName: data.lastName ?? undefined,
          avatarUrl: data.avatarUrl ?? undefined
        });
      }

      // Optimistically update React Query caches
      // Update online users cache
      queryClient.setQueryData(
        ['users', 'online'],
        (oldData: User[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((u) =>
            u.id === data.userId
              ? {
                  ...u,
                  firstName:
                    data.firstName !== undefined ? data.firstName : u.firstName,
                  lastName:
                    data.lastName !== undefined ? data.lastName : u.lastName,
                  avatarUrl:
                    data.avatarUrl !== undefined ? data.avatarUrl : u.avatarUrl,
                  bio: data.bio !== undefined ? data.bio : u.bio
                }
              : u
          );
        }
      );

      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    }
  );
}

// Export presence handler registration functions
export function onPresenceUpdate(
  id: string,
  handler: (data: { userId: string; status: string }) => void
) {
  presenceHandlers.set(id, handler);
}

export function offPresenceUpdate(id: string) {
  presenceHandlers.delete(id);
}
