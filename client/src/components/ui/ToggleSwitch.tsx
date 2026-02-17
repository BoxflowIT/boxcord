// ToggleSwitch Component - Reusable toggle switch
import { ReactNode } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description
}: ToggleSwitchProps) {
  const buttonClasses = `
    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
    ${checked ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4]' : 'bg-[#404249]'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `
    .trim()
    .replace(/\s+/g, ' ');

  const thumbClasses = `
    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
    ${checked ? 'translate-x-6' : 'translate-x-1'}
  `
    .trim()
    .replace(/\s+/g, ' ');

  if (label || description) {
    return (
      <div className="flex items-center justify-between">
        {(label || description) && (
          <div>
            {label && <h3 className="text-heading">{label}</h3>}
            {description && <p className="text-muted">{description}</p>}
          </div>
        )}
        <button
          onClick={onChange}
          disabled={disabled}
          className={buttonClasses}
          role="switch"
          aria-checked={checked}
        >
          <span className={thumbClasses} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={buttonClasses}
      role="switch"
      aria-checked={checked}
    >
      <span className={thumbClasses} />
    </button>
  );
}
