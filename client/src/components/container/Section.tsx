// Section - Content section with optional title and description
import { cn } from '../../utils/classNames';

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spacingClasses: Record<string, string> = {
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6'
};

export default function Section({
  title,
  description,
  children,
  spacing = 'md',
  className = ''
}: SectionProps) {
  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-boxflow-light">
              {title}
            </h3>
          )}
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      )}
      <div className={spacingClasses[spacing]}>{children}</div>
    </div>
  );
}
