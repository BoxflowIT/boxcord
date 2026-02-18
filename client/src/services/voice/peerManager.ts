// WebRTC Peer Connection Management
import SimplePeer from 'simple-peer';
import { useVoiceStore } from '../../store/voiceStore';
import { SOCKET_EVENTS } from '../../../../src/00-core/constants';
import { ICE_SERVERS } from './constants';
import { playRemoteStream } from './audioManager';

/**
 * Create a new peer connection
 */
export function createPeerConnection(
  initiator: boolean,
  localStream: MediaStream | null
): SimplePeer.Instance {
  return new SimplePeer({
    initiator,
    stream: localStream ?? undefined,
    trickle: true,
    config: { iceServers: ICE_SERVERS }
  });
}

/**
 * Setup event listeners for a peer connection
 */
export function setupPeerListeners(
  peer: SimplePeer.Instance,
  userId: string,
  socket: any
): void {
  peer.on('signal', (signal) => {
    const event = (peer as any).initiator
      ? SOCKET_EVENTS.WEBRTC_OFFER
      : SOCKET_EVENTS.WEBRTC_ANSWER;

    socket?.emit(event, {
      targetUserId: userId,
      [event === SOCKET_EVENTS.WEBRTC_OFFER ? 'offer' : 'answer']: signal
    });
  });

  peer.on('stream', (remoteStream) => {
    playRemoteStream(remoteStream, userId);
  });

  peer.on('error', (error) => {
    console.error(`Peer error [${userId}]:`, error);
    useVoiceStore.getState().removePeer(userId);
  });

  peer.on('close', () => {
    useVoiceStore.getState().removePeer(userId);
  });
}

/**
 * Create and setup a new peer (initiator)
 */
export function createPeer(
  targetUserId: string,
  localStream: MediaStream | null,
  socket: any
): SimplePeer.Instance {
  const store = useVoiceStore.getState();
  const peer = createPeerConnection(true, localStream);

  setupPeerListeners(peer, targetUserId, socket);
  store.addPeer(targetUserId, peer);

  return peer;
}

/**
 * Add and setup a peer from an offer (receiver)
 */
export function addPeer(
  targetUserId: string,
  offer: SimplePeer.SignalData,
  localStream: MediaStream | null,
  socket: any
): SimplePeer.Instance {
  const store = useVoiceStore.getState();
  const peer = createPeerConnection(false, localStream);

  setupPeerListeners(peer, targetUserId, socket);
  store.addPeer(targetUserId, peer);
  peer.signal(offer);

  return peer;
}
