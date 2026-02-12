// Member List Component - Shows online/offline users grouped by role
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import ProfileModal from './ProfileModal';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const onlineUsers = await api.getOnlineUsers();
        setUsers(onlineUsers);
      } catch (err) {
        console.error('Failed to fetch online users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();

    // Refresh every 10 seconds (balance between responsiveness and performance)
    const interval = setInterval(fetchOnlineUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-500',
    BUSY: 'bg-red-500',
    OFFLINE: 'bg-gray-500'
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
    <div className="w-60 bg-discord-darker flex flex-col border-l border-discord-darkest">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-discord-darkest shadow">
        <h3 className="font-semibold text-gray-400 uppercase text-xs">
          Medlemmar — {users.length}
        </h3>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-gray-400 text-sm px-2">Laddar...</div>
        ) : users.length === 0 ? (
          <div className="text-gray-400 text-sm px-2">
            Inga användare online
          </div>
        ) : (
          roleOrder.map((role) => {
            const roleUsers = groupedByRole[role];
            if (!roleUsers || roleUsers.length === 0) return null;

            return (
              <div key={role} className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1">
                  {roleLabels[role]} — {roleUsers.length}
                </h4>
                {roleUsers.map((user) => (
                  <div
                    key={user.id}
                    className="group relative flex items-center gap-2 px-2 py-1.5 rounded hover:bg-discord-dark/50 transition-colors"
                  >
                    <button
                      onClick={() => handleUserClick(user.id)}
                      className="flex-1 flex items-center gap-3 min-w-0"
                    >
                      {/* Avatar with status */}
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm font-bold">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            (user.firstName?.[0] ?? user.email[0]).toUpperCase()
                          )}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${
                            statusColors[user.presence?.status ?? 'OFFLINE']
                          }`}
                        />
                      </div>

                      {/* Name and custom status */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-gray-300 truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : (user.firstName ?? user.email.split('@')[0])}
                        </p>
                        {user.presence?.customStatus && (
                          <p className="text-xs text-gray-500 truncate">
                            {user.presence.customStatus}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* DM button - only show for other users */}
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={(e) => handleStartDM(user.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-white hover:bg-discord-blurple/20 rounded transition-all"
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
