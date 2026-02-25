// Floating Video Window - Draggable and resizable video window
import { useEffect, useRef, useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { logger } from '../../utils/logger';
import {
  setupVideoElement,
  clearVideoElement
} from '../../utils/videoStreamHelpers';
import { useShallow } from 'zustand/react/shallow';

import { useVideoWindowMode } from '../../hooks/useVideoWindowMode';
import { VideoWindowControls } from './VideoWindowControls';
import { VideoContainer } from './VideoContainer';

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const CLICK_IGNORE_MS = 500; // Block clicks for 500ms after mount

export function FloatingVideoWindowNew() {
  const { previousMode, setVideoWindowMode, forceSetMode, isFloating } =
    useVideoWindowMode();
  const blockButtonsUntilRef = useRef<number>(0); // Timestamp when button clicks should be allowed
  const wasFloatingRef = useRef<boolean>(false); // Track if we were floating before

  // Set block timestamp during render ONLY when transitioning to floating
  if (isFloating && !wasFloatingRef.current) {
    blockButtonsUntilRef.current = Date.now() + CLICK_IGNORE_MS;
    wasFloatingRef.current = true;
  } else if (!isFloating && wasFloatingRef.current) {
    wasFloatingRef.current = false;
  }

  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();

  const {
    isVideoEnabled,
    isScreenSharing,
    setVideoWindowPosition,
    setVideoWindowSize
  } = useVoiceStore(
    useShallow((s) => ({
      isVideoEnabled: s.isVideoEnabled,
      isScreenSharing: s.isScreenSharing,
      setVideoWindowPosition: s.setVideoWindowPosition,
      setVideoWindowSize: s.setVideoWindowSize
    }))
  );

  const videoWindowSize = useVoiceStore(useShallow((s) => s.videoWindow.size));
  const videoWindowPosition = useVoiceStore(
    useShallow((s) => s.videoWindow.position)
  );

  // Local state
  const [size, setSize] = useState({
    width: videoWindowSize.width || DEFAULT_WIDTH,
    height: videoWindowSize.height || DEFAULT_HEIGHT
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Use state for video elements so useEffect runs when they mount
  const [cameraVideoElement, setCameraVideoElement] =
    useState<HTMLVideoElement | null>(null);
  const [screenVideoElement, setScreenVideoElement] =
    useState<HTMLVideoElement | null>(null);

  // Callback refs that update state - memoized to prevent infinite loops
  const cameraRefCallback = useCallback((element: HTMLVideoElement | null) => {
    setCameraVideoElement(element);
  }, []);

  const screenRefCallback = useCallback((element: HTMLVideoElement | null) => {
    setScreenVideoElement(element);
  }, []);

  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // Check PiP support
  useEffect(() => {
    setIsPipSupported(
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
    );
  }, []);

  // Setup camera video
  useEffect(() => {
    if (!cameraVideoElement || !localStream || !isVideoEnabled) {
      clearVideoElement(cameraVideoElement);
      return;
    }

    setupVideoElement(cameraVideoElement, localStream, false)
      .then(() => {
        cameraVideoElement.addEventListener(
          'canplay',
          () => setIsVideoReady(true),
          { once: true }
        );
      })
      .catch((error) =>
        logger.error('[FloatingWindow] Camera setup error:', error)
      );

    return () => clearVideoElement(cameraVideoElement);
  }, [cameraVideoElement, localStream, isVideoEnabled]);

  // Setup screen video
  useEffect(() => {
    if (!screenVideoElement || !localStream || !isScreenSharing) {
      clearVideoElement(screenVideoElement);
      return;
    }

    setupVideoElement(screenVideoElement, localStream, true).catch((error) =>
      logger.error('[FloatingWindow] Screen setup error:', error)
    );

    return () => clearVideoElement(screenVideoElement);
  }, [screenVideoElement, localStream, isScreenSharing]);

  // Listen for when user closes PiP via browser UI
  useEffect(() => {
    const videoElement = screenVideoElement || cameraVideoElement;
    if (!videoElement) return;

    const handleLeavePip = () => {
      setIsPipActive(false);
      forceSetMode(previousMode || 'floating');
    };

    document.addEventListener('leavepictureinpicture', handleLeavePip);
    return () =>
      document.removeEventListener('leavepictureinpicture', handleLeavePip);
  }, [screenVideoElement, cameraVideoElement, previousMode, forceSetMode]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeStartRef.current = {
        width: size.width,
        height: size.height,
        x: e.clientX,
        y: e.clientY
      };
    },
    [size]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;
      setSize({
        width: Math.max(
          MIN_WIDTH,
          Math.min(window.innerWidth - 100, resizeStartRef.current.width + dx)
        ),
        height: Math.max(
          MIN_HEIGHT,
          Math.min(window.innerHeight - 100, resizeStartRef.current.height + dy)
        )
      });
    };

    const handleEnd = () => {
      setIsResizing(false);
      setVideoWindowSize(size.width, size.height);
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isResizing, setVideoWindowSize, size]);

  // Auto-reset when no video (with delay to avoid interfering with click blocking)
  useEffect(() => {
    if (
      isFloating &&
      !isVideoEnabled &&
      !isScreenSharing &&
      voiceUsers.length === 0
    ) {
      const timer = setTimeout(() => forceSetMode('fullscreen'), 1000);
      return () => clearTimeout(timer);
    }
  }, [
    isFloating,
    isVideoEnabled,
    isScreenSharing,
    voiceUsers.length,
    forceSetMode
  ]);

  // Don't render if not floating
  if (!isFloating) return null;

  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  // Handlers
  const handleClose = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(logger.error);
    }
    if (isVideoEnabled) voiceService.disableVideo();
    if (isScreenSharing) voiceService.stopScreenShare();
    forceSetMode('fullscreen');
  };

  const handleMinimize = () => {
    if (Date.now() < blockButtonsUntilRef.current) return;
    setVideoWindowMode('minimized');
  };

  const handleMaximize = () => {
    if (Date.now() < blockButtonsUntilRef.current) return;
    setVideoWindowMode('fullscreen');
  };

  const handlePip = async () => {
    const videoElement = screenVideoElement || cameraVideoElement;
    if (!videoElement || !isPipSupported) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
        forceSetMode(previousMode || 'floating');
      } else if (videoElement.readyState >= 2) {
        await videoElement.requestPictureInPicture();
        setIsPipActive(true);
        forceSetMode('pip');
      }
    } catch (error) {
      logger.error('PiP error:', error);
    }
  };

  const handleQualityChange = async () => {
    try {
      logger.info('[FloatingVideoWindow] Changing video quality');
      await voiceService.changeVideoQuality();
    } catch (error) {
      logger.error('[FloatingVideoWindow] Failed to change quality:', error);
    }
  };

  const handleDragStop = (_e: unknown, data: { x: number; y: number }) => {
    setVideoWindowPosition(data.x, data.y);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      defaultPosition={{
        x: videoWindowPosition.x || window.innerWidth / 2 - size.width / 2,
        y: videoWindowPosition.y || window.innerHeight / 2 - size.height / 2
      }}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isResizing}
    >
      <div
        ref={nodeRef}
        className="fixed z-[60] bg-gray-900 rounded-xl shadow-2xl border-2 border-gray-700 overflow-hidden flex flex-col"
        style={{ width: size.width, height: size.height }}
      >
        {/* Header */}
        <div className="drag-handle flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 cursor-move">
          <h3 className="text-sm font-semibold text-white truncate">
            {isScreenSharing && isVideoEnabled
              ? 'Camera + Screen'
              : isScreenSharing
                ? 'Screen Share'
                : 'Video Call'}
          </h3>
          <VideoWindowControls
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onPip={handlePip}
            onClose={handleClose}
            isPipSupported={isPipSupported}
            isPipActive={isPipActive}
            isVideoReady={isVideoReady}
            isVideoEnabled={isVideoEnabled}
            onQualityChange={handleQualityChange}
          />
        </div>

        {/* Video Content */}
        <div className="flex-1 p-2 bg-gray-950 overflow-hidden">
          {isScreenSharing ? (
            <div className="flex flex-col gap-2 h-full">
              <div className="flex-[7] min-h-0">
                <VideoContainer
                  videoRef={screenRefCallback}
                  label="Screen"
                  isScreenShare
                />
              </div>
              {isVideoEnabled && (
                <div className="flex-[3] min-h-0">
                  <VideoContainer
                    videoRef={cameraRefCallback}
                    label="You"
                    mirrored
                  />
                </div>
              )}
            </div>
          ) : (
            isVideoEnabled && (
              <div className="h-full">
                <VideoContainer
                  videoRef={cameraRefCallback}
                  label="You"
                  mirrored
                />
              </div>
            )
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-gray-700/50"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="w-full h-full text-gray-500 p-1"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M16 16L10 16L16 10Z" />
          </svg>
        </div>
      </div>
    </Draggable>
  );
}
