// Reusable Setting Item Component with label and control
import React from 'react';

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingItem({
  label,
  description,
  children
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-boxflow-darker rounded-lg hover:bg-boxflow-hover transition-colors">
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium text-boxflow-light">{label}</div>
        {description && (
          <div className="text-xs text-boxflow-muted mt-0.5">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
