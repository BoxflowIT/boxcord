// Reusable Bot Response Component (Ephemeral messages)
import React from 'react';

interface BotResponseProps {
  content: string;
  isPrivate?: boolean;
  onDismiss: () => void;
}

export function BotResponse({
  content,
  isPrivate = false,
  onDismiss
}: BotResponseProps) {
  return (
    <div className="px-4 pb-2">
      <div className="bot-response">
        <div className="bot-avatar">🤖</div>
        <div className="flex-1">
          <div className="flex-row mb-1">
            <span className="text-sm font-medium text-boxflow-primary">
              Boxcord Bot
            </span>
            {isPrivate && (
              <span className="text-xs text-boxflow-muted">
                Endast synligt för dig
              </span>
            )}
          </div>
          <div className="text-boxflow-light text-sm whitespace-pre-wrap">
            {content}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-boxflow-muted hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
