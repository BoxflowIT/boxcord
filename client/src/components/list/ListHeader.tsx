// List Header - Generic list section header

interface ListHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export default function ListHeader({
  title,
  count,
  action,
  className = ''
}: ListHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-2 mb-1 ${className}`}>
      <span className="text-subtle uppercase font-semibold text-xs">
        {title}
        {count !== undefined && ` — ${count}`}
      </span>
      {action}
    </div>
  );
}
