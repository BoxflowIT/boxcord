// Reusable Workspace Header Component
import React from 'react';
import { ChevronDownIcon } from '../ui/Icons';

interface WorkspaceHeaderProps {
  name: string;
  iconUrl?: string;
  onClick?: () => void;
}

export function WorkspaceHeader({
  name,
  iconUrl,
  onClick
}: WorkspaceHeaderProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex-row justify-between px-4 py-3 hover:bg-boxflow-hover transition-colors"
    >
      <div className="flex-row">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded bg-boxflow-primary flex items-center justify-center text-white text-sm font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-boxflow-light truncate flex-1">
          {name}
        </span>
      </div>
      <ChevronDownIcon />
    </button>
  );
}
