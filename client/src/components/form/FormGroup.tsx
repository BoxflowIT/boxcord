// Reusable Form Group Component

interface FormGroupProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

export function FormGroup({ children, spacing = 'md' }: FormGroupProps) {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return <div className={spacingClasses[spacing]}>{children}</div>;
}
