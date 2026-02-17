// Reusable Setting Section Component
import React from 'react';

interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingSection({
  title,
  description,
  children
}: SettingSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-boxflow-light">{title}</h3>
        {description && (
          <p className="text-sm text-boxflow-muted mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
