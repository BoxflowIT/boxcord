// Tab Panel - Content panel for tabs
import React from 'react';

interface TabPanelProps {
  children: React.ReactNode;
  activeTab: string;
  tabId: string;
  keepMounted?: boolean;
  className?: string;
}

export default function TabPanel({
  children,
  activeTab,
  tabId,
  keepMounted = false,
  className = ''
}: TabPanelProps) {
  const isActive = activeTab === tabId;

  if (!isActive && !keepMounted) {
    return null;
  }

  return (
    <div
      className={`${!isActive && keepMounted ? 'hidden' : ''} ${className}`}
      role="tabpanel"
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}
