// Custom Status Modal - Set custom status message
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../ui/Icons';

interface CustomStatusModalProps {
  currentStatus?: string;
  currentEmoji?: string;
  onSave: (status: string, emoji: string, dndUntil?: Date) => void;
  onClose: () => void;
}

const PRESET_EMOJIS = [
  '😀',
  '😴',
  '🏖️',
  '🚀',
  '💻',
  '☕',
  '🎮',
  '📚',
  '🎵',
  '💪'
];
const PRESET_STATUSES = [
  { emoji: '😴', text: 'Away' },
  { emoji: '💻', text: 'Working' },
  { emoji: '🏖️', text: 'On vacation' },
  { emoji: '🚀', text: 'In a meeting' },
  { emoji: '☕', text: 'Taking a break' }
];

export function CustomStatusModal({
  currentStatus = '',
  currentEmoji = '😀',
  onSave,
  onClose
}: CustomStatusModalProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(currentStatus);
  const [emoji, setEmoji] = useState(currentEmoji);
  const [dndDuration, setDndDuration] = useState<string>('');

  const handleSave = () => {
    let dndUntil: Date | undefined;

    if (dndDuration) {
      const now = new Date();
      switch (dndDuration) {
        case '30m':
          dndUntil = new Date(now.getTime() + 30 * 60 * 1000);
          break;
        case '1h':
          dndUntil = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '4h':
          dndUntil = new Date(now.getTime() + 4 * 60 * 60 * 1000);
          break;
        case 'today':
          dndUntil = new Date(now);
          dndUntil.setHours(23, 59, 59, 999);
          break;
      }
    }

    onSave(status, emoji, dndUntil);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t('profile.customStatus')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* Emoji Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t('profile.statusEmoji')}
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-2xl p-2 rounded hover:bg-gray-800 transition-colors ${
                  emoji === e ? 'bg-gray-800 ring-2 ring-blue-500' : ''
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Status Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t('profile.statusMessage')}
          </label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder={t('profile.statusPlaceholder')}
            className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
          />
          <div className="text-xs text-gray-400 mt-1">{status.length}/50</div>
        </div>

        {/* Preset Statuses */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t('profile.presetStatuses')}
          </label>
          <div className="space-y-2">
            {PRESET_STATUSES.map((preset) => (
              <button
                key={preset.text}
                onClick={() => {
                  setEmoji(preset.emoji);
                  setStatus(preset.text);
                }}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors text-left"
              >
                <span className="text-xl">{preset.emoji}</span>
                <span>{preset.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DND Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {t('profile.dndDuration')}
          </label>
          <select
            value={dndDuration}
            onChange={(e) => setDndDuration(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('profile.dndNone')}</option>
            <option value="30m">{t('profile.dnd30min')}</option>
            <option value="1h">{t('profile.dnd1hour')}</option>
            <option value="4h">{t('profile.dnd4hours')}</option>
            <option value="today">{t('profile.dndToday')}</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            {t('common.save')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
