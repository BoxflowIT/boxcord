// Reusable Text Area Component
import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && <label className="label-base">{label}</label>}
        <textarea
          ref={ref}
          className={`textarea-base ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-boxflow-danger mt-1">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
