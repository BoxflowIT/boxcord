// Direct Messages List Component
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/auth';
import { useDMChannels, useUsers } from '../hooks/useQuery';
import { formatRelativeTime } from '../utils/dateTime';
import Avatar from './ui/Avatar';
import { PlusIcon } from './ui/Icons';

interface DMChannel {
  id: string;
  participants: { userId: string }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
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

  // Extract other user IDs from DM channels
  const otherUserIds = useMemo(() => {
    if (!dmChannels || !user) return [];
    return dmChannels.flatMap((ch) =>
      ch.participants.filter((p) => p.userId !== user.id).map((p) => p.userId)
    );
  }, [dmChannels, user]);

  // Fetch all users at once with caching (React Query deduplicates automatically)
  const { data: usersArray = [] } = useUsers(otherUserIds);

  // Convert to Map for easy lookup
  const users = useMemo(() => {
    const map = new Map<string, UserInfo>();
    usersArray.forEach((u) => {
      if (u) map.set(u.id, u);
    });
    return map;
  }, [usersArray]);

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
    const otherId = channel.participants.find(
      (p) => p.userId !== user?.id
    )?.userId;
    return otherId ? users.get(otherId) : undefined;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-discord-darkest">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          Direktmeddelanden
        </span>
        <button
          onClick={() => setShowNewDM(true)}
          className="text-gray-400 hover:text-white"
          title="Nytt meddelande"
        >
          <PlusIcon size="sm" />
        </button>
      </div>

      {/* New DM search */}
      {showNewDM && (
        <div className="p-2 border-b border-discord-darkest">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Sök användare..."
            className="input-base text-sm"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="mt-1 max-h-40 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartDM(u)}
                  className="list-item-interactive w-full text-left"
                >
                  <Avatar size="sm">
                    {u.firstName?.charAt(0) ?? u.email.charAt(0)}
                  </Avatar>
                  <div>
                    <p className="text-body text-sm">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-subtle">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DM list */}
      <div className="flex-1 overflow-y-auto p-2">
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

            return (
              <button
                key={channel.id}
                onClick={() => onSelectDM(channel.id, otherUser)}
                className={`list-item-interactive w-full ${
                  selectedId === channel.id ? 'bg-discord-dark/50' : ''
                }`}
              >
                <Avatar size="sm">
                  {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-body text-sm truncate">
                    {otherUser.firstName ?? otherUser.email}
                  </p>
                  {channel.lastMessage && (
                    <p className="text-subtle truncate">
                      {channel.lastMessage.content}
                    </p>
                  )}
                </div>
                {channel.lastMessage && (
                  <span className="text-subtle">
                    {formatRelativeTime(channel.lastMessage.createdAt)}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
