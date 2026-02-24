/**
 * DM Call Overlay
 * Displays when a DM voice call is active (ringing/calling/connected)
 */
import { useTranslation } from 'react-i18next';
import { useDMCallStore } from '../../store/dmCallStore';
import { useVoiceControls } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import Avatar from '../ui/Avatar';
import { VideoGrid } from '../voice/VideoGrid';
import { MinimizedVideoIndicatorNew } from '../voice/MinimizedVideoIndicatorNew';
import { FloatingVideoWindowNew } from '../voice/FloatingVideoWindowNew';
import {
  PhoneHangUpIcon,
  MicIcon,
  MicOffIcon,
  HeadphonesIcon,
  HeadphonesOffIcon,
  VideoIcon,
  VideoOffIcon,
  ScreenShareIcon
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
  const { isMuted, isDeafened, isVideoEnabled, isScreenSharing } =
    useVoiceControls();

  if (callState === 'idle' || callState === 'ending') return null;

  const handleToggleMute = async () => {
    await voiceService.toggleMute();
  };

  const handleToggleDeafen = async () => {
    await voiceService.toggleDeafen();
  };

  const handleToggleVideo = async () => {
    await voiceService.toggleVideo();
  };

  const handleToggleScreenShare = async () => {
    await voiceService.toggleScreenShare();
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
      <>
        {/* Video Grid (if video/screen share is active) */}
        <VideoGrid />

        {/* Minimized video indicator (floating) */}
        <MinimizedVideoIndicatorNew />

        {/* Floating video window (draggable + resizable) */}
        <FloatingVideoWindowNew />

        {/* Voice/Video controls overlay */}
        <div className="fixed bottom-4 right-4 bg-boxflow-dark border border-green-500/50 rounded-lg p-4 shadow-xl z-50 min-w-[350px]">
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

          {/* Voice/Video controls */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              }`}
              title={isMuted ? t('voice.unmute') : t('voice.mute')}
            >
              {isMuted ? <MicOffIcon size="sm" /> : <MicIcon size="sm" />}
            </button>

            <button
              onClick={handleToggleDeafen}
              className={`p-2 rounded-lg transition-colors ${
                isDeafened
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              }`}
              title={isDeafened ? t('voice.undeafen') : t('voice.deafen')}
            >
              {isDeafened ? (
                <HeadphonesOffIcon size="sm" />
              ) : (
                <HeadphonesIcon size="sm" />
              )}
            </button>

            <button
              onClick={handleToggleVideo}
              className={`p-2 rounded-lg transition-colors ${
                isVideoEnabled
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              }`}
              title={
                isVideoEnabled
                  ? t('voice.disableVideo')
                  : t('voice.enableVideo')
              }
            >
              {isVideoEnabled ? (
                <VideoIcon size="sm" />
              ) : (
                <VideoOffIcon size="sm" />
              )}
            </button>

            <button
              onClick={handleToggleScreenShare}
              className={`p-2 rounded-lg transition-colors ${
                isScreenSharing
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              }`}
              title={
                isScreenSharing
                  ? t('voice.stopScreenShare')
                  : t('voice.startScreenShare')
              }
            >
              <ScreenShareIcon size="sm" />
            </button>

            <button
              onClick={onEndCall}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              title={t('voice.hangUp')}
            >
              <PhoneHangUpIcon size="sm" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
