// Channel Category Component - Collapsible category grouping
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '../ui/Icons';

interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  unreadCount?: number;
}

interface ChannelCategoryProps {
  name: string;
  channels: Channel[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  onChannelClick: (channelId: string) => void;
  onAddChannel?: () => void;
  canManage?: boolean;
  activeChannelId?: string;
}

export function ChannelCategory({
  name,
  channels,
  isCollapsed = false,
  onToggle,
  onChannelClick,
  onAddChannel,
  canManage = false,
  activeChannelId
}: ChannelCategoryProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-2">
      {/* Category Header */}
      <div className="flex items-center justify-between px-2 py-1 hover:bg-boxflow-hover rounded group">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide"
        >
          {isCollapsed ? (
            <ChevronRightIcon size="sm" />
          ) : (
            <ChevronDownIcon size="sm" />
          )}
          {name}
        </button>
        {canManage && onAddChannel && (
          <button
            onClick={onAddChannel}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-opacity"
            title={t('channels.addChannel')}
          >
            <PlusIcon size="sm" />
          </button>
        )}
      </div>

      {/* Channels List */}
      {!isCollapsed && (
        <div className="mt-1 space-y-0.5">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelClick(channel.id)}
              className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded text-left
                transition-colors group
                ${
                  activeChannelId === channel.id
                    ? 'bg-boxflow-hover text-white'
                    : 'text-gray-300 hover:bg-boxflow-hover hover:text-white'
                }
              `}
            >
              <span className="text-gray-400">
                {channel.type === 'VOICE' ? '🔊' : '#'}
              </span>
              <span className="flex-1 truncate">{channel.name}</span>
              {channel.unreadCount && channel.unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Category Manager - For creating/editing categories
interface CategoryManagerProps {
  onCreateCategory: (name: string) => void;
  onClose: () => void;
}

export function CategoryManager({
  onCreateCategory,
  onClose
}: CategoryManagerProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateCategory(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {t('channels.createCategory')}
        </h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">
            {t('channels.categoryName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('channels.categoryNamePlaceholder')}
            className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            maxLength={50}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              {t('common.create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
