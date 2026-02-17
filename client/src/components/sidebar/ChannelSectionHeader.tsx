import { PlusIcon } from '../ui/Icons';

interface ChannelSectionHeaderProps {
  title: string;
  onAdd: () => void;
  addTitle?: string;
}

/**
 * Section header with add button
 */
export default function ChannelSectionHeader({
  title,
  onAdd,
  addTitle = 'Lägg till'
}: ChannelSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 mb-1">
      <span className="text-subtle uppercase font-semibold">{title}</span>
      <button onClick={onAdd} className="btn-icon-primary" title={addTitle}>
        <PlusIcon size="sm" />
      </button>
    </div>
  );
}
