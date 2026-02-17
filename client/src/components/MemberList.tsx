// Member List Component - Shows online/offline users grouped by role
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useOnlineUsers } from '../hooks/useQuery';
import {
  useMemberListData,
  ROLE_LABELS,
  type MemberUser
} from '../hooks/useMemberListData';
import { useDMOperations } from '../hooks/useDMOperations';
import ProfileModal from './ProfileModal';
import MemberListHeader from './member/MemberListHeader';
import MemberSearch from './member/MemberSearch';
import MemberSection from './member/MemberSection';
import MemberListItem from './member/MemberListItem';
import type { UserStatus } from './member/StatusIndicator';

export default function MemberList() {
  const { user: currentUser } = useAuthStore();
  const { data: onlineUsers } = useOnlineUsers();
  const { startDM } = useDMOperations();

  const [users, setUsers] = useState<MemberUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { filteredUsers, groupedByRole, roleOrder } = useMemberListData({
    users,
    searchQuery
  });

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
    // Listen for presence updates via WebSocket
    const handlePresenceUpdate = (data: { userId: string; status: string }) => {
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
    await startDM(userId);
  };

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
                title={ROLE_LABELS[role]}
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
