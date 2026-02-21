// Video Grid - Display video streams in voice call
import { useEffect, useRef } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { CloseIcon } from '../ui/Icons';

export function VideoGrid() {
  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const { isVideoEnabled, isScreenSharing } = useVoiceStore((s) => ({
    isVideoEnabled: s.isVideoEnabled,
    isScreenSharing: s.isScreenSharing
  }));

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Setup camera video
  useEffect(() => {
    if (cameraVideoRef.current && localStream && isVideoEnabled) {
      const videoTracks = localStream.getVideoTracks();
      console.log(
        '📹 Camera: Available video tracks:',
        videoTracks.map((t) => ({
          label: t.label,
          kind: t.kind,
          displaySurface: t.getSettings().displaySurface
        }))
      );

      // Find camera track - must NOT be a screen/monitor/display
      const cameraTrack = videoTracks.find((track) => {
        const label = track.label.toLowerCase();
        const settings = track.getSettings();
        // Screen share tracks have displaySurface set OR contain screen/monitor/display in label
        const isScreenTrack =
          settings.displaySurface ||
          label.includes('screen') ||
          label.includes('monitor') ||
          label.includes('display');
        return !isScreenTrack; // Camera is anything that's NOT a screen share
      });

      if (cameraTrack) {
        console.log('✅ Camera track found:', cameraTrack.label);
        const stream = new MediaStream([cameraTrack]);
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current
          .play()
          .catch((e) => console.error('Camera play error:', e));
      } else {
        console.warn('⚠️ No camera track found');
      }
    }
  }, [localStream, isVideoEnabled]);

  // Setup screen share video
  useEffect(() => {
    if (screenVideoRef.current && localStream && isScreenSharing) {
      const videoTracks = localStream.getVideoTracks();
      console.log(
        '🖥️ Screen: Available video tracks:',
        videoTracks.map((t) => ({
          label: t.label,
          kind: t.kind,
          displaySurface: t.getSettings().displaySurface
        }))
      );

      // Find screen share track - check displaySurface first, then label keywords
      const screenTrack = videoTracks.find((track) => {
        const label = track.label.toLowerCase();
        const settings = track.getSettings();
        // Screen share tracks have displaySurface OR contain screen/monitor/display in label
        return (
          settings.displaySurface ||
          label.includes('screen') ||
          label.includes('monitor') ||
          label.includes('display')
        );
      });

      if (screenTrack) {
        console.log(
          '✅ Screen share track found:',
          screenTrack.label,
          screenTrack.getSettings()
        );
        const stream = new MediaStream([screenTrack]);
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current
          .play()
          .catch((e) => console.error('Screen play error:', e));
      } else {
        console.warn('⚠️ No screen share track found');
        console.warn(
          'Available tracks:',
          videoTracks.map((t) => ({
            label: t.label,
            settings: t.getSettings()
          }))
        );
      }
    }
  }, [localStream, isScreenSharing]);

  // Only show video grid if video or screen share is enabled
  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  const handleClose = () => {
    // Properly disable video and stop tracks, not just hide the UI
    if (isVideoEnabled) {
      voiceService.disableVideo();
    }
    if (isScreenSharing) {
      voiceService.stopScreenShare();
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
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Close video"
          >
            <CloseIcon size="md" />
          </button>
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
              <div className="grid gap-4 h-full" style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gridAutoRows: 'minmax(200px, 1fr)'
              }}>
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
      <div className={`absolute ${isScreenShare ? 'top-3 left-3 bg-green-600' : 'bottom-2 left-2 bg-black/80'} px-2 py-1 rounded text-xs font-medium text-white z-10 ${isScreenShare ? 'flex items-center gap-2' : ''}`}>
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
