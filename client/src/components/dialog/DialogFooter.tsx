// Dialog Footer - Reusable dialog footer with actions
import { cn } from '../../utils/classNames';

interface DialogFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

const alignClasses: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between'
};

export default function DialogFooter({
  children,
  align = 'right',
  className = ''
}: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex gap-3 p-6 border-t border-boxflow-border',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
