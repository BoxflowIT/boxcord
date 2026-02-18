// Voice Channel Service - WebRTC Audio Management
import SimplePeer from 'simple-peer';
import { socketService } from './socket';
import { useVoiceStore } from '../store/voiceStore';
import { useAuthStore } from '../store/auth';
import { SOCKET_EVENTS } from '../../../src/00-core/constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const VAD_CONFIG = {
  FFT_SIZE: 256,
  SMOOTHING: 0.5,
  SPEAKING_THRESHOLD: 30,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface VoiceStateUpdate {
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface VoiceSession {
  id: string;
  channelId: string;
  userId: string;
}

// ============================================================================
// VOICE SERVICE CLASS
// ============================================================================

class VoiceService {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadAnimationFrame: number | null = null;
  private lastSpeakingState = false;

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
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private createPeerConnection(initiator: boolean): SimplePeer.Instance {
    return new SimplePeer({
      initiator,
      stream: this.localStream ?? undefined,
      trickle: true,
      config: { iceServers: ICE_SERVERS },
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async joinChannel(channelId: string): Promise<void> {
    const store = useVoiceStore.getState();

    try {
      store.setConnecting(true);

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });

      if (store.isMuted) {
        this.setMicrophoneMuted(true);
      }

      store.setLocalStream(this.localStream);

      const { data: session } = await this.apiRequest<ApiResponse<VoiceSession>>(
        `/api/v1/voice/channels/${channelId}/join`,
        { method: 'POST' }
      );

      store.setCurrentChannel(channelId, session.id);
      store.setConnected(true);
      store.setConnecting(false);

      this.startVoiceActivityDetection();
      this.socket?.emit(SOCKET_EVENTS.VOICE_JOIN, { channelId });
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      this.cleanup();
      store.setConnecting(false);
      throw error;
    }
  }

  async leaveChannel(): Promise<void> {
    const store = useVoiceStore.getState();
    const { currentChannelId, currentSessionId } = store;

    if (!currentChannelId || !currentSessionId) return;

    try {
      await this.apiRequest(
        `/api/v1/voice/sessions/${currentSessionId}/leave`,
        { method: 'POST' }
      );

      this.socket?.emit(SOCKET_EVENTS.VOICE_LEAVE, { channelId: currentChannelId });
      this.cleanup();
      store.reset();
    } catch (error) {
      console.error('Failed to leave voice channel:', error);
    }
  }

  async toggleMute(): Promise<void> {
    const store = useVoiceStore.getState();
    const newMutedState = !store.isMuted;

    store.setMuted(newMutedState);
    this.setMicrophoneMuted(newMutedState);

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
      this.setMicrophoneMuted(true);
      this.muteAllPeers(true);
    } else {
      this.muteAllPeers(false);
    }

    await this.updateVoiceState({
      isDeafened: newDeafenedState,
      isMuted: newDeafenedState ? true : store.isMuted,
    });
  }

  // ============================================================================
  // WEBRTC PEER MANAGEMENT
  // ============================================================================

  createPeer(targetUserId: string): SimplePeer.Instance {
    const store = useVoiceStore.getState();
    const peer = this.createPeerConnection(true);

    this.setupPeerListeners(peer, targetUserId);
    store.addPeer(targetUserId, peer);

    return peer;
  }

  addPeer(targetUserId: string, offer: SimplePeer.SignalData): SimplePeer.Instance {
    const store = useVoiceStore.getState();
    const peer = this.createPeerConnection(false);

    this.setupPeerListeners(peer, targetUserId);
    store.addPeer(targetUserId, peer);
    peer.signal(offer);

    return peer;
  }

  private setupPeerListeners(peer: SimplePeer.Instance, userId: string): void {
    peer.on('signal', (signal) => {
      const event = (peer as any).initiator
        ? SOCKET_EVENTS.WEBRTC_OFFER
        : SOCKET_EVENTS.WEBRTC_ANSWER;

      this.socket?.emit(event, {
        targetUserId: userId,
        [event === SOCKET_EVENTS.WEBRTC_OFFER ? 'offer' : 'answer']: signal,
      });
    });

    peer.on('stream', (remoteStream) => {
      this.playRemoteStream(remoteStream, userId);
    });

    peer.on('error', (error) => {
      console.error(`Peer error [${userId}]:`, error);
      useVoiceStore.getState().removePeer(userId);
    });

    peer.on('close', () => {
      useVoiceStore.getState().removePeer(userId);
    });
  }

  // ============================================================================
  // AUDIO MANAGEMENT
  // ============================================================================

  private playRemoteStream(stream: MediaStream, userId: string): void {
    const elementId = `voice-audio-${userId}`;
    let audioElement = document.getElementById(elementId) as HTMLAudioElement;

    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = elementId;
      audioElement.autoplay = true;
      document.body.appendChild(audioElement);
    }

    audioElement.srcObject = stream;
    audioElement.muted = useVoiceStore.getState().isDeafened;
  }

  private setMicrophoneMuted(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  private muteAllPeers(muted: boolean): void {
    useVoiceStore.getState().users.forEach((user) => {
      const audioElement = document.getElementById(
        `voice-audio-${user.userId}`
      ) as HTMLAudioElement;
      if (audioElement) {
        audioElement.muted = muted;
      }
    });
  }

  // ============================================================================
  // VOICE ACTIVITY DETECTION
  // ============================================================================

  private startVoiceActivityDetection(): void {
    if (!this.localStream) return;

    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = VAD_CONFIG.FFT_SIZE;
      this.analyser.smoothingTimeConstant = VAD_CONFIG.SMOOTHING;

      const source = this.audioContext.createMediaStreamSource(this.localStream);
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const detectSpeaking = () => {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const isSpeaking = average > VAD_CONFIG.SPEAKING_THRESHOLD;

        if (isSpeaking !== this.lastSpeakingState) {
          this.lastSpeakingState = isSpeaking;
          const store = useVoiceStore.getState();

          if (!store.isMuted) {
            store.setSpeaking(isSpeaking);
          }
        }

        this.vadAnimationFrame = requestAnimationFrame(detectSpeaking);
      };

      detectSpeaking();
    } catch (error) {
      console.error('Failed to start VAD:', error);
    }
  }

  private stopVoiceActivityDetection(): void {
    if (this.vadAnimationFrame) {
      cancelAnimationFrame(this.vadAnimationFrame);
      this.vadAnimationFrame = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.lastSpeakingState = false;
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
        body: JSON.stringify(state),
      });
    } catch (error) {
      console.error('Failed to update voice state:', error);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  private cleanup(): void {
    const store = useVoiceStore.getState();

    this.stopVoiceActivityDetection();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    store.peers.forEach((peer) => peer.destroy());

    store.users.forEach((user) => {
      document.getElementById(`voice-audio-${user.userId}`)?.remove();
    });
  }
}

export const voiceService = new VoiceService();
