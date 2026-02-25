// Reusable Message Avatar Component
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { useDMCallStore } from '../../store/dmCallStore';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { logger } from '../../utils/logger';
import { toast } from '../../store/notification';
import { queryKeys } from '../../hooks/useQuery';
import Avatar from '../ui/Avatar';
import MemberContextMenu from '../member/MemberContextMenu';
import ProfileModal from '../ProfileModal';

interface MessageAvatarProps {
  avatarUrl?: string | null;
  initial: string;
  userName: string;
  userId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MessageAvatar({
  avatarUrl,
  initial,
  userName,
  userId,
  size = 'md'
}: MessageAvatarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { startCall } = useDMCallStore();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isCurrentUser = currentUser?.id === userId;

  // Adjust context menu position to prevent overflow
  useLayoutEffect(() => {
    if (!contextMenu || !contextMenuRef.current) return;

    const rect = contextMenuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = contextMenu.x;
    let y = contextMenu.y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }

    setAdjustedPosition({ x, y });
  }, [contextMenu]);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    // Use capture phase to ensure we catch the click before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside, true);
  }, [contextMenu]);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't show context menu for own messages
    if (isCurrentUser) return;

    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleViewProfile = () => {
    setShowProfileModal(true);
    closeContextMenu();
  };

  const handleSendMessage = async () => {
    closeContextMenu();

    try {
      const channel = await api.getOrCreateDM(userId);

      // Invalidate DM channels cache to include new/updated channel
      await queryClient.invalidateQueries({ queryKey: queryKeys.dmChannels });

      navigate(`/chat/dm/${channel.id}`);
    } catch (err) {
      logger.error('Failed to create DM from message avatar:', err);
      toast.error(
        t('errors.failedToStartConversation') || 'Failed to start conversation'
      );
    }
  };

  const handleStartCall = async () => {
    closeContextMenu();

    try {
      // Create DM channel first
      const channel = await api.getOrCreateDM(userId);

      // Invalidate DM channels cache to include new/updated channel
      await queryClient.invalidateQueries({ queryKey: queryKeys.dmChannels });

      // Start the call immediately (before navigation)
      startCall(channel.id, userId, userName);

      // Emit socket event
      socketService.getSocket()?.emit('dm:call:start', {
        channelId: channel.id,
        targetUserId: userId
      });

      // Navigate to DM (call overlay already showing)
      navigate(`/chat/dm/${channel.id}`);
    } catch (err) {
      logger.error('Failed to start call from message avatar:', err);
      toast.error(t('errors.failedToStartCall') || 'Failed to start call');
    }
  };

  return (
    <>
      <div
        onClick={handleAvatarClick}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <Avatar size={size} src={avatarUrl || undefined} alt={userName}>
          {initial}
        </Avatar>
      </div>

      {/* Context Menu Portal */}
      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              top: adjustedPosition.y,
              left: adjustedPosition.x,
              zIndex: 9999
            }}
            className="bg-boxflow-darker border border-boxflow-border rounded-md shadow-2xl min-w-[220px]"
          >
            <MemberContextMenu
              userId={userId}
              displayName={userName}
              isCurrentUser={false}
              canModerate={false}
              onViewProfile={handleViewProfile}
              onSendMessage={handleSendMessage}
              onStartCall={handleStartCall}
            />
          </div>,
          document.body
        )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          userId={userId}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
