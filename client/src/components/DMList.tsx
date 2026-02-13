// Direct Messages List Component
import { useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useDMChannels, useUsers } from '../hooks/useQuery';

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
  // React Query hook - automatisk caching och deduplicering
  const { data: dmChannels, isLoading, refetch } = useDMChannels();

  // Hämta alla andra user IDs från DM channels
  const otherUserIds = useMemo(() => {
    if (!dmChannels || !user) return [];
    return dmChannels.flatMap((ch) =>
      ch.participants.filter((p) => p.userId !== user.id).map((p) => p.userId)
    );
  }, [dmChannels, user]);

  // Hämta alla users samtidigt med caching (React Query deduplice automatiskt!)
  const { data: usersArray = [] } = useUsers(otherUserIds);

  // Konvertera till Map för enkel lookup
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

  // Konvertera dmChannels från React Query till const
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
      console.error('Search failed:', err);
    }
  };

  const handleStartDM = async (selectedUser: UserInfo) => {
    try {
      const channel = await api.getOrCreateDM(selectedUser.id);
      setShowNewDM(false);
      setSearchQuery('');
      setSearchResults([]);

      // Refetch channels från cache för att inkludera den nya
      await refetch();

      // User info kommer att hämtas automatiskt via useUsers hook!

      onSelectDM(channel.id, selectedUser);
    } catch (err) {
      console.error('Failed to start DM:', err);
    }
  };

  const getOtherUser = (channel: DMChannel): UserInfo | undefined => {
    const otherId = channel.participants.find(
      (p) => p.userId !== user?.id
    )?.userId;
    return otherId ? users.get(otherId) : undefined;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Nu';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('sv-SE');
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
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
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
            className="w-full px-3 py-2 bg-discord-darkest rounded text-white text-sm"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="mt-1 max-h-40 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartDM(u)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-discord-dark rounded text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm">
                    {u.firstName?.charAt(0) ?? u.email.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-gray-400 text-xs">{u.email}</p>
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
            <div className="text-center">
              <div className="relative w-8 h-8 mx-auto mb-2">
                <div className="absolute inset-0 border-3 border-boxflow-border rounded-full"></div>
                <div className="absolute inset-0 border-3 border-boxflow-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-boxflow-muted text-xs">Laddar...</p>
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
                className={`w-full flex items-center gap-3 p-2 rounded hover:bg-discord-dark/50 ${
                  selectedId === channel.id ? 'bg-discord-dark/50' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm flex-shrink-0">
                  {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-sm truncate">
                    {otherUser.firstName ?? otherUser.email}
                  </p>
                  {channel.lastMessage && (
                    <p className="text-gray-400 text-xs truncate">
                      {channel.lastMessage.content}
                    </p>
                  )}
                </div>
                {channel.lastMessage && (
                  <span className="text-xs text-gray-500">
                    {formatTime(channel.lastMessage.createdAt)}
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
