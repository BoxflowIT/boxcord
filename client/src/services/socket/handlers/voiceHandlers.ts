// Voice Channel and WebRTC Event Handlers
import { useVoiceStore } from '../../../store/voiceStore';
import { voiceService } from '../../voice.service';
import { logger } from '../../../utils/logger';
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
  PeerDisconnectedPayload,
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
      isSpeaking: false,
    });

    // Initiate peer connection (we are the initiator)
    voiceService.createPeer(data.userId);
  });

  // When another user leaves the voice channel
  socket.on('voice:user-left', (data: VoiceUserLeftPayload) => {
    const store = useVoiceStore.getState();
    logger.log('User left voice:', data.userId);

    store.removeUser(data.userId);
    store.removePeer(data.userId);

    // Remove audio element
    const audioElement = document.getElementById(`voice-audio-${data.userId}`);
    audioElement?.remove();
  });

  // When another user updates their voice state (mute/deafen/speaking)
  socket.on('voice:state-changed', (data: VoiceStateChangedPayload) => {
    const store = useVoiceStore.getState();
    logger.log('Voice state changed:', data);

    store.updateUserState(data.userId, {
      isMuted: data.isMuted,
      isDeafened: data.isDeafened,
      isSpeaking: data.isSpeaking,
    });
  });

  // When voice channel users are updated (for sidebar display)
  socket.on('voice:users-updated', (data: VoiceUsersUpdatedPayload) => {
    logger.log('Voice users updated:', data.channelId);

    // Refetch immediately instead of just invalidating
    queryClient.refetchQueries({
      queryKey: ['voiceChannelUsers', data.channelId],
      exact: true,
    });
  });

  // ============================================
  // WEBRTC SIGNALING EVENTS
  // ============================================

  // Receive WebRTC offer from peer
  socket.on('webrtc:offer', (data: WebRTCOfferPayload) => {
    logger.log('Received WebRTC offer from:', data.fromUserId);

    // Add peer (we are not the initiator)
    voiceService.addPeer(data.fromUserId, data.offer);
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
  });
}

// Helper: Handle WebRTC signal (answer/ice-candidate)
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
  } else {
    logger.warn(`[WEBRTC] No peer found for ${fromUserId} when receiving ${signalType}`);
  }
}
