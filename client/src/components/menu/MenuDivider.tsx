// Menu Divider - Visual separator in menus
import { cn } from '../../utils/classNames';

interface MenuDividerProps {
  className?: string;
}

export default function MenuDivider({ className = '' }: MenuDividerProps) {
  return (
    <div className={cn('my-1 border-t border-boxflow-border', className)} />
  );
}
