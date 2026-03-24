// Voice Channel Service - WebRTC Audio Management
import SimplePeer from 'simple-peer';
import { socketService, getQueryClient } from '../socket';
import { useVoiceStore } from '../../store/voiceStore';
import { useAuthStore } from '../../store/auth';
import { SOCKET_EVENTS } from '../../../../src/00-core/constants';
import {
  playVoiceJoinSound,
  playVoiceLeaveSound
} from '../../utils/voiceSound';
import { logger } from '../../utils/logger';

// Modular imports
import type {
  VoiceStateUpdate,
  ApiResponse,
  VoiceSession,
  AudioPipelineState,
  VADState
} from './types';
import {
  setupAudioForCall,
  setMicrophoneMuted,
  cleanupAudio
} from './audioSetup';
import { startVoiceActivityDetection, stopVoiceActivityDetection } from './vad';
import { createPeer, addPeer, resetRetryState } from './peerManager';
import { resetCandidateQueue } from './iceCandidateQueue';
import { muteAllPeers, cleanupPeerAudio } from './audioManager';
import {
  toggleVideo,
  toggleScreenShare,
  enableVideo,
  disableVideo,
  startScreenShare,
  stopScreenShare,
  changeVideoQuality
} from './videoManager';

// ============================================================================
// VOICE SERVICE CLASS
// ============================================================================

class VoiceService {
  // Audio pipeline state
  private audioState: AudioPipelineState = {
    localStream: null,
    originalLocalStream: null,
    audioContext: null,
    analyser: null,
    audioPipeline: null
  };

  // VAD state
  private vadState: VADState = {
    animationFrame: null,
    lastSpeakingState: false,
    vadActive: false,
    frameCounter: 0
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  private get socket() {
    return socketService.getSocket();
  }

  private getAuthHeader(): Record<string, string> {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async apiRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeader(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Request failed: ${response.status}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ============================================================================
  // PRIVATE AUDIO SETUP
  // ============================================================================

  /**
   * Sets up audio for voice calls (both channel and DM)
   * Delegates to audioSetup module
   */
  private async setupAudio(): Promise<void> {
    await setupAudioForCall(this.audioState);
    this.startVAD();
  }

  private startVAD(): void {
    startVoiceActivityDetection(this.audioState, this.vadState);
  }

  private stopVAD(): void {
    stopVoiceActivityDetection(this.audioState, this.vadState);
  }

  // ============================================================================
  // PUBLIC API - CHANNEL VOICE
  // ============================================================================

  async joinChannel(channelId: string): Promise<void> {
    const store = useVoiceStore.getState();

    try {
      store.setConnecting(true);

      // Setup audio (shared logic)
      await this.setupAudio();

      // Channel-specific: API session
      const { data: session } = await this.apiRequest<
        ApiResponse<VoiceSession>
      >(`/api/v1/voice/channels/${channelId}/join`, { method: 'POST' });

      store.setCurrentChannel(channelId, session.id);
      store.setConnected(true);
      store.setConnecting(false);

      // Channel-specific: Socket event
      this.socket?.emit(SOCKET_EVENTS.VOICE_JOIN, { channelId });

      // Play join sound
      playVoiceJoinSound();
    } catch (error) {
      logger.error('Failed to join voice channel:', error);
      this.cleanup();
      store.setConnecting(false);
      throw error;
    }
  }

  async leaveChannel(): Promise<void> {
    const store = useVoiceStore.getState();
    const { currentChannelId, currentSessionId } = store;

    if (!currentChannelId || !currentSessionId) {
      logger.warn('⚠️ Already disconnected from voice channel');
      return;
    }

    try {
      // CRITICAL: Set disconnected state IMMEDIATELY before any async operations
      // This prevents UI from showing "connected" state during leave process
      store.setConnected(false);
      store.setCurrentChannel(null, null);

      // Invalidate React Query cache immediately to hide user from list
      const queryClient = getQueryClient();
      if (queryClient) {
        queryClient.setQueryData(['voiceChannelUsers', currentChannelId], []);
      }

      // Play leave sound BEFORE cleanup (so audio context is still active)
      playVoiceLeaveSound();

      // Now do API call and socket emit (these may take time)
      await this.apiRequest(
        `/api/v1/voice/sessions/${currentSessionId}/leave`,
        { method: 'POST' }
      );

      this.socket?.emit(SOCKET_EVENTS.VOICE_LEAVE, {
        channelId: currentChannelId
      });

      this.cleanup();
      store.reset();
    } catch (error) {
      // NetworkError is expected during page unload - don't log it
      const isNetworkError =
        error instanceof TypeError && error.message.includes('NetworkError');

      if (!isNetworkError) {
        logger.error('❌ Failed to leave voice channel:', error);
      }

      // Even if API call fails, cleanup locally
      this.cleanup();
      store.reset();
    }
  }

  // ============================================================================
  // PUBLIC API - DM VOICE CALLS
  // ============================================================================

  async joinDMCall(channelId: string): Promise<void> {
    try {
      // Setup audio (shared logic with channel voice)
      await this.setupAudio();

      // Play join sound (same as channel voice)
      playVoiceJoinSound();

      logger.debug('✅ Joined DM voice call:', channelId);
    } catch (error) {
      logger.error('Failed to join DM call:', error);
      this.cleanup();
      throw error;
    }
  }

  async leaveDMCall(): Promise<void> {
    try {
      // Play leave sound BEFORE cleanup (so audio context is still active)
      playVoiceLeaveSound();

      // Simply cleanup - no API call needed for DM
      this.cleanup();
    } catch (error) {
      logger.error('Failed to leave DM call:', error);
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  async toggleMute(): Promise<void> {
    const store = useVoiceStore.getState();
    const newMutedState = !store.isMuted;

    store.setMuted(newMutedState);
    setMicrophoneMuted(this.audioState.localStream, newMutedState);

    if (newMutedState) {
      store.setSpeaking(false);
    }

    await this.updateVoiceState({ isMuted: newMutedState });
  }

  async toggleDeafen(): Promise<void> {
    const store = useVoiceStore.getState();
    const newDeafenedState = !store.isDeafened;

    store.setDeafened(newDeafenedState);

    if (newDeafenedState) {
      store.setMuted(true);
      store.setSpeaking(false);
      setMicrophoneMuted(this.audioState.localStream, true);
      muteAllPeers(true);
    } else {
      muteAllPeers(false);
    }

    await this.updateVoiceState({
      isDeafened: newDeafenedState,
      isMuted: newDeafenedState ? true : store.isMuted
    });
  }

  // ============================================================================
  // VIDEO & SCREEN SHARE
  // ============================================================================

  async toggleVideo(): Promise<void> {
    try {
      await toggleVideo(this.audioState);
    } catch (error) {
      logger.error('Failed to toggle video:', error);
      throw error;
    }
  }

  async toggleScreenShare(): Promise<void> {
    try {
      await toggleScreenShare(this.audioState);
    } catch (error) {
      logger.error('Failed to toggle screen share:', error);
      throw error;
    }
  }

  async enableVideo(): Promise<void> {
    await enableVideo(this.audioState);
  }

  async disableVideo(): Promise<void> {
    disableVideo(this.audioState);
  }

  async startScreenShare(): Promise<void> {
    await startScreenShare(this.audioState);
  }

  async stopScreenShare(): Promise<void> {
    stopScreenShare(this.audioState);
  }

  async changeVideoQuality(): Promise<void> {
    try {
      await changeVideoQuality(this.audioState);
    } catch (error) {
      logger.error('Failed to change video quality:', error);
      throw error;
    }
  }

  // ============================================================================
  // WEBRTC PEER MANAGEMENT
  // ============================================================================

  createPeer(targetUserId: string): SimplePeer.Instance {
    return createPeer(targetUserId, this.audioState.localStream, this.socket);
  }

  addPeer(
    targetUserId: string,
    offer: SimplePeer.SignalData
  ): SimplePeer.Instance {
    return addPeer(
      targetUserId,
      offer,
      this.audioState.localStream,
      this.socket
    );
  }

  // ============================================================================
  // API CALLS
  // ============================================================================

  private async updateVoiceState(state: VoiceStateUpdate): Promise<void> {
    const { currentSessionId } = useVoiceStore.getState();
    if (!currentSessionId) return;

    try {
      await this.apiRequest(`/api/v1/voice/sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (error) {
      logger.error('Failed to update voice state:', error);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  private cleanup(): void {
    const store = useVoiceStore.getState();

    this.stopVAD();
    cleanupAudio(this.audioState);
    resetRetryState();
    resetCandidateQueue();

    store.peers.forEach((peer) => peer.destroy());
    cleanupPeerAudio();
  }
}

export const voiceService = new VoiceService();
