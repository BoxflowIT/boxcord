// Reusable Workspace Sidebar (Left icon column)
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  SettingsIcon,
  JoinIcon,
  CloudIcon,
  CalendarIcon,
  GlobeIcon
} from '../ui/Icons';
import WorkspaceIcon from './WorkspaceIcon';
import type { Workspace } from '../../types';
import type { ActiveView } from '../../store/chat';

// ─── Icons ───────────────────────────────────────────────────────────────────

function BoxflowLogo({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/logo-64.png"
      alt="Boxflow"
      width={size}
      height={size}
      className="rounded-md"
    />
  );
}

function MicrosoftLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#2b2d31" />
      <rect x="8" y="8" width="11" height="11" rx="1" fill="#f25022" />
      <rect x="21" y="8" width="11" height="11" rx="1" fill="#7fba00" />
      <rect x="8" y="21" width="11" height="11" rx="1" fill="#00a4ef" />
      <rect x="21" y="21" width="11" height="11" rx="1" fill="#ffb900" />
    </svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  activeView: ActiveView;
  msConnected?: boolean;
  msEnabled?: boolean;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onHelloFlowClick: () => void;
  onIntegrationClick: (id: 'onedrive' | 'calendar' | 'sharepoint') => void;
  onMsConnect: () => void;
  onEditWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onDeleteWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onLeaveWorkspace: (workspace: Workspace, e: React.MouseEvent) => void;
  onCreateWorkspace: () => void;
  onJoinServer: () => void;
  onSettingsClick?: () => void;
}

// ─── Integration sub-menu items ──────────────────────────────────────────────

const MS_ITEMS = [
  {
    id: 'onedrive' as const,
    icon: CloudIcon,
    label: 'OneDrive',
    colorClass: 'text-blue-400'
  },
  {
    id: 'calendar' as const,
    icon: CalendarIcon,
    label: 'Kalender',
    colorClass: 'text-blue-400'
  },
  {
    id: 'sharepoint' as const,
    icon: GlobeIcon,
    label: 'SharePoint',
    colorClass: 'text-teal-400'
  }
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkspaceSidebar({
  workspaces,
  currentWorkspaceId,
  activeView,
  msConnected,
  msEnabled,
  onWorkspaceSelect,
  onHelloFlowClick,
  onIntegrationClick,
  onMsConnect,
  onEditWorkspace,
  onDeleteWorkspace,
  onLeaveWorkspace,
  onCreateWorkspace,
  onJoinServer,
  onSettingsClick
}: WorkspaceSidebarProps) {
  const { t } = useTranslation();
  const [showMsMenu, setShowMsMenu] = useState(false);
  const msMenuRef = useRef<HTMLDivElement>(null);

  // Close MS menu on click outside
  useEffect(() => {
    if (!showMsMenu) return;
    const handler = (e: MouseEvent) => {
      if (msMenuRef.current && !msMenuRef.current.contains(e.target as Node)) {
        setShowMsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMsMenu]);

  return (
    <div className="sidebar-icon">
      {/* Workspace icons */}
      {workspaces.map((workspace) => (
        <WorkspaceIcon
          key={workspace.id}
          id={workspace.id}
          name={workspace.name}
          iconUrl={workspace.iconUrl}
          isActive={
            currentWorkspaceId === workspace.id &&
            activeView.type === 'workspace'
          }
          onSelect={() => onWorkspaceSelect(workspace)}
          onEdit={(e) => onEditWorkspace(workspace, e)}
          onDelete={(e) => onDeleteWorkspace(workspace, e)}
          onLeave={(e) => onLeaveWorkspace(workspace, e)}
        />
      ))}

      {/* ── Separator + HelloFlow + Microsoft ── */}
      {msEnabled && (
        <>
          <div className="w-8 h-px bg-gray-600 mx-auto my-1" />

          {/* HelloFlow site icon */}
          {msConnected && (
            <div className="relative group">
              <button
                onClick={onHelloFlowClick}
                className={
                  activeView.type === 'helloflow'
                    ? 'workspace-icon-active'
                    : 'workspace-icon-inactive'
                }
                title="HelloFlow Intranät"
              >
                <BoxflowLogo />
              </button>
            </div>
          )}

          {/* Microsoft 365 integrations icon */}
          <div className="relative" ref={msMenuRef}>
            <button
              onClick={() => {
                if (!msConnected) {
                  onMsConnect();
                } else {
                  setShowMsMenu(!showMsMenu);
                }
              }}
              className={
                activeView.type === 'integration'
                  ? 'workspace-icon-active'
                  : 'workspace-icon-inactive'
              }
              title={msConnected ? 'Microsoft 365' : 'Anslut Microsoft 365'}
            >
              <MicrosoftLogo />
            </button>

            {/* Sub-menu popout */}
            {showMsMenu && msConnected && (
              <div className="absolute left-full top-0 ml-2 bg-boxflow-darkest border border-boxflow-border rounded-lg shadow-2xl py-1.5 min-w-[160px] z-50">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                  Microsoft 365
                </div>
                {MS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeView.type === 'integration' &&
                    activeView.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onIntegrationClick(item.id);
                        setShowMsMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-boxflow-primary/20 text-white'
                          : 'text-gray-300 hover:bg-boxflow-hover hover:text-white'
                      }`}
                    >
                      <Icon
                        size="sm"
                        className={`flex-shrink-0 ${item.colorClass}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

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
