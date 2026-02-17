// Workspace Button - Clickable workspace with all interactions
import React from 'react';
import WorkspaceIcon from './WorkspaceIcon';

interface WorkspaceButtonProps {
  id: string;
  name: string;
  iconUrl?: string;
  isActive: boolean;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export default function WorkspaceButton({
  id,
  name,
  iconUrl,
  isActive,
  onClick,
  onEdit,
  onDelete
}: WorkspaceButtonProps) {
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (onEdit) {
      e.preventDefault();
      onEdit(e);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onDelete) {
      e.preventDefault();
      onDelete(e);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={
          isActive ? 'workspace-icon-active' : 'workspace-icon-inactive'
        }
        title={`${name}\n${onEdit ? 'Dubbelklick: redigera\n' : ''}${onDelete ? 'Högerklick: ta bort' : ''}`}
      >
        {iconUrl ? (
          <img src={iconUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </button>
    </div>
  );
}
