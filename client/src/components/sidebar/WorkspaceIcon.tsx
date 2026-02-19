// Reusable Workspace Icon Component
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface WorkspaceIconProps {
  id: string;
  name: string;
  iconUrl?: string;
  isActive: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onLeave: (e: React.MouseEvent) => void;
}

export default function WorkspaceIcon({
  name,
  iconUrl,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onLeave
}: WorkspaceIconProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={
          isActive ? 'workspace-icon-active' : 'workspace-icon-inactive'
        }
        title={`${name}\nHögerklick: meny`}
      >
        {iconUrl ? (
          <img src={iconUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </button>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-boxflow-darkest border border-boxflow-border rounded-md shadow-2xl py-1.5 min-w-[180px]"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-boxflow-light hover:bg-boxflow-primary hover:text-white transition-colors flex items-center gap-2"
            onClick={(e) => {
              setShowMenu(false);
              onEdit(e);
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>{t('channels.editServer')}</span>
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-boxflow-light hover:bg-boxflow-primary hover:text-white transition-colors flex items-center gap-2"
            onClick={(e) => {
              setShowMenu(false);
              onLeave(e);
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t('workspace.leave')}</span>
          </button>
          <div className="border-t border-boxflow-border my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
            onClick={(e) => {
              setShowMenu(false);
              onDelete(e);
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>{t('channels.deleteServer')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
