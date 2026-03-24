// WebRTC Peer Connection Management
import SimplePeer from 'simple-peer';
import type { Socket } from 'socket.io-client';
import { useVoiceStore } from '../../store/voiceStore';
import { SOCKET_EVENTS } from '../../../../src/00-core/constants';
import { ICE_SERVERS, PEER_RECONNECT } from './constants';
import { playRemoteStream } from './audioManager';
import { logger } from '../../utils/logger';

// Track retry counts per peer for exponential backoff
const retryCountMap = new Map<string, number>();

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
  socket: Socket | null,
  localStream: MediaStream | null
): void {
  peer.on('signal', (signal) => {
    const event = (peer as SimplePeer.Instance & { initiator: boolean })
      .initiator
      ? SOCKET_EVENTS.WEBRTC_OFFER
      : SOCKET_EVENTS.WEBRTC_ANSWER;

    socket?.emit(event, {
      targetUserId: userId,
      [event === SOCKET_EVENTS.WEBRTC_OFFER ? 'offer' : 'answer']: signal
    });
  });

  peer.on('stream', (remoteStream) => {
    playRemoteStream(remoteStream, userId);
    // Connection succeeded — reset retry count
    retryCountMap.delete(userId);
  });

  peer.on('error', (error) => {
    logger.error(`Peer error [${userId}]:`, error);
    const retries = retryCountMap.get(userId) ?? 0;

    if (retries < PEER_RECONNECT.MAX_RETRIES) {
      const delay = PEER_RECONNECT.BASE_DELAY_MS * Math.pow(2, retries);
      retryCountMap.set(userId, retries + 1);
      logger.warn(
        `Retrying peer connection to ${userId} in ${delay}ms (attempt ${retries + 1}/${PEER_RECONNECT.MAX_RETRIES})`
      );

      useVoiceStore.getState().removePeer(userId);
      setTimeout(() => {
        // Only retry if still in voice channel
        const store = useVoiceStore.getState();
        if (store.isConnected && !store.peers.has(userId)) {
          createPeer(userId, localStream, socket);
        }
      }, delay);
    } else {
      logger.error(`Max retries reached for peer ${userId}, giving up`);
      retryCountMap.delete(userId);
      useVoiceStore.getState().removePeer(userId);
    }
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
  socket: Socket | null
): SimplePeer.Instance {
  const store = useVoiceStore.getState();
  const peer = createPeerConnection(true, localStream);

  setupPeerListeners(peer, targetUserId, socket, localStream);
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
  socket: Socket | null
): SimplePeer.Instance {
  const store = useVoiceStore.getState();
  const peer = createPeerConnection(false, localStream);

  setupPeerListeners(peer, targetUserId, socket, localStream);
  store.addPeer(targetUserId, peer);
  peer.signal(offer);

  return peer;
}

/**
 * Reset retry tracking (call on voice channel leave)
 */
export function resetRetryState(): void {
  retryCountMap.clear();
}
