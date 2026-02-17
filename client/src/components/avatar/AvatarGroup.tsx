// Avatar Group - Display multiple avatars in a stack
import React from 'react';
import Avatar from '../ui/Avatar';

interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    initial: string;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarGroup({
  avatars,
  max = 5,
  size = 'sm',
  className = ''
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div key={index} className="ring-2 ring-boxflow-dark rounded-full">
          <Avatar size={size} src={avatar.src} alt={avatar.alt}>
            {avatar.initial}
          </Avatar>
        </div>
      ))}
      {remaining > 0 && (
        <div className="ring-2 ring-boxflow-dark rounded-full">
          <Avatar size={size}>+{remaining}</Avatar>
        </div>
      )}
    </div>
  );
}
