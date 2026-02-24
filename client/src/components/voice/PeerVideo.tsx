// Peer Video - Display remote user's video stream
import { useEffect, useRef } from 'react';
import { useVoiceStore } from '../../store/voiceStore';

interface PeerVideoProps {
  userId: string;
}

export function PeerVideo({ userId }: PeerVideoProps) {
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
