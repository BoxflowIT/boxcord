// Direct Messages List Component
import { useState } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/auth';
import { useDMChannels } from '../hooks/useQuery';
import { formatRelativeTime } from '../utils/dateTime';
import Avatar from './ui/Avatar';
import DMListHeader from './dm/DMListHeader';
import DMSearchPanel from './dm/DMSearchPanel';

interface DMChannel {
  id: string;
  participants: {
    userId: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount?: number;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);

  const channels = dmChannels || [];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await api.searchUsers(query);
      // Filter out current user
      setSearchResults(results.filter((u) => u.id !== user?.id));
    } catch (err) {
      logger.error('Search failed:', err);
    }
  };

  const handleStartDM = async (selectedUser: UserInfo) => {
    try {
      const channel = await api.getOrCreateDM(selectedUser.id);
      setShowNewDM(false);
      setSearchQuery('');
      setSearchResults([]);

      // Refetch channels from cache to include new one
      await refetch();

      // User info will be fetched automatically via useUsers hook

      onSelectDM(channel.id, selectedUser);
    } catch (err) {
      logger.error('Failed to start DM:', err);
    }
  };

  const getOtherUser = (channel: DMChannel): UserInfo | undefined => {
    const otherParticipant = channel.participants.find(
      (p) => p.userId !== user?.id
    );

    // Use user data directly from participant
    return otherParticipant?.user;
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
            setSearchQuery('');
            setSearchResults([]);
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
            const otherUser = getOtherUser(channel);
            if (!otherUser) return null;

            const hasUnread = (channel.unreadCount ?? 0) > 0;

            return (
              <button
                key={channel.id}
                onClick={() => onSelectDM(channel.id, otherUser)}
                className={`list-item-interactive w-full ${
                  selectedId === channel.id ? 'bg-[#404249]/60' : ''
                }`}
              >
                <Avatar size="sm">
                  {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-sm truncate ${hasUnread ? 'text-white font-semibold' : 'text-body'}`}
                  >
                    {otherUser.firstName ?? otherUser.email}
                  </p>
                  {channel.lastMessage && (
                    <p className="text-subtle truncate">
                      {channel.lastMessage.content}
                    </p>
                  )}
                </div>
                <div className="flex-row">
                  {channel.lastMessage && (
                    <span className="text-subtle">
                      {formatRelativeTime(channel.lastMessage.createdAt)}
                    </span>
                  )}
                  {hasUnread && (
                    <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
