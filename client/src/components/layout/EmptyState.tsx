// Reusable Empty State Component
import React from 'react';

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
    <div className="flex-col-centered h-full text-center p-8">
      {icon && <div className="text-6xl mb-4 text-boxflow-muted">{icon}</div>}
      <h3 className="text-xl font-semibold text-boxflow-light mb-2">{title}</h3>
      {description && (
        <p className="text-boxflow-muted mb-4 max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}
