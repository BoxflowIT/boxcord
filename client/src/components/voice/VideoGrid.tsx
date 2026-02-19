// Video Grid - Display video streams in voice call
import { useEffect, useRef } from 'react';
import { useVoiceStore, useVoiceUsers } from '../../store/voiceStore';
import { VideoOffIcon, CloseIcon } from '../ui/Icons';

interface VideoGridProps {
  className?: string;
}

export function VideoGrid({ className = '' }: VideoGridProps) {
  const localStream = useVoiceStore((s) => s.localStream);
  const voiceUsers = useVoiceUsers();
  const { isVideoEnabled, isScreenSharing, setVideoEnabled, setScreenSharing } = useVoiceStore((s) => ({
    isVideoEnabled: s.isVideoEnabled,
    isScreenSharing: s.isScreenSharing,
    setVideoEnabled: s.setVideoEnabled,
    setScreenSharing: s.setScreenSharing
  }));

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Setup local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      const hasVideoTrack = localStream.getVideoTracks().length > 0;
      if (hasVideoTrack) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, isVideoEnabled, isScreenSharing]);

  // Only show video grid if video or screen share is enabled
  const shouldShowVideo = isVideoEnabled || isScreenSharing;

  if (!shouldShowVideo && voiceUsers.length === 0) {
    return null;
  }

  const handleClose = () => {
    if (isVideoEnabled) setVideoEnabled(false);
    if (isScreenSharing) setScreenSharing(false);
  };

  return (
    <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden w-full max-w-6xl max-h-[85vh] flex flex-col">
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
        <div className={`flex-1 p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr ${className}`}>
          {/* Local video */}
          {shouldShowVideo && (
            <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px]">
              {localStream?.getVideoTracks().length ?? 0 > 0 ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoOffIcon size="lg" className="text-gray-600" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/80 px-3 py-1.5 rounded-md text-sm font-medium text-white">
                You {isScreenSharing ? '(Screen)' : ''}
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
