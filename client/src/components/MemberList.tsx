// Member List Component - Shows online/offline users grouped by role
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { useWorkspaceMembers } from '../hooks/useQuery';
import {
  useMemberListData,
  ROLE_LABELS,
  type MemberUser
} from '../hooks/useMemberListData';
import { useDMOperations } from '../hooks/useDMOperations';
import { socketService } from '../services/socket';
import { getUserDisplayName } from '../utils/user';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { toast } from '../store/notification';
import ProfileModal from './ProfileModal';
import { ModerationModal } from './moderation/ModerationModal';
import MemberListHeader from './member/MemberListHeader';
import MemberSearch from './member/MemberSearch';
import MemberSection from './member/MemberSection';
import MemberListItem from './member/MemberListItem';
import type { UserStatus } from './member/StatusIndicator';

export default function MemberList() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const { currentWorkspace } = useChatStore();
  const { data: workspaceMembers } = useWorkspaceMembers(currentWorkspace?.id);
  const { startDM } = useDMOperations();

  const [users, setUsers] = useState<MemberUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModeration, setShowModeration] = useState(false);
  const [moderationUserId, setModerationUserId] = useState<string | null>(null);

  const { filteredUsers, groupedByRole, roleOrder } = useMemberListData({
    users,
    searchQuery
  });

  useEffect(() => {
    if (!workspaceMembers) return;

    // Merge presence data from current state with new workspace members
    // This preserves WebSocket presence updates
    setUsers((prevUsers) => {
      const updatedMembers = workspaceMembers.map((member) => {
        // Find existing user to preserve WebSocket presence updates
        const existing = prevUsers.find((u) => u.id === member.id);
        if (existing?.presence) {
          // Keep WebSocket-updated presence
          return { ...member, presence: existing.presence };
        }
        return member;
      });

      // Always include current user if not in list
      if (currentUser && !updatedMembers.some((u) => u.id === currentUser.id)) {
        const currentUserWithPresence = {
          ...currentUser,
          presence: {
            status: 'ONLINE' as const,
            lastSeen: new Date().toISOString()
          }
        };
        return [currentUserWithPresence, ...updatedMembers];
      }

      return updatedMembers;
    });
  }, [workspaceMembers, currentUser]);

  useEffect(() => {
    // Listen for presence updates via WebSocket
    const handlePresenceUpdate = (data: { userId: string; status: string }) => {
      setUsers((prevUsers) => {
        const existingUser = prevUsers.find((u) => u.id === data.userId);
        if (!existingUser) return prevUsers;

        return prevUsers.map((u) =>
          u.id === data.userId
            ? {
                ...u,
                presence: {
                  ...u.presence,
                  status: data.status as UserStatus,
                  lastSeen:
                    data.status === 'OFFLINE'
                      ? new Date().toISOString()
                      : (u.presence?.lastSeen ?? new Date().toISOString())
                }
              }
            : u
        );
      });
    };

    socketService.onPresenceUpdate('memberList', handlePresenceUpdate);

    return () => {
      socketService.offPresenceUpdate('memberList');
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

  const handleModerate = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationUserId(userId);
    setShowModeration(true);
  };

  const handleKickUser = async (userId: string, reason?: string) => {
    if (!currentWorkspace?.id) return;

    try {
      await api.kickUser(currentWorkspace.id, userId, reason);
      setShowModeration(false);
      setModerationUserId(null);
    } catch (err) {
      logger.error('Failed to kick user:', err);
      toast.error(t('errors.generic'));
    }
  };

  const handleBanUser = async (userId: string, reason?: string) => {
    if (!currentWorkspace?.id) return;

    try {
      await api.banUser(currentWorkspace.id, userId, reason);
      setShowModeration(false);
      setModerationUserId(null);
    } catch (err) {
      logger.error('Failed to ban user:', err);
      toast.error(t('errors.generic'));
    }
  };

  // Check if current user is admin
  const currentUserMember = users.find((u) => u.id === currentUser?.id);
  const isAdmin =
    currentUserMember?.role === 'ADMIN' ||
    currentUserMember?.role === 'SUPER_ADMIN';

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
            {searchQuery ? t('members.noUsersFound') : t('members.noMembers')}
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
                  const displayName = getUserDisplayName(user);

                  const canModerate =
                    isAdmin &&
                    user.id !== currentUser?.id &&
                    user.role !== 'SUPER_ADMIN' &&
                    user.role !== 'ADMIN';

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
                      onModerate={
                        canModerate
                          ? (e) => handleModerate(user.id, e)
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

      {showModeration && moderationUserId && (
        <ModerationModal
          userId={moderationUserId}
          userName={getUserDisplayName(
            users.find((u) => u.id === moderationUserId) ?? {
              id: moderationUserId,
              email: 'Unknown',
              role: 'STAFF'
            }
          )}
          onKick={handleKickUser}
          onBan={handleBanUser}
          onClose={() => {
            setShowModeration(false);
            setModerationUserId(null);
          }}
        />
      )}
    </div>
  );
}
