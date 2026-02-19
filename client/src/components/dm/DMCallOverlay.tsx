/**
 * DM Call Overlay
 * Displays when a DM voice call is active (ringing/calling/connected)
 */
import { useTranslation } from 'react-i18next';
import { useDMCallStore } from '../../store/dmCallStore';
import { useVoiceStore } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import Avatar from '../ui/Avatar';
import {
  PhoneHangUpIcon,
  MicIcon,
  MicOffIcon,
  HeadphonesIcon,
  HeadphonesOffIcon
} from '../ui/Icons';

interface DMCallOverlayProps {
  onAccept?: () => void;
  onReject?: () => void;
  onEndCall?: () => void;
}

export function DMCallOverlay({
  onAccept,
  onReject,
  onEndCall
}: DMCallOverlayProps) {
  const { t } = useTranslation();
  const { callState, otherUserName } = useDMCallStore();
  const { isMuted, isDeafened } = useVoiceStore();

  if (callState === 'idle' || callState === 'ending') return null;

  const handleToggleMute = async () => {
    await voiceService.toggleMute();
  };

  const handleToggleDeafen = async () => {
    await voiceService.toggleDeafen();
  };

  // Incoming call (ringing state)
  if (callState === 'ringing') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-boxflow-dark border border-boxflow-border rounded-lg p-8 max-w-md w-full text-center">
          <Avatar size="lg" className="mx-auto mb-4">
            {otherUserName?.charAt(0) || '?'}
          </Avatar>

          <h2 className="text-2xl font-semibold text-white mb-2">
            {otherUserName}
          </h2>

          <p className="text-gray-400 mb-6">{t('voice.incomingCall')}</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onReject}
              className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center gap-2"
            >
              <PhoneHangUpIcon size="md" />
              {t('voice.reject')}
            </button>

            <button
              onClick={onAccept}
              className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors flex items-center gap-2"
            >
              <MicIcon size="md" />
              {t('voice.answer')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calling state
  if (callState === 'calling') {
    return (
      <div className="fixed bottom-4 right-4 bg-boxflow-dark border border-boxflow-border rounded-lg p-4 shadow-xl z-50 min-w-[300px]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar size="sm">{otherUserName?.charAt(0) || '?'}</Avatar>
          <div className="flex-1">
            <p className="text-white font-medium">{otherUserName}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              {t('voice.calling')}
            </p>
          </div>
          <button
            onClick={onEndCall}
            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            title={t('common.cancel')}
          >
            <PhoneHangUpIcon size="sm" />
          </button>
        </div>
      </div>
    );
  }

  // Connected state
  if (callState === 'connected') {
    return (
      <div className="fixed bottom-4 right-4 bg-boxflow-dark border border-green-500/50 rounded-lg p-4 shadow-xl z-50 min-w-[300px]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar size="sm">{otherUserName?.charAt(0) || '?'}</Avatar>
          <div className="flex-1">
            <p className="text-white font-medium">{otherUserName}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {t('voice.inCall')}
            </p>
          </div>
        </div>

        {/* Voice controls */}
        <div className="flex gap-2">
          <button
            onClick={handleToggleMute}
            className={`flex-1 p-2 rounded-lg transition-colors ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOffIcon size="sm" /> : <MicIcon size="sm" />}
          </button>

          <button
            onClick={handleToggleDeafen}
            className={`flex-1 p-2 rounded-lg transition-colors ${
              isDeafened
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {isDeafened ? (
              <HeadphonesOffIcon size="sm" />
            ) : (
              <HeadphonesIcon size="sm" />
            )}
          </button>

          <button
            onClick={onEndCall}
            className="flex-1 p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            title={t('voice.hangUp')}
          >
            <PhoneHangUpIcon size="sm" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
