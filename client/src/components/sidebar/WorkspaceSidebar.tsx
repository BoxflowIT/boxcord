// Reusable Workspace Sidebar (Left icon column)
import { useTranslation } from 'react-i18next';
import { PlusIcon, SettingsIcon, JoinIcon } from '../ui/Icons';
import WorkspaceIcon from './WorkspaceIcon';
import type { Workspace } from '../../types';

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onEditWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onDeleteWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onLeaveWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onCreateWorkspace: () => void;
  onJoinServer: () => void;
  onSettingsClick?: () => void;
}

export default function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  onWorkspaceSelect,
  onEditWorkspace,
  onDeleteWorkspace,
  onLeaveWorkspace,
  onCreateWorkspace,
  onJoinServer,
  onSettingsClick
}: WorkspaceSidebarProps) {
  const { t } = useTranslation();
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
          onLeave={(e) => onLeaveWorkspace(workspace, e)}
        />
      ))}

      <button
        onClick={onCreateWorkspace}
        className="workspace-icon-add"
        title={t('channels.createServer')}
      >
        <PlusIcon size="lg" />
      </button>

      <button
        onClick={onJoinServer}
        className="workspace-icon-add"
        title={t('invite.joinServer')}
      >
        <JoinIcon size="lg" />
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
