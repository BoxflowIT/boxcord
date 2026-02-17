// Workspace Icon - Display workspace icon or initial
import React from 'react';

interface WorkspaceIconProps {
  name: string;
  iconUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-14 h-14 text-lg'
};

export default function WorkspaceIcon({
  name,
  iconUrl,
  size = 'md',
  className = ''
}: WorkspaceIconProps) {
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={name}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center rounded-2xl bg-boxflow-darker text-white font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
