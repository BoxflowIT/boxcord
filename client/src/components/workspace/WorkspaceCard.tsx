interface WorkspaceCardProps {
  name: string;
  iconUrl?: string | null;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Interactive workspace card with edit/delete actions
 */
export default function WorkspaceCard({
  name,
  iconUrl,
  isActive,
  onClick,
  onEdit,
  onDelete
}: WorkspaceCardProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit();
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
        title={`${name}\nDubbelklick: redigera\nHögerklick: ta bort`}
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
