// Member List Component - Shows online/offline users grouped by role
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { useDMCallStore } from '../store/dmCallStore';
import { useWorkspaceMembers, queryKeys } from '../hooks/useQuery';
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
import MemberContextMenu from './member/MemberContextMenu';
import type { UserStatus } from './member/StatusIndicator';

export default function MemberList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { currentWorkspace } = useChatStore();
  const { data: workspaceMembers } = useWorkspaceMembers(currentWorkspace?.id);
  const { startDM } = useDMOperations();
  const { startCall } = useDMCallStore();

  const [users, setUsers] = useState<MemberUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModeration, setShowModeration] = useState(false);
  const [moderationUserId, setModerationUserId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    user: MemberUser;
  } | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

  // Adjust context menu position to stay within viewport
  useLayoutEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const menu = contextMenuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 10;

      let newX = contextMenu.x;
      let newY = contextMenu.y;

      // If menu goes off right edge, move it left
      if (contextMenu.x + rect.width > viewportWidth - padding) {
        newX = viewportWidth - rect.width - padding;
      }

      // If menu goes off bottom edge, show it above the click point
      if (contextMenu.y + rect.height > viewportHeight - padding) {
        newY = contextMenu.y - rect.height;
        if (newY < padding) newY = padding;
      }

      // Ensure not off left edge
      if (newX < padding) newX = padding;

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [contextMenu]);

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

  const handleContextMenu = (e: React.MouseEvent, user: MemberUser) => {
    e.preventDefault();
    e.stopPropagation();
    setAdjustedPosition({ x: e.clientX, y: e.clientY }); // Initial position
    setContextMenu({ x: e.clientX, y: e.clientY, user });
  };

  const closeContextMenu = () => setContextMenu(null);

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
                      customStatus={user.status || user.presence?.customStatus}
                      statusEmoji={user.statusEmoji}
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
                      onContextMenu={(e) => handleContextMenu(e, user)}
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

      {/* Context Menu - rendered in portal to escape overflow constraints */}
      {contextMenu &&
        createPortal(
          <>
            {/* Backdrop to close on click outside */}
            <div
              className="fixed inset-0 z-[100]"
              onClick={closeContextMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                closeContextMenu();
              }}
            />
            <div
              ref={contextMenuRef}
              style={{
                position: 'fixed',
                left: adjustedPosition.x,
                top: adjustedPosition.y,
                maxHeight: 'calc(100vh - 20px)',
                overflowY: 'auto'
              }}
              className="z-[101] min-w-[200px] bg-boxflow-darker border border-boxflow-border rounded-lg shadow-xl"
            >
              <MemberContextMenu
                userId={contextMenu.user.id}
                displayName={getUserDisplayName(contextMenu.user)}
                isCurrentUser={contextMenu.user.id === currentUser?.id}
                canModerate={
                  isAdmin &&
                  contextMenu.user.id !== currentUser?.id &&
                  contextMenu.user.role !== 'SUPER_ADMIN' &&
                  contextMenu.user.role !== 'ADMIN'
                }
                onViewProfile={() => {
                  handleUserClick(contextMenu.user.id);
                  closeContextMenu();
                }}
                onSendMessage={async () => {
                  await startDM(contextMenu.user.id);
                  closeContextMenu();
                }}
                onStartCall={async () => {
                  try {
                    closeContextMenu();

                    // Create or get existing DM channel
                    const channel = await api.getOrCreateDM(
                      contextMenu.user.id
                    );

                    // Invalidate DM channels cache to include new/updated channel
                    await queryClient.invalidateQueries({
                      queryKey: queryKeys.dmChannels
                    });

                    // Start the call immediately (before navigation)
                    startCall(
                      channel.id,
                      contextMenu.user.id,
                      getUserDisplayName(contextMenu.user)
                    );

                    // Notify other user via socket
                    socketService.getSocket()?.emit('dm:call:start', {
                      channelId: channel.id,
                      targetUserId: contextMenu.user.id
                    });

                    // Navigate to DM (call overlay already showing)
                    navigate(`/chat/dm/${channel.id}`);
                  } catch (err) {
                    logger.error('Failed to start call from member list:', err);
                    toast.error(
                      t('errors.failedToStartCall') || 'Failed to start call'
                    );
                  }
                }}
                onChangeRole={() => {
                  handleUserClick(contextMenu.user.id);
                  closeContextMenu();
                }}
                onKick={() => {
                  setModerationUserId(contextMenu.user.id);
                  setShowModeration(true);
                  closeContextMenu();
                }}
                onBan={() => {
                  setModerationUserId(contextMenu.user.id);
                  setShowModeration(true);
                  closeContextMenu();
                }}
              />
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
