// Member List Component - Shows online/offline users
import { useState, useEffect } from 'react';
import { api } from '../services/api';
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

    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-500',
    BUSY: 'bg-red-500',
    OFFLINE: 'bg-gray-500'
  };

  const statusLabels: Record<string, string> = {
    ONLINE: 'Online',
    AWAY: 'Borta',
    BUSY: 'Upptagen',
    OFFLINE: 'Offline'
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  // Group users by status
  const groupedUsers = users.reduce(
    (acc, user) => {
      const status = user.presence?.status ?? 'OFFLINE';
      if (!acc[status]) acc[status] = [];
      acc[status].push(user);
      return acc;
    },
    {} as Record<string, User[]>
  );

  const statusOrder = ['ONLINE', 'BUSY', 'AWAY', 'OFFLINE'];

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
          statusOrder.map((status) => {
            const statusUsers = groupedUsers[status];
            if (!statusUsers || statusUsers.length === 0) return null;

            return (
              <div key={status} className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1">
                  {statusLabels[status]} — {statusUsers.length}
                </h4>
                {statusUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-discord-dark/50 transition-colors"
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
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-darker ${statusColors[status]}`}
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

                    {/* Role badge */}
                    {user.role === 'ADMIN' && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                        Admin
                      </span>
                    )}
                    {user.role === 'BOT' && (
                      <span className="text-xs px-1.5 py-0.5 bg-discord-blurple/20 text-discord-blurple rounded">
                        Bot
                      </span>
                    )}
                  </button>
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
