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
import VideoQualitySelector from '../voice/VideoQualitySelector';
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
  const { isMuted, isDeafened, isSpeaking, isVideoEnabled, isScreenSharing } =
    useVoiceControls();

  if (callState === 'idle') return null;

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

  const handleQualityChange = async () => {
    try {
      await voiceService.changeVideoQuality();
    } catch (error) {
      console.error('[DMCallOverlay] Failed to change quality:', error);
    }
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
          <div className="flex items-center justify-center gap-1.5">
            <div className="relative">
              {!isMuted && isSpeaking && (
                <span className="absolute inset-0 rounded-lg border-2 border-green-500 animate-pulse pointer-events-none" />
              )}
              <button
                onClick={handleToggleMute}
                className={`p-2.5 rounded-lg transition-all duration-150 ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : isSpeaking
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
                }`}
                title={isMuted ? t('voice.unmute') : t('voice.mute')}
              >
                {isMuted ? <MicOffIcon size="sm" /> : <MicIcon size="sm" />}
              </button>
            </div>

            <button
              onClick={handleToggleDeafen}
              className={`p-2.5 rounded-lg transition-all duration-150 ${
                isDeafened
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
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
              className={`p-2.5 rounded-lg transition-all duration-150 ${
                isVideoEnabled
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
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

            {/* Video Quality Selector - only show when video is enabled */}
            {isVideoEnabled && (
              <VideoQualitySelector
                compact
                onQualityChange={handleQualityChange}
              />
            )}

            <button
              onClick={handleToggleScreenShare}
              className={`p-2.5 rounded-lg transition-all duration-150 ${
                isScreenSharing
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
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
              className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-150"
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
