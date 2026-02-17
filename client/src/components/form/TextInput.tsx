// Reusable Text Input Component
import React, { forwardRef } from 'react';
import { cn } from '../../utils/classNames';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && <label className="label-base">{label}</label>}
        <input
          ref={ref}
          className={cn('input-base', error && 'input-error', className)}
          {...props}
        />
        {error && <p className="text-xs text-boxflow-danger mt-1">{error}</p>}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
