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
            <span className="text-sm font-medium text-[#5865f2]">
              Boxcord Bot
            </span>
            {isPrivate && (
              <span className="text-xs text-[#80848e]">
                Endast synligt för dig
              </span>
            )}
          </div>
          <div className="text-[#f2f3f5] text-sm whitespace-pre-wrap">
            {content}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#80848e] hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
