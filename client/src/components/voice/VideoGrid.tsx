// Video Grid - Display video streams in voice call
import { useEffect, useRef, useState } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { CloseIcon, MinimizeIcon, PipIcon, FloatWindowIcon } from '../ui/Icons';
import { logger } from '../../utils/logger';

export function VideoGrid() {
  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const { isVideoEnabled, isScreenSharing, videoWindow, setVideoWindowMode } =
    useVoiceStore((s) => ({
      isVideoEnabled: s.isVideoEnabled,
      isScreenSharing: s.isScreenSharing,
      videoWindow: s.videoWindow,
      setVideoWindowMode: s.setVideoWindowMode
    }));

  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Check PiP support
  useEffect(() => {
    setIsPipSupported(
      'pictureInPictureEnabled' in document && document.pictureInPictureEnabled
    );
  }, []);

  // Handle PiP events
  useEffect(() => {
    const handleEnterPip = () => {
      setIsPipActive(true);
      setVideoWindowMode('pip');
    };

    const handleLeavePip = () => {
      setIsPipActive(false);
      if (videoWindow.mode === 'pip') {
        setVideoWindowMode('fullscreen');
      }
    };

    document.addEventListener('enterpictureinpicture', handleEnterPip);
    document.addEventListener('leavepictureinpicture', handleLeavePip);

    return () => {
      document.removeEventListener('enterpictureinpicture', handleEnterPip);
      document.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, [setVideoWindowMode, videoWindow.mode]);

  // Setup camera video
  useEffect(() => {
    const camRef = cameraVideoRef.current;
    if (!camRef || !localStream || !isVideoEnabled) {
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    logger.debug('Camera setup - video tracks:', videoTracks.length);

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

    if (cameraTrack) {
      const stream = new MediaStream([cameraTrack]);
      camRef.srcObject = stream;
      camRef.play().catch((e) => logger.error('Camera play error:', e));
      logger.debug('Camera track set:', cameraTrack.label);
    } else if (videoTracks.length > 0 && !isScreenSharing) {
      // Fallback: if no explicit camera track found and not screen sharing, use first track
      const stream = new MediaStream([videoTracks[0]]);
      camRef.srcObject = stream;
      camRef.play().catch((e) => logger.error('Camera play error:', e));
      logger.debug('Using fallback camera track:', videoTracks[0].label);
    }

    // Cleanup
    return () => {
      if (camRef) {
        camRef.srcObject = null;
      }
    };
  }, [localStream, isVideoEnabled, isScreenSharing]);

  // Setup screen share video
  useEffect(() => {
    const screenRef = screenVideoRef.current;
    if (!screenRef || !localStream || !isScreenSharing) {
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    logger.debug('Screen setup - video tracks:', videoTracks.length);

    // Find screen share track - check displaySurface first, then label keywords
    const screenTrack = videoTracks.find((track) => {
      const label = track.label.toLowerCase();
      const settings = track.getSettings();
      logger.debug('Track:', { label, settings });

      // Screen share tracks have displaySurface OR contain screen/monitor/display in label
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
      logger.debug('Screen track set:', screenTrack.label);
    } else if (videoTracks.length > 0) {
      // Fallback: if screen sharing is active but can't identify track, use last track
      const stream = new MediaStream([videoTracks[videoTracks.length - 1]]);
      screenRef.srcObject = stream;
      screenRef.play().catch((e) => logger.error('Screen play error:', e));
      logger.debug(
        'Using fallback screen track:',
        videoTracks[videoTracks.length - 1].label
      );
    }

    // Cleanup
    return () => {
      if (screenRef) {
        screenRef.srcObject = null;
      }
    };
  }, [localStream, isScreenSharing]);

  // Auto-reset to fullscreen when video/screen is disabled
  useEffect(() => {
    if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
      // Only reset if we're in a video mode (not already in fullscreen)
      if (videoWindow.mode !== 'fullscreen') {
        setVideoWindowMode('fullscreen');
      }
    }
  }, [
    isVideoEnabled,
    isScreenSharing,
    voiceUsers.length,
    videoWindow.mode,
    setVideoWindowMode
  ]);

  // Don't show fullscreen modal if minimized, floating, or in PiP
  if (
    videoWindow.mode === 'minimized' ||
    videoWindow.mode === 'pip' ||
    videoWindow.mode === 'floating'
  ) {
    return null;
  }

  // Only show video grid if video or screen share is enabled
  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  const handleClose = () => {
    // Exit PiP if active before closing
    if (isPipActive && document.pictureInPictureElement) {
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

  const handleMinimize = () => {
    setVideoWindowMode('minimized');
  };

  const handleFloat = () => {
    setVideoWindowMode('floating');
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
    } catch (error) {
      logger.error('PiP error:', error);
    }
  };

  return (
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
                className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
                  isPipActive
                    ? 'text-blue-400 bg-blue-500/20'
                    : 'text-gray-300 hover:text-white'
                }`}
                title={
                  isPipActive ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'
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
                  videoRef={screenVideoRef}
                  label="Your Screen"
                  isScreenShare
                />
              </div>

              {/* Camera and peers - 30% height */}
              {(isVideoEnabled || voiceUsers.length > 0) && (
                <div className="flex-[3] min-h-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-full">
                    {isVideoEnabled && (
                      <VideoContainer
                        videoRef={cameraVideoRef}
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gridAutoRows: 'minmax(200px, 1fr)'
                }}
              >
                {isVideoEnabled && (
                  <VideoContainer
                    videoRef={cameraVideoRef}
                    label="You"
                    mirrored
                  />
                )}
                {voiceUsers
                  .filter(
                    (user) =>
                      user.userId !== useVoiceStore.getState().currentSessionId
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
      <div
        className={`absolute ${isScreenShare ? 'top-3 left-3 bg-green-600' : 'bottom-2 left-2 bg-black/80'} px-2 py-1 rounded text-xs font-medium text-white z-10 ${isScreenShare ? 'flex items-center gap-2' : ''}`}
      >
        {isScreenShare && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        )}
        {label}
      </div>
    </div>
  );
}

interface PeerVideoProps {
  userId: string;
}

function PeerVideo({ userId }: PeerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peer = useVoiceStore((s) => s.peers.get(userId));

  useEffect(() => {
    if (videoRef.current && peer) {
      // @ts-expect-error - SimplePeer has _pc (RTCPeerConnection)
      const pc = peer._pc as RTCPeerConnection;
      if (pc) {
        const receivers = pc.getReceivers();
        const videoReceiver = receivers.find((r) => r.track.kind === 'video');

        if (videoReceiver) {
          const stream = new MediaStream([videoReceiver.track]);
          videoRef.current.srcObject = stream;
        }
      }
    }
  }, [peer, userId]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-xs font-medium text-white z-10">
        User {userId.slice(0, 8)}
      </div>
    </div>
  );
}
