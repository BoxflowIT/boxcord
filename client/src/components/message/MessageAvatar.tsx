// Reusable Message Avatar Component
import React from 'react';
import Avatar from '../ui/Avatar';

interface MessageAvatarProps {
  avatarUrl?: string | null;
  initial: string;
  userName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MessageAvatar({
  avatarUrl,
  initial,
  userName,
  size = 'md'
}: MessageAvatarProps) {
  return (
    <Avatar size={size} src={avatarUrl || undefined} alt={userName}>
      {initial}
    </Avatar>
  );
}
