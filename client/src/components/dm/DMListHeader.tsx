// DM List Header Component
import { PlusIcon } from '../ui/Icons';

interface DMListHeaderProps {
  onNewDM: () => void;
}

export default function DMListHeader({ onNewDM }: DMListHeaderProps) {
  return (
    <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
      <span className="text-xs font-semibold text-gray-400 uppercase">
        Direktmeddelanden
      </span>
      <button
        onClick={onNewDM}
        className="text-gray-400 hover:text-white"
        title="Nytt meddelande"
      >
        <PlusIcon size="sm" />
      </button>
    </div>
  );
}
