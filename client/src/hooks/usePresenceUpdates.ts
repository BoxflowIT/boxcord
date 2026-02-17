// Custom hook for managing presence updates via WebSocket
import { useEffect } from 'react';

interface PresenceUpdate {
  userId: string;
  status: string;
}

interface User {
  id: string;
  presence?: {
    status: string;
    lastSeen?: string;
  };
}

interface UsePresenceUpdatesProps<T extends User> {
  onUpdate: (callback: (data: PresenceUpdate) => void) => void;
  setUsers: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Hook to handle WebSocket presence updates
 * Automatically subscribes/unsubscribes and updates user list
 */
export function usePresenceUpdates<T extends User>({
  onUpdate,
  setUsers
}: UsePresenceUpdatesProps<T>) {
  useEffect(() => {
    const handlePresenceUpdate = (data: PresenceUpdate) => {
      setUsers((prevUsers) => {
        const existingUser = prevUsers.find((u) => u.id === data.userId);
        if (existingUser) {
          return prevUsers.map((u) =>
            u.id === data.userId
              ? {
                  ...u,
                  presence: {
                    ...u.presence,
                    status: data.status,
                    lastSeen:
                      data.status === 'OFFLINE'
                        ? new Date().toISOString()
                        : u.presence?.lastSeen
                  }
                }
              : u
          );
        }
        return prevUsers;
      });
    };

    onUpdate(handlePresenceUpdate);
  }, [onUpdate, setUsers]);
}
