// Reusable Section Header Component (for lists with add button)
import { PlusIcon } from '../ui/Icons';

interface SectionHeaderProps {
  title: string;
  onAdd?: () => void;
  addTitle?: string;
}

export function SectionHeader({
  title,
  onAdd,
  addTitle = 'Lägg till'
}: SectionHeaderProps) {
  return (
    <div className="flex-row justify-between px-2 py-2">
      <span className="text-xs font-semibold text-boxflow-muted uppercase">
        {title}
      </span>
      {onAdd && (
        <button onClick={onAdd} className="btn-icon-primary" title={addTitle}>
          <PlusIcon size="sm" />
        </button>
      )}
    </div>
  );
}
