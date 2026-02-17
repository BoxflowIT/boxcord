// Reusable Workspace List Component (Icon sidebar)
import React from 'react';
import { PlusIcon, HomeIcon } from '../ui/Icons';

interface Workspace {
  id: string;
  name: string;
  iconUrl?: string;
}

interface WorkspaceListProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace?: () => void;
  onGoHome?: () => void;
}

export function WorkspaceList({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onGoHome
}: WorkspaceListProps) {
  return (
    <div className="sidebar-main">
      {/* Home button */}
      {onGoHome && (
        <button onClick={onGoHome} className="sidebar-icon" title="Hem">
          <HomeIcon />
        </button>
      )}

      {/* Separator */}
      <div className="w-8 h-0.5 bg-boxflow-hover rounded-full mx-auto" />

      {/* Workspace icons */}
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => onSelectWorkspace(workspace.id)}
          className={`sidebar-icon ${
            currentWorkspaceId === workspace.id ? 'active' : ''
          }`}
          title={workspace.name}
        >
          {workspace.iconUrl ? (
            <img
              src={workspace.iconUrl}
              alt={workspace.name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            <span className="text-lg font-bold">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      ))}

      {/* Add workspace button */}
      {onCreateWorkspace && (
        <button
          onClick={onCreateWorkspace}
          className="sidebar-icon"
          title="Skapa workspace"
        >
          <PlusIcon />
        </button>
      )}
    </div>
  );
}
