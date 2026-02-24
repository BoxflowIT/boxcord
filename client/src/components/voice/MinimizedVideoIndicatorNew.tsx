// Minimized Video Indicator - Small floating preview when minimized
import { useRef, useEffect, useState } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { MaximizeIcon } from '../ui/Icons';
import { logger } from '../../utils/logger';
import {
  setupVideoElement,
  clearVideoElement
} from '../../utils/videoStreamHelpers';
import { useShallow } from 'zustand/react/shallow';
import { useVideoWindowMode } from '../../hooks/useVideoWindowMode';

const CLICK_IGNORE_MS = 500; // Block clicks for 500ms after mount

export function MinimizedVideoIndicatorNew() {
  const { isMinimized, setVideoWindowMode, forceSetMode } =
    useVideoWindowMode();
  const blockClicksUntilRef = useRef<number>(0); // Timestamp when clicks should be allowed
  const wasMinimizedRef = useRef<boolean>(false);

  // Set block timestamp during render ONLY when transitioning to minimized
  if (isMinimized && !wasMinimizedRef.current) {
    blockClicksUntilRef.current = Date.now() + CLICK_IGNORE_MS;
    wasMinimizedRef.current = true;
  } else if (!isMinimized && wasMinimizedRef.current) {
    wasMinimizedRef.current = false;
  }

  const { isVideoEnabled, isScreenSharing } = useVoiceStore(
    useShallow((s) => ({
      isVideoEnabled: s.isVideoEnabled,
      isScreenSharing: s.isScreenSharing
    }))
  );

  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );

  // Auto-reset when no video
  useEffect(() => {
    if (
      isMinimized &&
      !isVideoEnabled &&
      !isScreenSharing &&
      voiceUsers.length === 0
    ) {
      const timer = setTimeout(() => forceSetMode('fullscreen'), 1000);
      return () => clearTimeout(timer);
    }
  }, [
    isMinimized,
    isVideoEnabled,
    isScreenSharing,
    voiceUsers.length,
    forceSetMode
  ]);

  // Setup video preview
  useEffect(() => {
    if (!videoElement || !localStream) {
      clearVideoElement(videoElement);
      return;
    }

    if (isVideoEnabled || isScreenSharing) {
      setupVideoElement(videoElement, localStream, isScreenSharing).catch(
        (error) =>
          logger.error('[MinimizedIndicator] Video setup error:', error)
      );
    } else {
      clearVideoElement(videoElement);
    }

    return () => clearVideoElement(videoElement);
  }, [videoElement, localStream, isVideoEnabled, isScreenSharing]);

  // Don't render if not minimized
  if (!isMinimized) return null;

  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  const handleRestore = (e: React.MouseEvent) => {
    const now = Date.now();
    const blockedUntil = blockClicksUntilRef.current;

    // Always stop propagation to prevent any bubbling
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    // Block clicks if not enough time has passed
    if (now < blockedUntil) return;

    setVideoWindowMode('fullscreen');
  };

  const participantCount = voiceUsers.length + 1;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-64 bg-gray-900 rounded-lg shadow-2xl border-2 border-gray-700 overflow-hidden hover:border-blue-500 transition-colors select-none"
      style={{ cursor: 'pointer', opacity: 1 }}
      onClickCapture={(e) => {
        if (Date.now() < blockClicksUntilRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClick={handleRestore}
      onMouseDown={(e) => {
        if (Date.now() < blockClicksUntilRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRestore(e as any);
        }
      }}
    >
      {/* Video Preview */}
      <div className="relative h-36 bg-gray-800">
        {(isVideoEnabled || isScreenSharing) && (
          <video
            ref={setVideoElement}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={
              !isScreenSharing && isVideoEnabled
                ? { transform: 'scaleX(-1)' }
                : undefined
            }
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Expand Button - shows on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-blue-500 rounded-full p-3 shadow-lg">
            <MaximizeIcon size="md" className="text-white" />
          </div>
        </div>

        {/* Participant Count */}
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs text-white font-medium">Live</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-800/50">
        <p className="text-xs text-gray-400 text-center">Click to expand</p>
      </div>
    </div>
  );
}
