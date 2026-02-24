// Video Grid - Display video streams in voice call
import { useRef, useState, useEffect, useCallback } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { CloseIcon, MinimizeIcon, PipIcon, FloatWindowIcon } from '../ui/Icons';
import { logger } from '../../utils/logger';
import {
  setupVideoElement,
  clearVideoElement
} from '../../utils/videoStreamHelpers';
import { useShallow } from 'zustand/react/shallow';
import { VideoContainer } from './VideoContainer';
import { PeerVideo } from './PeerVideo';
import { usePictureInPicture } from '../../hooks/usePictureInPicture';

export function VideoGrid() {
  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();

  // Use useShallow to properly handle object selectors
  const { isVideoEnabled, isScreenSharing, setVideoWindowMode } = useVoiceStore(
    useShallow((s) => ({
      isVideoEnabled: s.isVideoEnabled,
      isScreenSharing: s.isScreenSharing,
      setVideoWindowMode: s.setVideoWindowMode
    }))
  );

  // Select videoWindow state separately for proper updates
  const videoWindowMode = useVoiceStore((s) => s.videoWindow.mode);
  const videoWindowPreviousMode = useVoiceStore(
    (s) => s.videoWindow.previousMode
  );

  // Use state for video elements so useEffect runs when they mount
  const [cameraVideoElement, setCameraVideoElement] =
    useState<HTMLVideoElement | null>(null);
  const [screenVideoElement, setScreenVideoElement] =
    useState<HTMLVideoElement | null>(null);

  // Separate elements for PiP (always mounted off-screen)
  const [pipCameraElement, setPipCameraElement] =
    useState<HTMLVideoElement | null>(null);
  const [pipScreenElement, setPipScreenElement] =
    useState<HTMLVideoElement | null>(null);

  // Create refs for compatibility with hooks
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Callback refs for UI VideoContainers - only update their own state
  const cameraRefCallback = useCallback((element: HTMLVideoElement | null) => {
    setCameraVideoElement(element);
  }, []);

  const screenRefCallback = useCallback((element: HTMLVideoElement | null) => {
    setScreenVideoElement(element);
  }, []);

  // PiP callback refs - always mounted for PiP (no dependencies to avoid re-mounting)
  const pipCameraRefCallback = useCallback(
    (element: HTMLVideoElement | null) => {
      setPipCameraElement(element);
      // Update main ref for PiP hook to use
      if (element) {
        (cameraVideoRef as any).current = element;
      }
    },
    []
  );

  const pipScreenRefCallback = useCallback(
    (element: HTMLVideoElement | null) => {
      setPipScreenElement(element);
      // Update main ref for PiP hook to use
      if (element) {
        (screenVideoRef as any).current = element;
      }
    },
    []
  );

  // Custom hooks for video stream setup and PiP handling
  const {
    isPipSupported,
    isPipActive,
    isVideoReady,
    setIsVideoReady,
    handlePip
  } = usePictureInPicture({
    cameraVideoRef,
    screenVideoRef,
    localStream,
    onModeChange: setVideoWindowMode,
    previousMode: videoWindowPreviousMode
  });

  // Setup camera video - runs when cameraVideoElement mounts
  useEffect(() => {
    if (!cameraVideoElement || !localStream || !isVideoEnabled) {
      clearVideoElement(cameraVideoElement);
      setIsVideoReady(false);
      return;
    }

    setupVideoElement(cameraVideoElement, localStream, false)
      .then(() => {
        cameraVideoElement.addEventListener(
          'canplay',
          () => setIsVideoReady(true),
          { once: true }
        );
        if (cameraVideoElement.readyState >= 2) {
          setIsVideoReady(true);
        }
      })
      .catch((error) => logger.error('[VideoGrid] Camera setup error:', error));

    return () => {
      clearVideoElement(cameraVideoElement);
      setIsVideoReady(false);
    };
  }, [cameraVideoElement, localStream, isVideoEnabled, setIsVideoReady]);

  // Setup screen share video - runs when screenVideoElement mounts
  useEffect(() => {
    if (!screenVideoElement || !localStream || !isScreenSharing) {
      clearVideoElement(screenVideoElement);
      return;
    }

    setupVideoElement(screenVideoElement, localStream, true)
      .then(() => {
        screenVideoElement.addEventListener(
          'canplay',
          () => setIsVideoReady(true),
          { once: true }
        );
        if (screenVideoElement.readyState >= 2) {
          setIsVideoReady(true);
        }
      })
      .catch((error) => logger.error('[VideoGrid] Screen setup error:', error));

    return () => clearVideoElement(screenVideoElement);
  }, [screenVideoElement, localStream, isScreenSharing, setIsVideoReady]);

  // Setup PiP camera video (always mounted off-screen)
  useEffect(() => {
    if (!pipCameraElement || !localStream || !isVideoEnabled) {
      clearVideoElement(pipCameraElement);
      return;
    }

    setupVideoElement(pipCameraElement, localStream, false).catch((error) =>
      logger.error('[VideoGrid] PiP camera setup error:', error)
    );

    return () => clearVideoElement(pipCameraElement);
  }, [pipCameraElement, localStream, isVideoEnabled]);

  // Setup PiP screen video (always mounted off-screen)
  useEffect(() => {
    if (!pipScreenElement || !localStream || !isScreenSharing) {
      clearVideoElement(pipScreenElement);
      return;
    }

    setupVideoElement(pipScreenElement, localStream, true).catch((error) =>
      logger.error('[VideoGrid] PiP screen setup error:', error)
    );

    return () => clearVideoElement(pipScreenElement);
  }, [pipScreenElement, localStream, isScreenSharing]);

  // Note: No auto-reset logic - each mode component (FloatingVideoWindowNew, MinimizedVideoIndicatorNew)
  // handles its own cleanup when no video is active. VideoGrid only renders in fullscreen mode.

  // Exit PiP when switching to another mode (minimize, float, etc)
  useEffect(() => {
    if (videoWindowMode !== 'pip' && document.pictureInPictureElement) {
      document
        .exitPictureInPicture()
        .catch((e) => logger.error('PiP exit error:', e));
    }
  }, [videoWindowMode]);

  // IMPORTANT: Keep video elements mounted even in PiP mode so PiP can continue using them!
  // Only hide the UI when not in fullscreen
  const shouldShowUI =
    videoWindowMode === 'fullscreen' &&
    (isVideoEnabled || isScreenSharing || voiceUsers.length > 0);

  logger.debug('[VideoGrid] Render decision:', {
    videoWindowMode,
    shouldShowUI,
    isVideoEnabled,
    isScreenSharing,
    voiceUsersCount: voiceUsers.length
  });

  const handleClose = () => {
    // Exit PiP if active before closing
    if (document.pictureInPictureElement) {
      document
        .exitPictureInPicture()
        .catch((e) => logger.error('PiP exit error:', e));
    }

    // Disable video and screen share
    if (isVideoEnabled) {
      voiceService.disableVideo();
    }
    if (isScreenSharing) {
      voiceService.stopScreenShare();
    }

    // Reset window mode to fullscreen for next time
    setVideoWindowMode('fullscreen');
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    logger.info('[VideoGrid] Minimize clicked, switching to minimized');
    setVideoWindowMode('minimized');
  };

  const handleFloat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    logger.info('[VideoGrid] Float clicked, switching to floating');
    setVideoWindowMode('floating');
  };

  return (
    <>
      {/* Hidden video elements - kept mounted for PiP even when UI is hidden */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          pointerEvents: 'none'
        }}
      >
        <video
          ref={pipCameraRefCallback}
          autoPlay
          muted
          playsInline
          style={{ width: '1px', height: '1px' }}
        />
        <video
          ref={pipScreenRefCallback}
          autoPlay
          muted
          playsInline
          style={{ width: '1px', height: '1px' }}
        />
      </div>

      {/* Only show fullscreen modal UI when in fullscreen mode */}
      {shouldShowUI && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {isScreenSharing && isVideoEnabled
                    ? 'Camera + Screen Share'
                    : isScreenSharing
                      ? 'Screen Share'
                      : 'Video Call'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {isScreenSharing && isVideoEnabled
                    ? 'Sharing camera and screen'
                    : isScreenSharing
                      ? 'Sharing your screen'
                      : 'Video call active'}
                </p>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-2">
                {/* Minimize Button */}
                <button
                  onClick={handleMinimize}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                  title="Minimize video"
                >
                  <MinimizeIcon size="md" />
                </button>

                {/* Float Window Button */}
                <button
                  onClick={handleFloat}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                  title="Float window"
                >
                  <FloatWindowIcon size="md" />
                </button>

                {/* Picture-in-Picture Button */}
                {isPipSupported && (
                  <button
                    onClick={handlePip}
                    disabled={!isVideoReady}
                    className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
                      isPipActive
                        ? 'text-blue-400 bg-blue-500/20'
                        : 'text-gray-300 hover:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      !isVideoReady
                        ? 'Video is loading...'
                        : isPipActive
                          ? 'Exit Picture-in-Picture'
                          : 'Picture-in-Picture'
                    }
                  >
                    <PipIcon size="md" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                  title="Close video"
                >
                  <CloseIcon size="md" />
                </button>
              </div>
            </div>

            {/* Video Content */}
            <div className="flex-1 p-6 bg-gray-950 overflow-hidden">
              {isScreenSharing ? (
                // Layout when screen sharing: Screen on top, camera/peers below
                <div className="flex flex-col gap-4 h-full">
                  {/* Screen share - 70% height */}
                  <div className="flex-[7] min-h-0">
                    <VideoContainer
                      videoRef={screenRefCallback}
                      label="Your Screen"
                      isScreenShare
                      showLiveIndicator
                    />
                  </div>

                  {/* Camera and peers - 30% height */}
                  {(isVideoEnabled || voiceUsers.length > 0) && (
                    <div className="flex-[3] min-h-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-full">
                        {isVideoEnabled && (
                          <VideoContainer
                            videoRef={cameraRefCallback}
                            label="You"
                            mirrored
                          />
                        )}
                        {voiceUsers
                          .filter(
                            (user) =>
                              user.userId !==
                              useVoiceStore.getState().currentSessionId
                          )
                          .map((user) => (
                            <PeerVideo key={user.userId} userId={user.userId} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Layout without screen share: Just camera and peers in grid
                <div className="h-full">
                  <div
                    className="grid gap-4 h-full"
                    style={{
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(300px, 1fr))',
                      gridAutoRows: 'minmax(200px, 1fr)'
                    }}
                  >
                    {isVideoEnabled && (
                      <VideoContainer
                        videoRef={cameraRefCallback}
                        label="You"
                        mirrored
                      />
                    )}
                    {voiceUsers
                      .filter(
                        (user) =>
                          user.userId !==
                          useVoiceStore.getState().currentSessionId
                      )
                      .map((user) => (
                        <PeerVideo key={user.userId} userId={user.userId} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Reusable video container component
