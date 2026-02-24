import { useState, useCallback } from 'react';

export interface FormField<T> {
  value: T;
  error?: string;
}

export interface UseFormStateOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useFormState<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit
}: UseFormStateOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Run validation
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      // Submit form
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
          setIsDirty(false);
        } catch {
          // Error handling can be done in onSubmit
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validate, onSubmit]
  );

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    setValue,
    setFieldError,
    clearErrors,
    reset,
    handleSubmit
  };
}
