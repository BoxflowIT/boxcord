// Member List Component - Shows online/offline users grouped by role
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useOnlineUsers } from '../hooks/useQuery';
import ProfileModal from './ProfileModal';
import Avatar from './ui/Avatar';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  presence?: {
    status: string;
    customStatus?: string;
    lastSeen?: string;
  };
}

export default function MemberList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  // React Query hook for auto caching
  const { data: onlineUsers } = useOnlineUsers();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!onlineUsers) return;

    // Always include current user if not in list
    if (currentUser && !onlineUsers.some((u) => u.id === currentUser.id)) {
      const currentUserWithPresence = {
        ...currentUser,
        presence: { status: 'ONLINE', lastSeen: new Date().toISOString() }
      };
      setUsers([currentUserWithPresence, ...onlineUsers]);
    } else {
      setUsers(onlineUsers);
    }
  }, [onlineUsers, currentUser]);

  useEffect(() => {
    // Listen for presence updates via WebSocket instead of polling
    const handlePresenceUpdate = (data: { userId: string; status: string }) => {
      setUsers((prevUsers) => {
        const existingUser = prevUsers.find((u) => u.id === data.userId);
        if (existingUser) {
          // Update existing user's status
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

    // Import socketService dynamically to avoid circular dependencies
    import('../services/socket').then(({ socketService }) => {
      socketService.onPresenceUpdate('memberList', handlePresenceUpdate);
    });

    return () => {
      import('../services/socket').then(({ socketService }) => {
        socketService.offPresenceUpdate('memberList');
      });
    };
  }, []);

  const statusColors: Record<string, string> = {
    ONLINE: 'status-online',
    AWAY: 'status-away',
    BUSY: 'status-busy',
    OFFLINE: 'status-offline'
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  const handleStartDM = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const channel = await api.getOrCreateDM(userId);
      navigate(`/chat/dm/${channel.id}`);
    } catch (err) {
      console.error('Failed to create DM channel:', err);
    }
  };

  // Group users by role, then by status within each role
  const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administratörer',
    STAFF: 'Personal'
  };

  const groupedByRole = users.reduce(
    (acc, user) => {
      const role = user.role || 'STAFF';
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    },
    {} as Record<string, User[]>
  );

  return (
    <div className="sidebar-main border-l border-boxflow-border">
      {/* Header */}
      <div className="panel-header">
        <h3 className="text-subtle uppercase font-semibold">
          Medlemmar — {users.length}
        </h3>
      </div>

      {/* User list */}
      <div className="panel-content">
        {users.length === 0 ? (
          <div className="text-muted px-2">Inga användare online</div>
        ) : (
          roleOrder.map((role) => {
            const roleUsers = groupedByRole[role];
            if (!roleUsers || roleUsers.length === 0) return null;

            return (
              <div key={role} className="mb-4">
                <h4 className="text-subtle uppercase font-semibold px-2 mb-1">
                  {roleLabels[role]} — {roleUsers.length}
                </h4>
                {roleUsers.map((user) => (
                  <div key={user.id} className="group list-item-interactive">
                    <button
                      onClick={() => handleUserClick(user.id)}
                      className="flex-1 flex items-center gap-3 min-w-0"
                    >
                      {/* Avatar with status */}
                      <div className="relative">
                        <Avatar size="sm" src={user.avatarUrl}>
                          {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 ${statusColors[user.presence?.status ?? 'OFFLINE']}`}
                        />
                      </div>

                      {/* Name and custom status */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-boxflow-light truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : (user.firstName ?? user.email.split('@')[0])}
                        </p>
                        {user.presence?.customStatus && (
                          <p className="text-subtle truncate">
                            {user.presence.customStatus}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* DM button - only show for other users */}
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={(e) => handleStartDM(user.id, e)}
                        className="btn-icon-primary hover-group-visible"
                        title="Skicka direktmeddelande"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        userId={selectedUserId ?? undefined}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
