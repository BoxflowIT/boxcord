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
  isSpeaking: boolean;
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
  isSpeaking,
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

  // Is the mic "live" (unmuted, or PTT active and speaking)
  const isMicLive = !isMuted && isSpeaking;

  return (
    <div className="border-t border-boxflow-border bg-boxflow-darkest/80 backdrop-blur-sm">
      {/* PTT active indicator bar */}
      {isPushToTalk && (
        <div
          className={`px-3 py-1.5 text-center text-xs font-medium transition-all duration-150 ${
            isMicLive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-boxflow-darker text-boxflow-muted'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isMicLive && (
              <span className="flex gap-0.5">
                <span className="w-1 h-3 bg-green-400 rounded-full animate-[voice-bar_0.4s_ease-in-out_infinite_alternate]" />
                <span className="w-1 h-4 bg-green-400 rounded-full animate-[voice-bar_0.3s_ease-in-out_infinite_alternate_0.1s]" />
                <span className="w-1 h-2 bg-green-400 rounded-full animate-[voice-bar_0.35s_ease-in-out_infinite_alternate_0.2s]" />
              </span>
            )}
            <span>
              {isMicLive
                ? t('voice.pttActive', 'Transmitting...')
                : t('voice.pttHint')}
            </span>
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-1">
        {/* Left: Audio controls */}
        <div className="flex items-center gap-1">
          {/* Mic button with speaking ring */}
          <div className="relative">
            {isMicLive && (
              <span className="absolute inset-0 rounded-lg border-2 border-green-500 animate-voice-glow pointer-events-none" />
            )}
            <button
              onClick={onToggleMute}
              disabled={isPushToTalk}
              className={`relative p-2.5 rounded-lg transition-all duration-150 ${
                isPushToTalk
                  ? isMicLive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-boxflow-hover/50 text-boxflow-muted cursor-default'
                  : isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : isSpeaking
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
              }`}
              title={
                isPushToTalk
                  ? t('voice.pttControlled', 'Controlled by Push to Talk')
                  : isMuted
                    ? t('voice.unmute')
                    : t('voice.mute')
              }
            >
              {isMuted && !isPushToTalk ? (
                <MicrophoneMutedIcon size="sm" />
              ) : (
                <MicrophoneIcon size="sm" />
              )}
            </button>
          </div>

          <button
            onClick={onToggleDeafen}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              isDeafened
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
            }`}
            title={isDeafened ? t('voice.undeafen') : t('voice.deafen')}
          >
            {isDeafened ? (
              <VolumeMutedIcon size="sm" />
            ) : (
              <VolumeIcon size="sm" />
            )}
          </button>
        </div>

        {/* Center: Video controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleVideo}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              isVideoEnabled
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-boxflow-hover/50 text-boxflow-light hover:bg-boxflow-hover'
            }`}
            title={
              isVideoEnabled ? t('voice.disableVideo') : t('voice.enableVideo')
            }
          >
            {isVideoEnabled ? (
              <VideoIcon size="sm" />
            ) : (
              <VideoOffIcon size="sm" />
            )}
          </button>

          <button
            onClick={onToggleScreenShare}
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
        </div>

        {/* Right: Settings & Leave */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              showSettings
                ? 'bg-boxflow-hover text-boxflow-light'
                : 'bg-boxflow-hover/50 text-boxflow-muted hover:text-boxflow-light hover:bg-boxflow-hover'
            }`}
            title={t('voice.settings')}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            onClick={onLeave}
            className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-150"
            title={t('voice.leave')}
          >
            <PhoneOffIcon size="sm" />
          </button>
        </div>
      </div>

      {/* Settings Panel (slide-down) */}
      {showSettings && (
        <div className="px-3 pb-3">
          <div className="p-3 bg-boxflow-darker rounded-lg border border-boxflow-border space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs ${
                    isPushToTalk
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-boxflow-hover text-boxflow-muted'
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-boxflow-light group-hover:text-white transition-colors">
                    {t('voice.pushToTalk')}
                  </div>
                  <div className="text-[11px] text-boxflow-subtle">
                    {t('voice.pushToTalkDescription')} —{' '}
                    <kbd className="px-1 py-0.5 bg-boxflow-hover rounded text-[10px] font-mono text-boxflow-muted">
                      V
                    </kbd>
                  </div>
                </div>
              </div>
              <div
                onClick={onTogglePTT}
                className={`w-9 h-5 rounded-full transition-colors duration-200 relative cursor-pointer ${
                  isPushToTalk ? 'bg-green-500' : 'bg-boxflow-hover'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    isPushToTalk ? 'translate-x-4' : ''
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
