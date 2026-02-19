// DM Search Panel Component
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../ui/Icons';
import Avatar from '../ui/Avatar';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DMSearchPanelProps {
  searchQuery: string;
  searchResults: UserInfo[];
  onSearchChange: (query: string) => void;
  onSelectUser: (user: UserInfo) => void;
  onClose: () => void;
}

export default function DMSearchPanel({
  searchQuery,
  searchResults,
  onSearchChange,
  onSelectUser,
  onClose
}: DMSearchPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="p-2 border-b border-discord-darkest flex-shrink-0">
      <div className="flex-row mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('dm.searchUsers')}
          className="input-base text-sm flex-1"
          autoFocus
        />
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
          title={t('common.close')}
        >
          <CloseIcon size="sm" />
        </button>
      </div>
      {searchResults.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto">
          {searchResults.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
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
  );
}
