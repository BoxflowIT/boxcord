// Direct Messages List Component
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/auth';
import { useDMChannels, queryKeys } from '../hooks/useQuery';
import { useUserSearch } from '../hooks/useUserSearch';
import { useDMCallStore } from '../store/dmCallStore';
import { getOtherUser } from '../utils/dmUtils';
import DMListHeader from './dm/DMListHeader';
import DMSearchPanel from './dm/DMSearchPanel';
import DMListItem from './dm/DMListItem';
import type { DMChannel } from '../types';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DMListProps {
  onSelectDM: (channelId: string, otherUser: UserInfo) => void;
  selectedId?: string;
  onInviteToServer?: (userId: string) => void;
}

export default function DMList({
  onSelectDM,
  selectedId,
  onInviteToServer
}: DMListProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: dmChannels, isLoading, refetch } = useDMChannels();
  const { startCall } = useDMCallStore();
  const queryClient = useQueryClient();

  const [showNewDM, setShowNewDM] = useState(false);
  const { searchQuery, searchResults, handleSearch, clearSearch } =
    useUserSearch({
      currentUserId: user?.id
    });

  const channels = dmChannels || [];

  const handleStartDM = async (selectedUser: UserInfo) => {
    try {
      const channel = await api.getOrCreateDM(selectedUser.id);
      setShowNewDM(false);
      clearSearch();
      await refetch();
      onSelectDM(channel.id, selectedUser);
    } catch (err) {
      logger.error('Failed to start DM:', err);
    }
  };

  // Context menu handlers
  const handleStartCall = useCallback(
    (channelId: string, otherUser: UserInfo) => {
      const displayName = otherUser.firstName ?? otherUser.email;
      startCall(channelId, otherUser.id, displayName);
      // Navigate to DM to show call UI
      onSelectDM(channelId, otherUser);
    },
    [startCall, onSelectDM]
  );

  const handleInviteToServer = useCallback(
    (otherUser: UserInfo) => {
      if (onInviteToServer) {
        onInviteToServer(otherUser.id);
      }
      // Invite modal is handled by parent component
    },
    [onInviteToServer]
  );

  const handleMuteNotifications = useCallback((channelId: string) => {
    // TODO: Implement mute notifications
    logger.log('Mute notifications for:', channelId);
  }, []);

  const handleDeleteConversation = useCallback(
    async (channelId: string) => {
      try {
        await api.deleteDM(channelId);
        // Remove from cache
        queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
          if (!old) return old;
          return old.filter((ch) => ch.id !== channelId);
        });
        logger.log('Deleted DM conversation:', channelId);
      } catch (err) {
        logger.error('Failed to delete DM conversation:', err);
      }
    },
    [queryClient]
  );

  const handleMarkAsRead = useCallback(
    async (channelId: string) => {
      try {
        await api.markDMAsRead(channelId);
        // Update cache
        queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
          if (!old) return old;
          return old.map((ch) =>
            ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
          );
        });
      } catch (err) {
        logger.error('Failed to mark as read:', err);
      }
    },
    [queryClient]
  );

  return (
    <div className="flex flex-col min-h-0 border-t border-discord-darkest">
      <DMListHeader onNewDM={() => setShowNewDM(true)} />

      {showNewDM && (
        <DMSearchPanel
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearchChange={handleSearch}
          onSelectUser={handleStartDM}
          onClose={() => {
            setShowNewDM(false);
            clearSearch();
          }}
        />
      )}

      {/* DM list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner-container p-4">
              <div className="spinner-ring w-8 h-8" />
              <p className="text-muted text-xs">{t('common.loading')}</p>
            </div>
          </div>
        ) : channels.length === 0 ? (
          <p className="text-gray-400 text-sm p-2">Inga konversationer</p>
        ) : (
          channels.map((channel) => {
            const otherUser = getOtherUser(channel, user?.id);
            if (!otherUser) return null;

            return (
              <DMListItem
                key={channel.id}
                channelId={channel.id}
                otherUser={otherUser}
                unreadCount={channel.unreadCount}
                isSelected={selectedId === channel.id}
                onClick={() => onSelectDM(channel.id, otherUser)}
                onStartCall={() => handleStartCall(channel.id, otherUser)}
                onInviteToServer={() => handleInviteToServer(otherUser)}
                onMuteNotifications={() => handleMuteNotifications(channel.id)}
                onDeleteConversation={() =>
                  handleDeleteConversation(channel.id)
                }
                onMarkAsRead={() => handleMarkAsRead(channel.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
