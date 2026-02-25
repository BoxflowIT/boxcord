// Enhanced Voice Controls - PTT, Mute, Deafen, Video, Screen Share
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MicrophoneIcon,
  MicrophoneMutedIcon,
  VolumeIcon,
  VolumeMutedIcon,
  VideoIcon,
  VideoOffIcon,
  ScreenShareIcon,
  PhoneOffIcon
} from '../ui/Icons';

interface VoiceControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isPushToTalk: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onTogglePTT: () => void;
  onLeave: () => void;
}

export function VoiceControls({
  isMuted,
  isDeafened,
  isVideoEnabled,
  isScreenSharing,
  isPushToTalk,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onTogglePTT,
  onLeave
}: VoiceControlsProps) {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Audio Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? t('voice.unmute') : t('voice.mute')}
          >
            {isMuted ? (
              <MicrophoneMutedIcon size="md" />
            ) : (
              <MicrophoneIcon size="md" />
            )}
          </button>

          <button
            onClick={onToggleDeafen}
            className={`p-3 rounded-full transition-colors ${
              isDeafened
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isDeafened ? t('voice.undeafen') : t('voice.deafen')}
          >
            {isDeafened ? (
              <VolumeMutedIcon size="md" />
            ) : (
              <VolumeIcon size="md" />
            )}
          </button>
        </div>

        {/* Video Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            title={
              isVideoEnabled ? t('voice.disableVideo') : t('voice.enableVideo')
            }
          >
            {isVideoEnabled ? (
              <VideoIcon size="md" />
            ) : (
              <VideoOffIcon size="md" />
            )}
          </button>

          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={
              isScreenSharing
                ? t('voice.stopScreenShare')
                : t('voice.startScreenShare')
            }
          >
            <ScreenShareIcon size="md" />
          </button>
        </div>

        {/* Settings & Leave */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title={t('voice.settings')}
          >
            ⚙️
          </button>

          <button
            onClick={onLeave}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title={t('voice.leave')}
          >
            <PhoneOffIcon size="md" />
          </button>
        </div>
      </div>

      {/* PTT Indicator */}
      {isPushToTalk && !isMuted && (
        <div className="mt-3 text-center text-sm text-gray-400">
          {t('voice.pttHint')}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPushToTalk}
                onChange={onTogglePTT}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">{t('voice.pushToTalk')}</div>
                <div className="text-xs text-gray-400">
                  {t('voice.pushToTalkDescription')}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
