// Reusable Workspace Sidebar (Left icon column)
import { PlusIcon, SettingsIcon } from '../ui/Icons';
import WorkspaceIcon from './WorkspaceIcon';
import type { Workspace } from '../../types';

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onEditWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onDeleteWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onCreateWorkspace: () => void;
  onSettingsClick?: () => void;
}

export default function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  onWorkspaceSelect,
  onEditWorkspace,
  onDeleteWorkspace,
  onCreateWorkspace,
  onSettingsClick
}: WorkspaceSidebarProps) {
  return (
    <div className="sidebar-icon">
      {workspaces.map((workspace) => (
        <WorkspaceIcon
          key={workspace.id}
          id={workspace.id}
          name={workspace.name}
          iconUrl={workspace.iconUrl}
          isActive={currentWorkspaceId === workspace.id}
          onSelect={() => onWorkspaceSelect(workspace)}
          onEdit={(e) => onEditWorkspace(workspace, e)}
          onDelete={(e) => onDeleteWorkspace(workspace, e)}
        />
      ))}

      <button
        onClick={onCreateWorkspace}
        className="workspace-icon-add"
        title="Lägg till workspace"
      >
        <PlusIcon size="lg" />
      </button>

      <div className="flex-1" />

      <button
        onClick={onSettingsClick}
        className="workspace-icon-add"
        title="Settings"
      >
        <SettingsIcon size="lg" />
      </button>
    </div>
  );
}
