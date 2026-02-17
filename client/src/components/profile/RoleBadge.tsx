// Reusable Role Badge Component
import React from 'react';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

const roleConfig = {
  OWNER: {
    label: 'Ägare',
    color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
  },
  ADMIN: {
    label: 'Admin',
    color: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
  },
  MEMBER: {
    label: 'Medlem',
    color: 'bg-boxflow-muted/20 text-boxflow-muted border-boxflow-muted/30'
  }
};

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = roleConfig[role];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
