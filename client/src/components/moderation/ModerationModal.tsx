// Moderation Tools Component
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, BanIcon, KickIcon } from '../ui/Icons';

interface ModerationModalProps {
  userId: string;
  userName: string;
  onKick: (userId: string, reason?: string) => void;
  onBan: (userId: string, reason?: string) => void;
  onClose: () => void;
}

export function ModerationModal({
  userId,
  userName,
  onKick,
  onBan,
  onClose
}: ModerationModalProps) {
  const { t } = useTranslation();
  const [action, setAction] = useState<'kick' | 'ban' | null>(null);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (action === 'kick') {
      onKick(userId, reason);
    } else if (action === 'ban') {
      onBan(userId, reason);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {t('moderation.moderateUser', { user: userName })}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <CloseIcon size="sm" />
          </button>
        </div>

        {!action ? (
          <div className="space-y-3">
            <button
              onClick={() => setAction('kick')}
              className="w-full flex items-center gap-3 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 rounded border border-yellow-500/30 transition-colors"
            >
              <KickIcon size="md" className="text-yellow-500" />
              <div className="text-left">
                <div className="font-semibold text-yellow-500">
                  {t('moderation.kickUser')}
                </div>
                <div className="text-sm text-gray-400">
                  {t('moderation.kickDescription')}
                </div>
              </div>
            </button>

            <button
              onClick={() => setAction('ban')}
              className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/30 transition-colors"
            >
              <BanIcon size="md" className="text-red-500" />
              <div className="text-left">
                <div className="font-semibold text-red-500">
                  {t('moderation.banUser')}
                </div>
                <div className="text-sm text-gray-400">
                  {t('moderation.banDescription')}
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t('moderation.reason')}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('moderation.reasonPlaceholder')}
                className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1">
                {reason.length}/500
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mb-4">
              <p className="text-sm text-yellow-500">
                {action === 'kick'
                  ? t('moderation.kickWarning', { user: userName })
                  : t('moderation.banWarning', { user: userName })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAction(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                  action === 'ban'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {action === 'kick'
                  ? t('moderation.confirmKick')
                  : t('moderation.confirmBan')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
