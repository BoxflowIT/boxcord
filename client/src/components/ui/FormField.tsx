// Form Field Component - Reusable input with label
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../utils/classNames';

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
          className="block text-sm font-semibold text-boxflow-muted mb-2"
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 bg-boxflow-darkest border rounded-lg text-white placeholder-boxflow-subtle',
            'focus:outline-none focus:ring-2 focus:ring-boxflow-primary focus:border-transparent focus:bg-boxflow-darker',
            'transition-all duration-200',
            error ? 'border-red-500' : 'border-boxflow-hover',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
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
