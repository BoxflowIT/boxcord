// Custom hook for video stream handling
import { useRef, useEffect, useState, useCallback } from 'react';
import { logger } from '../utils/logger';

interface UseVideoStreamOptions {
  localStream: MediaStream | null;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  type: 'camera' | 'screen';
}

interface UseVideoStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
  requestPiP: () => Promise<void>;
}

export function useVideoStream({
  localStream,
  isVideoEnabled,
  isScreenSharing,
  type
}: UseVideoStreamOptions): UseVideoStreamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Setup video stream on element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if this type should be active
    const shouldBeActive = type === 'camera' ? isVideoEnabled : isScreenSharing;

    if (!localStream || !shouldBeActive) {
      video.srcObject = null;
      setIsReady(false);
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    logger.debug(
      `[useVideoStream] ${type} setup - tracks:`,
      videoTracks.length
    );

    if (videoTracks.length === 0) {
      logger.warn(`[useVideoStream] No video tracks available`);
      setIsReady(false);
      return;
    }

    // Find the appropriate track
    let trackToUse: MediaStreamTrack | null = null;

    if (type === 'screen') {
      // Screen share track: has displaySurface or screen/monitor/display in label
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
        }) || null;
    } else {
      // Camera track: anything that's NOT a screen share
      trackToUse =
        videoTracks.find((track) => {
          const label = track.label.toLowerCase();
          const settings = track.getSettings();
          const isScreen =
            settings.displaySurface ||
            label.includes('screen') ||
            label.includes('monitor') ||
            label.includes('display');
          return !isScreen;
        }) || null;

      // Fallback: use first track if not screen sharing
      if (!trackToUse && !isScreenSharing) {
        trackToUse = videoTracks[0];
      }
    }

    // Set the stream
    if (trackToUse) {
      const stream = new MediaStream([trackToUse]);
      video.srcObject = stream;
      logger.debug(`[useVideoStream] ${type} track set:`, trackToUse.label);
    } else {
      // Last resort: use full stream
      video.srcObject = localStream;
      logger.debug(`[useVideoStream] Using full localStream for ${type}`);
    }

    // Play video
    video.play().catch((e) => {
      if (e.name === 'NotAllowedError') {
        logger.warn(
          '[useVideoStream] Autoplay blocked, needs user interaction'
        );
      } else {
        logger.error('[useVideoStream] Play error:', e);
      }
    });

    // Mark ready when video can play
    const handleCanPlay = () => {
      setIsReady(true);
      logger.debug(`[useVideoStream] ${type} video ready`);
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });

    // Also check if already ready
    if (video.readyState >= 2) {
      setIsReady(true);
    }

    // Cleanup
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      if (video) {
        video.srcObject = null;
      }
      setIsReady(false);
    };
  }, [localStream, isVideoEnabled, isScreenSharing, type]);

  // Request Picture-in-Picture
  const requestPiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      throw new Error('No video element');
    }

    // Check PiP support
    if (
      !('pictureInPictureEnabled' in document) ||
      !document.pictureInPictureEnabled
    ) {
      throw new Error('PiP not supported');
    }

    // Check for valid stream
    const stream = video.srcObject as MediaStream | null;
    if (!stream) {
      // Try to set localStream directly
      if (localStream && localStream.getVideoTracks().length > 0) {
        video.srcObject = localStream;
        await video.play().catch(() => {});
      } else {
        throw new Error('No video stream available');
      }
    }

    // Check for active tracks
    const updatedStream = video.srcObject as MediaStream;
    const hasActiveTracks = updatedStream
      ?.getVideoTracks()
      .some((t) => t.enabled && t.readyState === 'live');

    if (!hasActiveTracks) {
      throw new Error('No active video tracks');
    }

    // Wait for video data if needed
    if (video.readyState < 2) {
      logger.debug('[useVideoStream] Waiting for video data...');
      await new Promise<void>((resolve) => {
        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          resolve();
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
        setTimeout(resolve, 3000); // Timeout fallback
      });
    }

    // Exit existing PiP if any
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }

    // Request PiP
    if (video.readyState >= 2) {
      await video.requestPictureInPicture();
    } else {
      throw new Error('Video not ready after waiting');
    }
  }, [localStream]);

  return { videoRef, isReady, requestPiP };
}

// Hook for PiP state management
export function usePiPState() {
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  useEffect(() => {
    // Check support
    setIsPipSupported(
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
    );

    // Sync with actual PiP state
    const checkPipState = () => {
      setIsPipActive(document.pictureInPictureElement !== null);
    };

    // Listen for PiP events
    const handleEnter = () => setIsPipActive(true);
    const handleLeave = () => setIsPipActive(false);

    document.addEventListener('enterpictureinpicture', handleEnter);
    document.addEventListener('leavepictureinpicture', handleLeave);

    // Initial check
    checkPipState();

    return () => {
      document.removeEventListener('enterpictureinpicture', handleEnter);
      document.removeEventListener('leavepictureinpicture', handleLeave);
    };
  }, []);

  const exitPiP = useCallback(async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  }, []);

  return { isPipSupported, isPipActive, exitPiP };
}
