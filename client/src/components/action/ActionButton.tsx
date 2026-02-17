// Action Button - Generic action button with icon

interface ActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  disabled?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'btn-icon',
  primary: 'btn-icon-primary',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
};

export default function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  title,
  disabled = false,
  className = ''
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${variantClasses[variant]} ${className}`}
      title={title}
      disabled={disabled}
    >
      {icon}
      {label && <span className="ml-2">{label}</span>}
    </button>
  );
}
