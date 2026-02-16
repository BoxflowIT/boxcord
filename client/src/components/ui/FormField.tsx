// Form Field Component - Reusable input with label
import { forwardRef, InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, className = '', required, ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-discord-darkest border rounded text-white placeholder-gray-500 
            focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent
            ${error ? 'border-red-500' : 'border-discord-darker'}
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
                ? `${props.id}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="text-xs text-red-400 mt-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="text-xs text-gray-500 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
