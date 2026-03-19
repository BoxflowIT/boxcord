// Reusable Empty State Component

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex-col-centered h-full text-center p-8 animate-fade-in-up">
      {icon && (
        <div className="w-20 h-20 rounded-full bg-boxflow-hover/50 flex items-center justify-center mb-6">
          <div className="text-4xl text-boxflow-muted">{icon}</div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-boxflow-light mb-2">{title}</h3>
      {description && (
        <p className="text-boxflow-muted mb-4 max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}
