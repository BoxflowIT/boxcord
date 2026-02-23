// Floating Video Window - Draggable and resizable video window
import { useEffect, useRef, useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { CloseIcon, MinimizeIcon, MaximizeIcon, PipIcon } from '../ui/Icons';
import { logger } from '../../utils/logger';

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export function FloatingVideoWindow() {
  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const {
    isVideoEnabled,
    isScreenSharing,
    videoWindow,
    setVideoWindowMode,
    setVideoWindowPosition,
    setVideoWindowSize
  } = useVoiceStore((s) => ({
    isVideoEnabled: s.isVideoEnabled,
    isScreenSharing: s.isScreenSharing,
    videoWindow: s.videoWindow,
    setVideoWindowMode: s.setVideoWindowMode,
    setVideoWindowPosition: s.setVideoWindowPosition,
    setVideoWindowSize: s.setVideoWindowSize
  }));

  const [size, setSize] = useState({
    width: videoWindow.size.width || DEFAULT_WIDTH,
    height: videoWindow.size.height || DEFAULT_HEIGHT
  });

  const [isResizing, setIsResizing] = useState(false);

  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
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
    if (cameraVideoRef.current && localStream && isVideoEnabled) {
      const videoTracks = localStream.getVideoTracks();
      const cameraTrack = videoTracks.find((track) => {
        const label = track.label.toLowerCase();
        const settings = track.getSettings();
        const isScreenTrack =
          settings.displaySurface ||
          label.includes('screen') ||
          label.includes('monitor') ||
          label.includes('display');
        return !isScreenTrack;
      });

      if (cameraTrack) {
        const stream = new MediaStream([cameraTrack]);
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current
          .play()
          .catch((e) => logger.error('Camera play error:', e));
      }
    }
  }, [localStream, isVideoEnabled]);

  // Setup screen share video
  useEffect(() => {
    if (screenVideoRef.current && localStream && isScreenSharing) {
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
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current
          .play()
          .catch((e) => logger.error('Screen play error:', e));
      }
    }
  }, [localStream, isScreenSharing]);

  // Custom resize implementation (must be before early returns)
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

  // Resize event listeners (must be before early returns)
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(window.innerWidth - 100, resizeStartRef.current.width + deltaX)
      );
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(
          window.innerHeight - 100,
          resizeStartRef.current.height + deltaY
        )
      );

      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      if (isResizing) {
        setIsResizing(false);
        setVideoWindowSize(size.width, size.height);
        resizeStartRef.current = null;
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, setVideoWindowSize, size]);

  // Don't show if not in floating mode
  if (videoWindow.mode !== 'floating') {
    return null;
  }

  // Only show if video or screen share is enabled
  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  const handleClose = () => {
    if (isVideoEnabled) {
      voiceService.disableVideo();
    }
    if (isScreenSharing) {
      voiceService.stopScreenShare();
    }
  };

  const handleMinimize = () => {
    setVideoWindowMode('minimized');
  };

  const handleMaximize = () => {
    setVideoWindowMode('fullscreen');
  };

  const handlePip = async () => {
    const videoElement = screenVideoRef.current || cameraVideoRef.current;
    if (!videoElement || !isPipSupported) return;

    try {
      if (isPipActive) {
        await document.exitPictureInPicture();
      } else {
        await videoElement.requestPictureInPicture();
      }
      setIsPipActive(!isPipActive);
    } catch (error) {
      logger.error('PiP error:', error);
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
        x: videoWindow.position.x || window.innerWidth / 2 - size.width / 2,
        y: videoWindow.position.y || window.innerHeight / 2 - size.height / 2
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
        {/* Header - Draggable */}
        <div className="drag-handle flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 cursor-move">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {isScreenSharing && isVideoEnabled
                ? 'Camera + Screen'
                : isScreenSharing
                  ? 'Screen Share'
                  : 'Video Call'}
            </h3>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1 ml-2">
            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
              title="Minimize"
            >
              <MinimizeIcon size="sm" />
            </button>

            {/* Maximize Button */}
            <button
              onClick={handleMaximize}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
              title="Maximize"
            >
              <MaximizeIcon size="sm" />
            </button>

            {/* PiP Button */}
            {isPipSupported && (
              <button
                onClick={handlePip}
                className={`p-1.5 hover:bg-gray-700 rounded transition-colors ${
                  isPipActive
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'text-gray-300 hover:text-white'
                }`}
                title="Picture-in-Picture"
              >
                <PipIcon size="sm" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-red-600 rounded transition-colors text-gray-300 hover:text-white"
              title="Close"
            >
              <CloseIcon size="sm" />
            </button>
          </div>
        </div>

        {/* Video Content */}
        <div className="flex-1 p-2 bg-gray-950 overflow-hidden">
          {isScreenSharing ? (
            <div className="flex flex-col gap-2 h-full">
              {/* Screen share */}
              <div className="flex-[7] min-h-0">
                <VideoContainer
                  videoRef={screenVideoRef}
                  label="Screen"
                  isScreenShare
                />
              </div>

              {/* Camera */}
              {isVideoEnabled && (
                <div className="flex-[3] min-h-0">
                  <VideoContainer
                    videoRef={cameraVideoRef}
                    label="You"
                    mirrored
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full">
              {isVideoEnabled && (
                <VideoContainer
                  videoRef={cameraVideoRef}
                  label="You"
                  mirrored
                />
              )}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-gray-700/50 transition-colors"
          onMouseDown={handleResizeStart}
          title="Resize window"
        >
          <svg
            className="w-full h-full text-gray-500 p-1"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M16 16L10 16L16 10Z" />
            <path d="M16 11L11 16L16 16Z" opacity="0.5" />
          </svg>
        </div>
      </div>
    </Draggable>
  );
}

// Reusable video container component
interface VideoContainerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  label: string;
  mirrored?: boolean;
  isScreenShare?: boolean;
}

function VideoContainer({
  videoRef,
  label,
  mirrored = false,
  isScreenShare = false
}: VideoContainerProps) {
  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: isScreenShare ? 'contain' : 'cover',
          ...(mirrored && { transform: 'scaleX(-1)' })
        }}
      />
      <div className="absolute bottom-1 left-1 bg-black/80 px-2 py-0.5 rounded text-xs font-medium text-white">
        {label}
      </div>
    </div>
  );
}
