// Reusable Message List Component
import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState } from '../ui/LoadingSpinner';

interface MessageListProps {
  loading: boolean;
  messages: React.ReactNode;
  emptyState?: React.ReactNode;
  autoScroll?: boolean;
}

export function MessageList({
  loading,
  messages,
  emptyState,
  autoScroll = true
}: MessageListProps) {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingState text={t('common.loadingMessages')} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {emptyState || messages}
      <div ref={messagesEndRef} />
    </div>
  );
}
