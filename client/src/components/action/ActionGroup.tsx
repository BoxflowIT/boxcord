// Action Group - Group of action buttons with spacing
import { cn } from '../../utils/classNames';

interface ActionGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

const spacingClasses: Record<string, Record<string, string>> = {
  horizontal: {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-4'
  },
  vertical: {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-4'
  }
};

const alignClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between'
};

export default function ActionGroup({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  align = 'start',
  className = ''
}: ActionGroupProps) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        spacingClasses[orientation][spacing],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
