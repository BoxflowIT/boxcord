// Thread Notification Panel - Shows thread activity notifications
import { useTranslation } from 'react-i18next';
import { useThreadStore } from '../../store/thread';
import type { ThreadNotification } from '../../store/thread';
import {
  ThreadIcon,
  CheckCircleIcon,
  ArchiveIcon,
  CloseIcon
} from '../ui/Icons';

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function NotificationIcon({ type }: { type: ThreadNotification['type'] }) {
  switch (type) {
    case 'resolved':
      return <CheckCircleIcon size="sm" className="text-green-400" />;
    case 'archived':
      return <ArchiveIcon size="sm" className="text-yellow-400" />;
    default:
      return <ThreadIcon size="sm" className="text-blue-400" />;
  }
}

function NotificationMessage({
  notification,
  t
}: {
  notification: ThreadNotification;
  t: (key: string, opts?: Record<string, string>) => string;
}) {
  const title = notification.threadTitle || t('threads.thread');

  switch (notification.type) {
    case 'reply':
      return (
        <div>
          <span className="font-medium text-boxflow-light">
            {notification.actorName}
          </span>{' '}
          <span className="text-boxflow-muted">
            {t('threads.notifRepliedIn')}
          </span>{' '}
          <span className="font-medium text-boxflow-light">{title}</span>
          {notification.message && (
            <p className="text-xs text-boxflow-muted mt-0.5 line-clamp-1">
              {notification.message}
            </p>
          )}
        </div>
      );
    case 'mention':
      return (
        <div>
          <span className="font-medium text-boxflow-light">
            {notification.actorName}
          </span>{' '}
          <span className="text-boxflow-muted">
            {t('threads.notifMentionedIn')}
          </span>{' '}
          <span className="font-medium text-boxflow-light">{title}</span>
        </div>
      );
    case 'resolved':
      return (
        <div>
          <span className="font-medium text-boxflow-light">{title}</span>{' '}
          <span className="text-boxflow-muted">
            {t('threads.notifResolved')}
          </span>
        </div>
      );
    case 'archived':
      return (
        <div>
          <span className="font-medium text-boxflow-light">{title}</span>{' '}
          <span className="text-boxflow-muted">
            {t('threads.notifArchived')}
          </span>
        </div>
      );
    case 'created':
      return (
        <div>
          <span className="font-medium text-boxflow-light">
            {notification.actorName}
          </span>{' '}
          <span className="text-boxflow-muted">
            {t('threads.notifCreated')}
          </span>{' '}
          <span className="font-medium text-boxflow-light">{title}</span>
        </div>
      );
    default:
      return null;
  }
}

interface ThreadNotificationPanelProps {
  onSelectThread: (threadId: string) => void;
  onClose: () => void;
}

export function ThreadNotificationPanel({
  onSelectThread,
  onClose
}: ThreadNotificationPanelProps) {
  const { t } = useTranslation();
  const notifications = useThreadStore((s) => s.threadNotifications);
  const markRead = useThreadStore((s) => s.markNotificationRead);
  const markAllRead = useThreadStore((s) => s.markAllNotificationsRead);
  const clearAll = useThreadStore((s) => s.clearNotifications);
  const openThreadSidebar = useThreadStore((s) => s.openThreadSidebar);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (notification: ThreadNotification) => {
    markRead(notification.id);
    openThreadSidebar(notification.threadId);
    onSelectThread(notification.threadId);
  };

  return (
    <div className="border-t border-gray-700 py-3 px-3">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">
          {t('threads.notifications')}
          {unreadCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {t('threads.markAllRead')}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-400 ml-2"
            >
              {t('threads.clearAll')}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-400 ml-1"
          >
            <CloseIcon size="sm" />
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-xs text-gray-500 px-2 py-2 text-center">
          {t('threads.noNotifications')}
        </p>
      ) : (
        <div className="space-y-0.5 max-h-64 overflow-y-auto">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`w-full flex items-start gap-2 px-2 py-2 rounded text-xs text-left transition-colors hover:bg-gray-700/50 ${
                !notification.read ? 'bg-gray-700/30' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <NotificationIcon type={notification.type} />
              </div>
              <div className="flex-1 min-w-0">
                <NotificationMessage notification={notification} t={t} />
              </div>
              <span className="flex-shrink-0 text-gray-500 text-xs">
                {formatTimeAgo(notification.createdAt)}
              </span>
              {!notification.read && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
