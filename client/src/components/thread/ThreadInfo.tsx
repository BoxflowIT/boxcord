// Thread Info - Reply count, participants, follow status
import { useTranslation } from 'react-i18next';
import type { Thread } from '../../store/thread';

interface ThreadInfoProps {
  thread: Thread;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export function ThreadInfo({
  thread,
  isFollowing,
  onToggleFollow
}: ThreadInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-2 border-b border-boxflow-border bg-boxflow-darker text-sm flex-shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-boxflow-muted">
          {thread.replyCount}{' '}
          {thread.replyCount === 1 ? t('threads.reply') : t('threads.replies')}
          {' • '}
          {thread.participantCount}{' '}
          {thread.participantCount === 1
            ? t('threads.participant')
            : t('threads.participants')}
        </span>
        <button
          onClick={onToggleFollow}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isFollowing
              ? 'bg-boxflow-primary text-white hover:bg-boxflow-primary/80'
              : 'bg-boxflow-hover text-boxflow-muted hover:bg-boxflow-hover/80'
          }`}
        >
          {isFollowing ? t('threads.following') : t('threads.follow')}
        </button>
      </div>

      {/* Original message preview */}
      {thread.message && (
        <div className="mt-3 p-3 bg-boxflow-hover/50 rounded border-l-2 border-boxflow-primary">
          <div className="text-xs text-boxflow-muted mb-1">
            {thread.message.author?.firstName || thread.message.author?.email}
          </div>
          <div className="text-sm text-boxflow-normal line-clamp-2">
            {thread.message.content}
          </div>
        </div>
      )}

      {thread.isLocked && (
        <div className="mt-2 text-yellow-500 text-xs">
          🔒 {t('threads.locked')}
        </div>
      )}
    </div>
  );
}
