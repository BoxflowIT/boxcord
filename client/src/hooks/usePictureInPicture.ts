// usePictureInPicture - Handle PiP mode for video elements
import { useEffect, useState, useCallback, RefObject } from 'react';
import { logger } from '../utils/logger';
import type { VideoWindowMode } from '../store/voiceStore';

interface UsePictureInPictureProps {
  cameraVideoRef: RefObject<HTMLVideoElement>;
  screenVideoRef: RefObject<HTMLVideoElement>;
  localStream: MediaStream | null;
  onModeChange: (mode: VideoWindowMode) => void;
  previousMode: VideoWindowMode | null;
}

export function usePictureInPicture({
  cameraVideoRef,
  screenVideoRef,
  localStream,
  onModeChange,
  previousMode
}: UsePictureInPictureProps) {
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Check PiP support
  useEffect(() => {
    setIsPipSupported(
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
    );

    // Exit any existing PiP session on mount
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }

    // Sync isPipActive with actual browser state
    setIsPipActive(document.pictureInPictureElement !== null);
  }, []);

  // Listen for when user closes PiP via browser UI
  useEffect(() => {
    const handleLeavePip = () => {
      setIsPipActive(false);
      onModeChange(previousMode || 'fullscreen');
    };

    document.addEventListener('leavepictureinpicture', handleLeavePip);
    return () =>
      document.removeEventListener('leavepictureinpicture', handleLeavePip);
  }, [previousMode, onModeChange]);

  const handlePip = useCallback(async () => {
    // First try the refs, then fall back to creating a temp element with localStream
    let videoElement = screenVideoRef.current || cameraVideoRef.current;

    // Check if video element has a valid stream
    const hasValidStream =
      videoElement &&
      videoElement.srcObject &&
      (videoElement.srcObject as MediaStream).getTracks().length > 0;

    if (!hasValidStream) {
      // Try to use localStream directly if refs don't have valid streams
      if (localStream && localStream.getVideoTracks().length > 0) {
        // Set localStream on the camera ref if available
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = localStream;
          await cameraVideoRef.current
            .play()
            .catch((e) => logger.error('Play error:', e));
          videoElement = cameraVideoRef.current;
        } else {
          logger.error('No video element available for PiP');
          return;
        }
      } else {
        logger.error('No video stream available for PiP');
        return;
      }
    }

    if (!videoElement || !isPipSupported) return;

    try {
      // Check actual PiP status from document, not state
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        // Manually set state after exiting PiP
        setIsPipActive(false);
        onModeChange(previousMode || 'fullscreen');
      } else {
        // Wait for video to have loaded enough data
        if (videoElement.readyState < 2) {
          // HAVE_CURRENT_DATA
          logger.warn('Video data not loaded yet, waiting...');
          await new Promise<void>((resolve) => {
            const handleCanPlay = () => {
              cleanup();
              resolve();
            };
            const cleanup = () => {
              videoElement!.removeEventListener('canplay', handleCanPlay);
            };

            videoElement!.addEventListener('canplay', handleCanPlay, {
              once: true
            });

            // Timeout after 3 seconds
            setTimeout(() => {
              cleanup();
              resolve();
            }, 3000);
          });
        }

        // Final check before requesting PiP
        if (videoElement.readyState >= 2) {
          await videoElement.requestPictureInPicture();
          setIsPipActive(true);
          onModeChange('pip');
        } else {
          logger.error('Video still not ready for PiP after waiting');
        }
      }
    } catch (error) {
      logger.error('PiP error:', error);
    }
  }, [
    screenVideoRef,
    cameraVideoRef,
    localStream,
    isPipSupported,
    previousMode,
    onModeChange
  ]);

  return {
    isPipSupported,
    isPipActive,
    isVideoReady,
    setIsVideoReady,
    handlePip
  };
}
