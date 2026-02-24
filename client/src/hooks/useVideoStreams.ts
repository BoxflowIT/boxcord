// useVideoStreams - Manage video stream setup for camera and screen share
import { useEffect, RefObject } from 'react';
import { logger } from '../utils/logger';

interface UseVideoStreamsProps {
  localStream: MediaStream | null;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  cameraVideoRef: RefObject<HTMLVideoElement>;
  screenVideoRef: RefObject<HTMLVideoElement>;
  onVideoReady?: (isReady: boolean) => void;
}

export function useVideoStreams({
  localStream,
  isVideoEnabled,
  isScreenSharing,
  cameraVideoRef,
  screenVideoRef,
  onVideoReady
}: UseVideoStreamsProps) {
  // Setup camera video
  useEffect(() => {
    const camRef = cameraVideoRef.current;
    if (!camRef || !localStream || !isVideoEnabled) {
      // Clear srcObject if video disabled
      if (camRef && !isVideoEnabled) {
        camRef.srcObject = null;
      }
      onVideoReady?.(false);
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    logger.debug('Camera setup - video tracks:', videoTracks.length);

    // If no video tracks, nothing to do
    if (videoTracks.length === 0) {
      logger.warn('No video tracks available in localStream');
      onVideoReady?.(false);
      return;
    }

    // Find camera track - must NOT be a screen/monitor/display
    const cameraTrack = videoTracks.find((track) => {
      const label = track.label.toLowerCase();
      const settings = track.getSettings();
      logger.debug('Track:', { label, settings });

      // Screen share tracks have displaySurface set OR contain screen/monitor/display in label
      const isScreenTrack =
        settings.displaySurface ||
        label.includes('screen') ||
        label.includes('monitor') ||
        label.includes('display');
      return !isScreenTrack; // Camera is anything that's NOT a screen share
    });

    // Use found track, or first track as fallback when not screen sharing
    const trackToUse =
      cameraTrack || (!isScreenSharing ? videoTracks[0] : null);

    if (trackToUse) {
      const stream = new MediaStream([trackToUse]);
      camRef.srcObject = stream;
      camRef.play().catch((e) => logger.error('Camera play error:', e));
      camRef.addEventListener('canplay', () => onVideoReady?.(true), {
        once: true
      });
      if (camRef.readyState >= 2) {
        onVideoReady?.(true);
      }
      logger.debug('Camera track set:', trackToUse.label);
    } else {
      // Last resort: use the full localStream directly
      camRef.srcObject = localStream;
      camRef.play().catch((e) => logger.error('Camera play error:', e));
      camRef.addEventListener('canplay', () => onVideoReady?.(true), {
        once: true
      });
      if (camRef.readyState >= 2) {
        onVideoReady?.(true);
      }
      logger.debug('Using full localStream for camera');
    }

    return () => {
      if (camRef) {
        camRef.srcObject = null;
      }
      onVideoReady?.(false);
    };
  }, [
    localStream,
    isVideoEnabled,
    isScreenSharing,
    cameraVideoRef,
    onVideoReady
  ]);

  // Setup screen share video
  useEffect(() => {
    const screenRef = screenVideoRef.current;
    if (!screenRef || !localStream || !isScreenSharing) {
      if (screenRef && !isScreenSharing) {
        screenRef.srcObject = null;
      }
      onVideoReady?.(false);
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    const screenTrack = videoTracks.find((track) => {
      const label = track.label.toLowerCase();
      const settings = track.getSettings();
      return (
        settings.displaySurface ||
        label.includes('screen') ||
        label.includes('monitor') ||
        label.includes('display')
      );
    });

    if (screenTrack) {
      const stream = new MediaStream([screenTrack]);
      screenRef.srcObject = stream;
      screenRef.play().catch((e) => logger.error('Screen play error:', e));
      screenRef.addEventListener('canplay', () => onVideoReady?.(true), {
        once: true
      });
    } else if (videoTracks.length > 0) {
      // Fallback: use last track if screen share not explicitly found
      const stream = new MediaStream([videoTracks[videoTracks.length - 1]]);
      screenRef.srcObject = stream;
      screenRef.play().catch((e) => logger.error('Screen play error:', e));
      screenRef.addEventListener('canplay', () => onVideoReady?.(true), {
        once: true
      });
    }

    return () => {
      if (screenRef) {
        screenRef.srcObject = null;
      }
      onVideoReady?.(false);
    };
  }, [localStream, isScreenSharing, screenVideoRef, onVideoReady]);
}
