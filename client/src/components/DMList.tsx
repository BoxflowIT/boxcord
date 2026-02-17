// Direct Messages List Component
import { useState } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/auth';
import { useDMChannels } from '../hooks/useQuery';
import { useUserSearch } from '../hooks/useUserSearch';
import { getOtherUser } from '../utils/dmUtils';
import DMListHeader from './dm/DMListHeader';
import DMSearchPanel from './dm/DMSearchPanel';
import DMListItem from './dm/DMListItem';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DMListProps {
  onSelectDM: (channelId: string, otherUser: UserInfo) => void;
  selectedId?: string;
}

export default function DMList({ onSelectDM, selectedId }: DMListProps) {
  const { user } = useAuthStore();
  const { data: dmChannels, isLoading, refetch } = useDMChannels();

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
              <p className="text-muted text-xs">Laddar...</p>
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
                lastMessage={channel.lastMessage}
                unreadCount={channel.unreadCount}
                isSelected={selectedId === channel.id}
                onClick={() => onSelectDM(channel.id, otherUser)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
