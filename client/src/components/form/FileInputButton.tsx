// File Input Button - Styled file upload button
import React, { useRef } from 'react';
import { PlusIcon } from '../ui/Icons';
import { cn } from '../../utils/classNames';

interface FileInputButtonProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  className?: string;
}

export default function FileInputButton({
  onFileSelect,
  accept = 'image/*',
  disabled = false,
  label = 'Välj fil',
  icon,
  variant = 'default',
  className = ''
}: FileInputButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const variantClasses = {
    default: 'btn-secondary',
    primary: 'btn-primary',
    ghost: 'btn-ghost'
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(variantClasses[variant], className)}
      >
        {icon || <PlusIcon size="sm" />}
        {label && <span className="ml-2">{label}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}
