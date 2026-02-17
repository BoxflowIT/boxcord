// Tabs - Tab navigation container
import React, { useState } from 'react';
import { cn } from '../../utils/classNames';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'default',
  className = ''
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (!controlledActiveTab) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  const variantClasses = {
    default: {
      container: 'border-b border-boxflow-border',
      tab: 'px-4 py-2 border-b-2 transition-colors',
      active: 'border-boxflow-primary text-white',
      inactive: 'border-transparent text-muted hover:text-boxflow-light'
    },
    pills: {
      container: 'gap-2',
      tab: 'px-4 py-2 rounded-lg transition-colors',
      active: 'bg-boxflow-primary text-white',
      inactive: 'text-muted hover:bg-boxflow-hover hover:text-boxflow-light'
    },
    underline: {
      container: 'gap-4 border-b border-boxflow-border',
      tab: 'px-2 py-3 border-b-2 transition-colors',
      active: 'border-boxflow-primary text-white font-medium',
      inactive: 'border-transparent text-muted hover:text-boxflow-light'
    }
  };

  const classes = variantClasses[variant];

  return (
    <div className={cn('flex', classes.container, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && handleTabClick(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'flex items-center gap-2 font-medium text-sm',
            classes.tab,
            activeTab === tab.id ? classes.active : classes.inactive,
            tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
