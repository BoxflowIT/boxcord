// Menu Divider - Visual separator in menus

interface MenuDividerProps {
  className?: string;
}

export default function MenuDivider({ className = '' }: MenuDividerProps) {
  return <div className={`my-1 border-t border-boxflow-border ${className}`} />;
}
