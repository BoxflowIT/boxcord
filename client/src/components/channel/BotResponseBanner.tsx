interface BotResponseBannerProps {
  content: string;
  isPrivate: boolean;
  onDismiss: () => void;
}

/**
 * Ephemeral bot response banner
 */
export default function BotResponseBanner({
  content,
  isPrivate,
  onDismiss
}: BotResponseBannerProps) {
  return (
    <div className="px-4 pb-2">
      <div className="bot-response">
        <div className="bot-avatar">🤖</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-boxflow-primary">
              Boxcord Bot
            </span>
            {isPrivate && (
              <span className="text-xs text-boxflow-subtle">
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
          className="text-boxflow-subtle hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
