// Reusable Settings Tab Button Component

interface SettingsTabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function SettingsTabButton({
  label,
  isActive,
  onClick
}: SettingsTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-boxflow-hover text-white font-medium'
          : 'text-boxflow-muted hover:bg-boxflow-hover/50 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
