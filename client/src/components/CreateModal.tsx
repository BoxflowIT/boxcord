// Create Modal for Channel or Workspace
import { useState, useCallback, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { HashIcon, AnnouncementIcon, VoiceChannelIcon } from './ui/Icons';
import { cn } from '../utils/classNames';

type ChannelType = 'TEXT' | 'ANNOUNCEMENT' | 'VOICE';

interface ChannelTypeOption {
  type: ChannelType;
  label: string;
  descriptionKey: string;
  icon: React.ComponentType<{ size?: 'sm' | 'md' | 'lg'; className?: string }>;
}

const CHANNEL_TYPES: ChannelTypeOption[] = [
  {
    type: 'TEXT',
    label: 'Text',
    descriptionKey: 'channels.textChannelDescription',
    icon: HashIcon
  },
  {
    type: 'ANNOUNCEMENT',
    label: 'Announcement',
    descriptionKey: 'channels.announcementChannelDescription',
    icon: AnnouncementIcon
  },
  {
    type: 'VOICE',
    label: 'Voice',
    descriptionKey: 'channels.voiceChannelDescription',
    icon: VoiceChannelIcon
  }
];

interface CreateModalProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  createButtonText?: string;
  onCreate: (name: string, type?: ChannelType) => Promise<void>;
  onCancel: () => void;
  showChannelType?: boolean;
}

export default function CreateModal({
  isOpen,
  title,
  placeholder,
  createButtonText = 'Create',
  onCreate,
  onCancel,
  showChannelType = false
}: CreateModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>('TEXT');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const resetState = useCallback(() => {
    setName('');
    setChannelType('TEXT');
    setError(null);
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setError(null);
    setIsCreating(true);

    try {
      await onCreate(trimmedName, showChannelType ? channelType : undefined);
      resetState();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('channels.errorCreating')
      );
    } finally {
      setIsCreating(false);
    }
  }, [name, channelType, showChannelType, onCreate, resetState, t]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isCreating) {
        handleCreate();
      }
    },
    [handleCreate, isCreating]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onCancel();
        resetState();
      }
    },
    [onCancel, resetState]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500 rounded-md text-sm text-red-300">
              {error}
            </div>
          )}

          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            disabled={isCreating}
          />

          {showChannelType && (
            <ChannelTypeSelector
              value={channelType}
              onChange={setChannelType}
              disabled={isCreating}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isCreating}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? t('common.creating') : createButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Extracted channel type selector component
interface ChannelTypeSelectorProps {
  value: ChannelType;
  onChange: (type: ChannelType) => void;
  disabled?: boolean;
}

function ChannelTypeSelector({
  value,
  onChange,
  disabled
}: ChannelTypeSelectorProps) {
  const { t } = useTranslation();
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {t('channels.title')}
      </label>
      <div className="space-y-2">
        {CHANNEL_TYPES.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.type;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onChange(option.type)}
              disabled={disabled}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  isSelected
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                )}
              >
                <Icon size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-gray-400">{t(option.descriptionKey)}</p>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
