// Video Grid - Display video streams in voice call
import { useEffect, useRef } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { CloseIcon } from '../ui/Icons';

interface VideoGridProps {
  className?: string;
}

export function VideoGrid({ className = '' }: VideoGridProps) {
  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const {
    isVideoEnabled,
    isScreenSharing,
    setVideoEnabled,
    setScreenSharing
  } = useVoiceStore((s) => ({
    isVideoEnabled: s.isVideoEnabled,
    isScreenSharing: s.isScreenSharing,
    setVideoEnabled: s.setVideoEnabled,
    setScreenSharing: s.setScreenSharing
  }));

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Setup camera video
  useEffect(() => {
    if (cameraVideoRef.current && localStream && isVideoEnabled) {
      const videoTracks = localStream.getVideoTracks();
      // Find camera track (no displaySurface setting)
      const cameraTrack = videoTracks.find((track) => {
        const settings = track.getSettings();
        return !settings.displaySurface;
      });

      if (cameraTrack) {
        const stream = new MediaStream([cameraTrack]);
        cameraVideoRef.current.srcObject = stream;
      }
    }
  }, [localStream, isVideoEnabled]);

  // Setup screen share video
  useEffect(() => {
    if (screenVideoRef.current && localStream && isScreenSharing) {
      const videoTracks = localStream.getVideoTracks();
      // Find screen share track (has displaySurface setting)
      const screenTrack = videoTracks.find((track) => {
        const settings = track.getSettings();
        return !!settings.displaySurface;
      });

      if (screenTrack) {
        const stream = new MediaStream([screenTrack]);
        screenVideoRef.current.srcObject = stream;
      }
    }
  }, [localStream, isScreenSharing]);

  // Only show video grid if video or screen share is enabled
  if (!isVideoEnabled && !isScreenSharing && voiceUsers.length === 0) {
    return null;
  }

  const handleClose = () => {
    if (isVideoEnabled) setVideoEnabled(false);
    if (isScreenSharing) setScreenSharing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden w-full max-w-6xl max-h-[85vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            {isScreenSharing ? 'Screen Share' : 'Video Call'}
          </h3>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Close video"
          >
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* Video Grid */}
        <div
          className={`flex-1 p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr ${className}`}
        >
          {/* Camera video */}
          {isVideoEnabled && (
            <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px]">
              <video
                ref={cameraVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute bottom-3 left-3 bg-black/80 px-3 py-1.5 rounded-md text-sm font-medium text-white">
                You (Camera)
              </div>
            </div>
          )}

          {/* Screen share video */}
          {isScreenSharing && (
            <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px]">
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 bg-black/80 px-3 py-1.5 rounded-md text-sm font-medium text-white">
                You (Screen)
              </div>
            </div>
          )}

          {/* Peer videos - will be populated when peers share video */}
          {voiceUsers
            .filter((user) => user.userId !== useVoiceStore.getState().currentSessionId)
            .map((user) => (
              <PeerVideo key={user.userId} userId={user.userId} />
            ))}
        </div>
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
      // @ts-ignore - SimplePeer has _pc (RTCPeerConnection)
      const pc = peer._pc as RTCPeerConnection;
      if (pc) {
        const receivers = pc.getReceivers();
        const videoReceiver = receivers.find(
          (r) => r.track.kind === 'video'
        );
        
        if (videoReceiver) {
          const stream = new MediaStream([videoReceiver.track]);
          videoRef.current.srcObject = stream;
        }
      }
    }
  }, [peer, userId]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-black/80 px-3 py-1.5 rounded-md text-sm font-medium text-white">
        User {userId.slice(0, 8)}
      </div>
    </div>
  );
}
