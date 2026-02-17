// Member Section - Role-based grouping header
import React from 'react';

interface MemberSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export default function MemberSection({
  title,
  count,
  children
}: MemberSectionProps) {
  return (
    <div className="mb-4">
      <h4 className="text-subtle uppercase font-semibold px-2 mb-1">
        {title} — {count}
      </h4>
      {children}
    </div>
  );
}
