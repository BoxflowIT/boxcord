// Hook for setting up video streams on video elements
// Handles camera and screen share track extraction

import { useEffect, useRef, useState, RefObject } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { logger } from '../utils/logger';

interface UseLocalVideoStreamOptions {
  videoRef: RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  type: 'camera' | 'screen';
}

export function useLocalVideoStream({
  videoRef,
  isVideoEnabled,
  isScreenSharing,
  type
}: UseLocalVideoStreamOptions) {
  const localStream = useVoiceStore((s) => s.localStream);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const vidRef = videoRef.current;
    if (!vidRef || !localStream) {
      if (vidRef) {
        vidRef.srcObject = null;
      }
      setIsReady(false);
      return;
    }

    // For camera type, check if video is enabled
    if (type === 'camera' && !isVideoEnabled) {
      vidRef.srcObject = null;
      setIsReady(false);
      return;
    }

    // For screen type, check if screen sharing
    if (type === 'screen' && !isScreenSharing) {
      vidRef.srcObject = null;
      setIsReady(false);
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      logger.warn(`No video tracks available for ${type}`);
      setIsReady(false);
      return;
    }

    let trackToUse: MediaStreamTrack | null = null;

    if (type === 'camera') {
      // Find camera track (not screen)
      trackToUse =
        videoTracks.find((track) => {
          const label = track.label.toLowerCase();
          const settings = track.getSettings();
          const isScreenTrack =
            settings.displaySurface ||
            label.includes('screen') ||
            label.includes('monitor') ||
            label.includes('display');
          return !isScreenTrack;
        }) || (!isScreenSharing ? videoTracks[0] : null);
    } else {
      // Find screen track
      trackToUse =
        videoTracks.find((track) => {
          const label = track.label.toLowerCase();
          const settings = track.getSettings();
          return (
            settings.displaySurface ||
            label.includes('screen') ||
            label.includes('monitor') ||
            label.includes('display')
          );
        }) ||
        (videoTracks.length > 0 ? videoTracks[videoTracks.length - 1] : null);
    }

    if (trackToUse) {
      const stream = new MediaStream([trackToUse]);
      vidRef.srcObject = stream;
      vidRef.play().catch((e) => logger.error(`${type} play error:`, e));

      vidRef.addEventListener('canplay', () => setIsReady(true), {
        once: true
      });
      if (vidRef.readyState >= 2) {
        setIsReady(true);
      }

      logger.debug(`${type} track set:`, trackToUse.label);
    } else {
      // Fallback: use full stream
      vidRef.srcObject = localStream;
      vidRef.play().catch((e) => logger.error(`${type} play error:`, e));
      vidRef.addEventListener('canplay', () => setIsReady(true), {
        once: true
      });
      if (vidRef.readyState >= 2) {
        setIsReady(true);
      }
      logger.debug(`Using full localStream for ${type}`);
    }

    return () => {
      if (vidRef) {
        vidRef.srcObject = null;
      }
      setIsReady(false);
    };
  }, [localStream, isVideoEnabled, isScreenSharing, type, videoRef]);

  return { isReady, localStream };
}

// Simpler hook that just returns the video ref and ready state
export function useVideoRefs() {
  const cameraRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  return { cameraRef, screenRef };
}
