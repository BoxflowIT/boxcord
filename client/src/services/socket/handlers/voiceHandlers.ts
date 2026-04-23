// Voice Channel and WebRTC Event Handlers
import { useVoiceStore } from '../../../store/voiceStore';
import { voiceService } from '../../voice.service';
import { logger } from '../../../utils/logger';
import {
  flushCandidateQueue,
  queueCandidate,
  deleteCandidateQueue
} from '../../voice/iceCandidateQueue';
import { cleanupPeerAudioElement } from '../../voice/audioManager';
import { cleanupPeerState } from '../../voice/peerManager';
import type SimplePeer from 'simple-peer';
import type {
  SocketHandlerContext,
  VoiceUserJoinedPayload,
  VoiceUserLeftPayload,
  VoiceStateChangedPayload,
  VoiceUsersUpdatedPayload,
  WebRTCOfferPayload,
  WebRTCAnswerPayload,
  WebRTCCandidatePayload,
  PeerDisconnectedPayload
} from '../types';

export function registerVoiceHandlers(context: SocketHandlerContext): void {
  const { socket, queryClient } = context;

  // ============================================
  // VOICE CHANNEL EVENTS
  // ============================================

  // When another user joins the voice channel
  socket.on('voice:user-joined', (data: VoiceUserJoinedPayload) => {
    const store = useVoiceStore.getState();
    logger.log('User joined voice:', data.userId);

    store.addUser({
      userId: data.userId,
      sessionId: data.sessionId,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false
    });

    // Deterministic initiator: lower userId always initiates to prevent dual-offer race
    const currentUserId = context.getCurrentUserId();
    if (!currentUserId) {
      logger.warn('[WEBRTC] No current user ID, cannot determine initiator');
      return;
    }
    const shouldInitiate = currentUserId < data.userId;

    if (shouldInitiate) {
      voiceService.createPeer(data.userId);
    }
    // If we're not the initiator, we wait for the offer from the other peer
  });

  // When another user leaves the voice channel
  socket.on('voice:user-left', (data: VoiceUserLeftPayload) => {
    const store = useVoiceStore.getState();
    logger.log('User left voice:', data.userId);

    store.removeUser(data.userId);
    store.removePeer(data.userId);
    deleteCandidateQueue(data.userId);
    cleanupPeerState(data.userId);
    cleanupPeerAudioElement(data.userId);
  });

  // When another user updates their voice state (mute/deafen/speaking)
  socket.on('voice:state-changed', (data: VoiceStateChangedPayload) => {
    const store = useVoiceStore.getState();
    logger.log('Voice state changed:', data);

    store.updateUserState(data.userId, {
      isMuted: data.isMuted,
      isDeafened: data.isDeafened,
      isSpeaking: data.isSpeaking
    });
  });

  // When voice channel users are updated (for sidebar display)
  socket.on('voice:users-updated', (data: VoiceUsersUpdatedPayload) => {
    logger.log('Voice users updated:', data.channelId);

    // Refetch per-channel query (kept for backward compatibility)
    queryClient.refetchQueries({
      queryKey: ['voiceChannelUsers', data.channelId],
      exact: true
    });

    // Refetch workspace batch query (optimization)
    const currentWorkspaceId = context.getCurrentWorkspaceId();
    if (currentWorkspaceId) {
      queryClient.refetchQueries({
        queryKey: ['workspaceVoiceUsers', currentWorkspaceId],
        exact: true
      });
    }
  });

  // ============================================
  // WEBRTC SIGNALING EVENTS
  // ============================================

  // Receive WebRTC offer from peer
  socket.on('webrtc:offer', (data: WebRTCOfferPayload) => {
    logger.log('Received WebRTC offer from:', data.fromUserId);

    // Deterministic conflict resolution: if we also sent an offer, lower userId wins
    const store = useVoiceStore.getState();
    const currentUserId = context.getCurrentUserId();
    if (!currentUserId) {
      logger.warn('[WEBRTC] No current user ID, cannot resolve offer conflict');
      return;
    }
    const existingPeer = store.peers.get(data.fromUserId);

    if (existingPeer) {
      // We already have a peer for this user (we also initiated)
      if (currentUserId < data.fromUserId) {
        // We are the rightful initiator, ignore their offer
        logger.log(
          `[WEBRTC] Ignoring duplicate offer from ${data.fromUserId} (we are initiator)`
        );
        return;
      }
      // They are the rightful initiator, tear down our peer and accept their offer
      logger.log(
        `[WEBRTC] Accepting offer from ${data.fromUserId} (they are initiator)`
      );
      store.removePeer(data.fromUserId);
    }

    // Add peer (we are not the initiator)
    voiceService.addPeer(data.fromUserId, data.offer);
    flushCandidateQueue(data.fromUserId);
  });

  // Receive WebRTC answer from peer
  socket.on('webrtc:answer', (data: WebRTCAnswerPayload) => {
    handleWebRTCSignal(data.fromUserId, data.answer, 'answer');
  });

  // Receive ICE candidate from peer
  socket.on('webrtc:ice-candidate', (data: WebRTCCandidatePayload) => {
    handleWebRTCSignal(data.fromUserId, data.candidate, 'candidate');
  });

  // Peer disconnected
  socket.on('webrtc:peer-disconnected', (data: PeerDisconnectedPayload) => {
    logger.log('Peer disconnected:', data.userId);

    const store = useVoiceStore.getState();
    store.removePeer(data.userId);
    deleteCandidateQueue(data.userId);
    cleanupPeerState(data.userId);
    cleanupPeerAudioElement(data.userId);
  });
}

// Helper: Handle WebRTC signal (answer/ice-candidate) with ICE candidate queuing
function handleWebRTCSignal(
  fromUserId: string,
  signalData: SimplePeer.SignalData,
  signalType: 'answer' | 'candidate'
): void {
  logger.log(`[WEBRTC] Received ${signalType} from:`, fromUserId);

  const store = useVoiceStore.getState();
  const peer = store.peers.get(fromUserId);

  if (peer) {
    peer.signal(signalData);
    // Also flush any queued candidates now that peer exists
    if (signalType === 'answer') {
      flushCandidateQueue(fromUserId);
    }
  } else if (signalType === 'candidate') {
    queueCandidate(fromUserId, signalData);
  } else {
    logger.warn(
      `[WEBRTC] No peer found for ${fromUserId} when receiving ${signalType}`
    );
  }
}
