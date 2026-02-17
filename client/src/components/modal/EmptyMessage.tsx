// Empty State Message - Shows when no items are found

interface EmptyMessageProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyMessage({
  message,
  icon,
  className = ''
}: EmptyMessageProps) {
  return (
    <div className={`text-muted px-2 py-4 text-center ${className}`}>
      {icon && (
        <div className="mb-2 flex justify-center opacity-50">{icon}</div>
      )}
      <p>{message}</p>
    </div>
  );
}
