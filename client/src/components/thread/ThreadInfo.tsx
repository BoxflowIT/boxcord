// Thread Info - Reply count, participants, follow status, analytics
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Thread } from '../../store/thread';
import { getThreadAnalytics } from '../../hooks/useThreads';
import type { ThreadAnalytics } from '../../hooks/useThreads';

interface ThreadInfoProps {
  thread: Thread;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function ThreadInfo({
  thread,
  isFollowing,
  onToggleFollow
}: ThreadInfoProps) {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<ThreadAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!showAnalytics) return;

    let cancelled = false;
    getThreadAnalytics(thread.id)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [
    showAnalytics,
    thread.id,
    thread.replyCount,
    thread.isArchived,
    thread.isResolved
  ]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              showAnalytics
                ? 'bg-boxflow-primary/20 text-boxflow-primary'
                : 'bg-boxflow-hover text-boxflow-muted hover:bg-boxflow-hover/80'
            }`}
          >
            {t('threads.analytics')}
          </button>
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
      </div>

      {/* Analytics panel */}
      {showAnalytics && analytics && (
        <div className="mt-3 p-3 bg-boxflow-hover/30 rounded border border-boxflow-border">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-boxflow-muted">
                {t('threads.analyticsAge')}
              </span>
              <span className="ml-1 text-boxflow-light font-medium">
                {analytics.ageDays}{' '}
                {analytics.ageDays === 1 ? t('threads.day') : t('threads.days')}
              </span>
            </div>
            <div>
              <span className="text-boxflow-muted">
                {t('threads.analyticsRate')}
              </span>
              <span className="ml-1 text-boxflow-light font-medium">
                {analytics.repliesPerDay}/{t('threads.day')}
              </span>
            </div>
            {analytics.timeToFirstReplyMs !== null && (
              <div>
                <span className="text-boxflow-muted">
                  {t('threads.analyticsFirstReply')}
                </span>
                <span className="ml-1 text-boxflow-light font-medium">
                  {formatDuration(analytics.timeToFirstReplyMs)}
                </span>
              </div>
            )}
            <div>
              <span className="text-boxflow-muted">
                {t('threads.analyticsLastActive')}
              </span>
              <span className="ml-1 text-boxflow-light font-medium">
                {formatDuration(analytics.timeSinceLastActivityMs)}{' '}
                {t('threads.ago')}
              </span>
            </div>
          </div>
          {analytics.isStale && (
            <div className="mt-2 text-xs text-yellow-400">
              ⚠️ {t('threads.staleWarning')}
            </div>
          )}
        </div>
      )}

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
