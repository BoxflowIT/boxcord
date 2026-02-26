// Thread Reply List - Scrollable list of replies
import { useTranslation } from 'react-i18next';
import { ThreadIcon } from '../ui/Icons';
import { ThreadReplyItem } from './ThreadReplyItem';
import type { ThreadReply } from '../../store/thread';

interface ThreadReplyListProps {
  replies: ThreadReply[];
  loading: boolean;
  currentUserId?: string;
  onReaction: (replyId: string, emoji: string) => void;
  onMoreReactions: (replyId: string, rect: DOMRect) => void;
  onEdit: (replyId: string, content: string) => void;
  onSaveEdit: (replyId: string, newContent: string) => void;
  onCancelEdit: () => void;
  onDelete: (replyId: string) => void;
  onForward: (reply: ThreadReply) => void;
}

export function ThreadReplyList({
  replies,
  loading,
  currentUserId,
  onReaction,
  onMoreReactions,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onForward
}: ThreadReplyListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center text-boxflow-muted py-8">
          {t('common.loading')}...
        </div>
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center text-boxflow-muted py-8">
          <ThreadIcon size="lg" className="mx-auto mb-2 opacity-50" />
          <p>{t('threads.noRepliesYet')}</p>
          <p className="text-xs mt-1">{t('threads.startConversation')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-8">
      {replies.map((reply) => (
        <ThreadReplyItem
          key={reply.id}
          reply={reply}
          isOwner={reply.authorId === currentUserId}
          onReaction={onReaction}
          onMoreReactions={onMoreReactions}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
          onForward={onForward}
        />
      ))}
    </div>
  );
}
