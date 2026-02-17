// Reusable Settings Modal Header Component
import { CloseIcon } from '../ui/Icons';

interface SettingsHeaderProps {
  title: string;
  onClose: () => void;
}

export default function SettingsHeader({
  title,
  onClose
}: SettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-discord-darkest">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <button
        onClick={onClose}
        className="p-2 hover:bg-[#404249] rounded-lg transition-colors"
      >
        <CloseIcon className="w-6 h-6 text-gray-400" />
      </button>
    </div>
  );
}
