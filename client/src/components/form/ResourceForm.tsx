import { useFormState } from '../../hooks/useFormState';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Button } from './Button';
import { FormGroup } from './FormGroup';

export interface ResourceFormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

export interface ResourceFormProps {
  fields: ResourceFormField[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

/**
 * Generic form for creating/editing resources (channels, workspaces, etc)
 */
export default function ResourceForm({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = 'Spara',
  cancelText = 'Avbryt',
  isLoading = false
}: ResourceFormProps) {
  const { values, errors, isSubmitting, setValue, handleSubmit } = useFormState(
    {
      initialValues: fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: initialValues[field.name] ?? ''
        }),
        {} as Record<string, string>
      ),
      validate: (vals) => {
        const errs: Record<string, string> = {};
        fields.forEach((field) => {
          if (field.required && !vals[field.name]?.trim()) {
            errs[field.name] = `${field.label} är obligatorisk`;
          }
          if (field.maxLength && vals[field.name]?.length > field.maxLength) {
            errs[field.name] = `Max ${field.maxLength} tecken`;
          }
        });
        return errs;
      },
      onSubmit
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup spacing="md">
        {fields.map((field) => {
          const commonProps = {
            label: field.label,
            value: values[field.name] ?? '',
            onChange: (
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => setValue(field.name, e.target.value),
            placeholder: field.placeholder,
            error: errors[field.name],
            fullWidth: true,
            disabled: isLoading || isSubmitting
          };

          if (field.type === 'textarea') {
            return (
              <TextArea
                key={field.name}
                {...commonProps}
                rows={4}
                maxLength={field.maxLength}
              />
            );
          }

          return (
            <TextInput
              key={field.name}
              {...commonProps}
              type={field.type === 'url' ? 'url' : 'text'}
              maxLength={field.maxLength}
            />
          );
        })}

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading || isSubmitting}
          >
            {submitText}
          </Button>
        </div>
      </FormGroup>
    </form>
  );
}
