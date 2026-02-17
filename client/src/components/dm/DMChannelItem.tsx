// Reusable DM Channel Item Component
import React from 'react';
import Avatar from '../ui/Avatar';

interface DMChannelItemProps {
  id: string;
  userName: string;
  userInitial: string;
  avatarUrl?: string | null;
  isActive: boolean;
  unreadCount?: number;
  isOnline?: boolean;
  onClick: () => void;
}

export function DMChannelItem({
  id,
  userName,
  userInitial,
  avatarUrl,
  isActive,
  unreadCount = 0,
  isOnline = false,
  onClick
}: DMChannelItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex-row px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-boxflow-hover text-white'
          : 'text-boxflow-muted hover:bg-boxflow-hover hover:text-white'
      }`}
    >
      <div className="relative">
        <Avatar size="sm" src={avatarUrl || undefined} alt={userName}>
          {userInitial}
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-boxflow-darker rounded-full" />
        )}
      </div>
      <span className="flex-1 truncate">{userName}</span>
      {unreadCount > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-bold bg-boxflow-danger text-white rounded-full">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
