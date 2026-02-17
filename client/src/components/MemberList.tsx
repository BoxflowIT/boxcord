// Member List Component - Shows online/offline users grouped by role
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/auth';
import { useOnlineUsers } from '../hooks/useQuery';
import ProfileModal from './ProfileModal';
import MemberListHeader from './member/MemberListHeader';
import MemberSearch from './member/MemberSearch';
import MemberSection from './member/MemberSection';
import MemberListItem from './member/MemberListItem';
import type { UserStatus } from './member/StatusIndicator';

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      logger.error('Failed to create DM channel:', err);
    }
  };

  // Group users by role, then by status within each role
  const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administratörer',
    STAFF: 'Personal'
  };

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? users.filter((user) => {
        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`
          .toLowerCase()
          .trim();
        const email = user.email.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      })
    : users;

  const groupedByRole = filteredUsers.reduce(
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
      <MemberListHeader
        memberCount={filteredUsers.length}
        showSearch={showSearch}
        onSearchToggle={() => {
          setShowSearch(!showSearch);
          if (showSearch) setSearchQuery('');
        }}
      />

      {showSearch && (
        <MemberSearch value={searchQuery} onChange={setSearchQuery} />
      )}

      <div className="panel-content">
        {filteredUsers.length === 0 ? (
          <div className="text-muted px-2">
            {searchQuery ? 'Inga användare hittades' : 'Inga användare online'}
          </div>
        ) : (
          roleOrder.map((role) => {
            const roleUsers = groupedByRole[role];
            if (!roleUsers || roleUsers.length === 0) return null;

            return (
              <MemberSection
                key={role}
                title={roleLabels[role]}
                count={roleUsers.length}
              >
                {roleUsers.map((user) => {
                  const displayName =
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : (user.firstName ?? user.email.split('@')[0]);

                  return (
                    <MemberListItem
                      key={user.id}
                      userId={user.id}
                      avatarUrl={user.avatarUrl}
                      displayName={displayName}
                      customStatus={user.presence?.customStatus}
                      status={
                        (user.presence?.status ?? 'OFFLINE') as UserStatus
                      }
                      isCurrentUser={user.id === currentUser?.id}
                      onClick={() => handleUserClick(user.id)}
                      onStartDM={
                        user.id !== currentUser?.id
                          ? (e) => handleStartDM(user.id, e)
                          : undefined
                      }
                    />
                  );
                })}
              </MemberSection>
            );
          })
        )}
      </div>

      <ProfileModal
        userId={selectedUserId ?? undefined}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
