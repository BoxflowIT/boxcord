// Minimized Video Indicator - Small floating window when video is minimized
import { useRef, useEffect } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { MaximizeIcon } from '../ui/Icons';
import { logger } from '../../utils/logger';

export function MinimizedVideoIndicator() {
  const { isVideoEnabled, isScreenSharing, videoWindow, setVideoWindowMode } =
    useVoiceStore((s) => ({
      isVideoEnabled: s.isVideoEnabled,
      isScreenSharing: s.isScreenSharing,
      videoWindow: s.videoWindow,
      setVideoWindowMode: s.setVideoWindowMode
    }));

  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-reset to fullscreen when video/screen is disabled
  useEffect(() => {
    if (
      videoWindow.mode === 'minimized' &&
      !isVideoEnabled &&
      !isScreenSharing &&
      voiceUsers.length === 0
    ) {
      setVideoWindowMode('fullscreen');
    }
  }, [
    isVideoEnabled,
    isScreenSharing,
    voiceUsers.length,
    videoWindow.mode,
    setVideoWindowMode
  ]);

  // Setup local video preview
  useEffect(() => {
    const vidRef = videoRef.current;
    if (vidRef && localStream && (isVideoEnabled || isScreenSharing)) {
      vidRef.srcObject = localStream;
      vidRef
        .play()
        .catch((e) => logger.error('Minimized video play error:', e));
    }

    // Cleanup when video is disabled
    return () => {
      if (vidRef) {
        vidRef.srcObject = null;
      }
    };
  }, [localStream, isVideoEnabled, isScreenSharing]);

  // Only show if minimized and video/screen is active
  if (videoWindow.mode !== 'minimized') {
    return null;
  }

  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  const handleRestore = () => {
    setVideoWindowMode('fullscreen');
  };

  const participantCount = voiceUsers.length + 1; // +1 for local user

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-64 bg-gray-900 rounded-lg shadow-2xl border-2 border-gray-700 overflow-hidden group hover:border-blue-500 transition-all cursor-pointer"
      onClick={handleRestore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleRestore();
        }
      }}
      aria-label="Click to restore video window"
    >
      {/* Video Preview */}
      <div className="relative aspect-video bg-gray-950">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform:
              isVideoEnabled && !isScreenSharing ? 'scaleX(-1)' : 'none'
          }}
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-gray-800/90 px-4 py-2 rounded-lg flex items-center gap-2">
            <MaximizeIcon size="sm" />
            <span className="text-sm font-medium text-white">
              Click to restore
            </span>
          </div>
        </div>

        {/* Participant Count Badge */}
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span>{participantCount}</span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Info Bar */}
      <div className="px-3 py-2 bg-gray-800 text-white">
        <p className="text-sm font-medium truncate">
          {isScreenSharing && isVideoEnabled
            ? 'Camera + Screen Share'
            : isScreenSharing
              ? 'Screen Share'
              : 'Video Call'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {participantCount}{' '}
          {participantCount === 1 ? 'participant' : 'participants'}
        </p>
      </div>
    </div>
  );
}
