// Reusable Channel Section Component
import { PlusIcon, EditIcon, CloseIcon } from '../ui/Icons';
import type { Channel } from '../../types';
import { cn } from '../../utils/classNames';

interface ChannelSectionProps {
  channels: Channel[];
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  onEditChannel: (channel: Channel, e: React.MouseEvent) => void;
  onDeleteChannel: (channel: Channel, e: React.MouseEvent) => void;
  onCreateChannel: () => void;
}

export default function ChannelSection({
  channels,
  currentChannelId,
  onChannelSelect,
  onEditChannel,
  onDeleteChannel,
  onCreateChannel
}: ChannelSectionProps) {
  return (
    <>
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-subtle uppercase font-semibold">
          Text Kanaler
        </span>
        <button onClick={onCreateChannel} className="btn-icon-primary">
          <PlusIcon size="sm" />
        </button>
      </div>

      {channels.map((channel) => {
        const hasUnread = (channel.unreadCount ?? 0) > 0;
        return (
          <div
            key={channel.id}
            className={cn(
              'group w-full flex-row px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer',
              currentChannelId === channel.id
                ? 'nav-item-active'
                : 'nav-item-default'
            )}
            onClick={() => onChannelSelect(channel)}
          >
            <span className="text-lg">#</span>
            <span
              className={cn(
                'truncate flex-1',
                hasUnread && 'text-white font-semibold'
              )}
            >
              {channel.name}
            </span>
            {hasUnread && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
                {channel.unreadCount}
              </span>
            )}
            <button
              onClick={(e) => onEditChannel(channel, e)}
              className="btn-icon hover-group-visible"
              title="Redigera kanal"
            >
              <EditIcon size="sm" />
            </button>
            <button
              onClick={(e) => onDeleteChannel(channel, e)}
              className="btn-icon-danger hover-group-visible"
              title="Ta bort kanal"
            >
              <CloseIcon size="sm" />
            </button>
          </div>
        );
      })}
    </>
  );
}
