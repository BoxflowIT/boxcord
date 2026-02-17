// Workspace Sidebar - Vertical workspace list
import React from 'react';
import WorkspaceButton from './WorkspaceButton';
import AddButton from './AddButton';

interface Workspace {
  id: string;
  name: string;
  iconUrl?: string;
}

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onSelectWorkspace: (workspace: Workspace) => void;
  onAddWorkspace: () => void;
  onEditWorkspace?: (workspace: Workspace, e: React.MouseEvent) => void;
  onDeleteWorkspace?: (workspace: Workspace, e: React.MouseEvent) => void;
  footer?: React.ReactNode;
}

export default function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  footer
}: WorkspaceSidebarProps) {
  return (
    <div className="sidebar-icon">
      {/* Workspace list */}
      {workspaces.map((workspace) => (
        <WorkspaceButton
          key={workspace.id}
          id={workspace.id}
          name={workspace.name}
          iconUrl={workspace.iconUrl}
          isActive={currentWorkspaceId === workspace.id}
          onClick={() => onSelectWorkspace(workspace)}
          onEdit={
            onEditWorkspace ? (e) => onEditWorkspace(workspace, e) : undefined
          }
          onDelete={
            onDeleteWorkspace
              ? (e) => onDeleteWorkspace(workspace, e)
              : undefined
          }
        />
      ))}

      {/* Add workspace button */}
      <AddButton
        onClick={onAddWorkspace}
        title="Lägg till workspace"
        variant="workspace"
      />

      {/* Spacer to push footer to bottom */}
      <div className="flex-1" />

      {/* Optional footer (e.g., settings button) */}
      {footer}
    </div>
  );
}
