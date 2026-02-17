// Reusable Workspace Icon Component
interface WorkspaceIconProps {
  id: string;
  name: string;
  iconUrl?: string;
  isActive: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function WorkspaceIcon({
  name,
  iconUrl,
  isActive,
  onSelect,
  onEdit,
  onDelete
}: WorkspaceIconProps) {
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        onDoubleClick={onEdit}
        onContextMenu={(e) => {
          e.preventDefault();
          onDelete(e);
        }}
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
