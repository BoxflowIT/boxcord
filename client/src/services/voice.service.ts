// Voice Channel Service - WebRTC Audio Management
import SimplePeer from 'simple-peer';
import { socketService } from './socket';
import { useVoiceStore } from '../store/voiceStore';
import { useAudioSettingsStore } from '../store/audioSettingsStore';
import { useAuthStore } from '../store/auth';
import { SOCKET_EVENTS } from '../../../src/00-core/constants';
import { playVoiceJoinSound, playVoiceLeaveSound } from '../utils/voiceSound';
import {
  applyRNNoise,
  cleanupRNNoise,
  isRNNoiseAvailable
} from '../utils/rnnoise';
import {
  createAudioPipeline,
  cleanupAudioPipeline,
  AudioPipelineNodes
} from '../utils/audioPipeline';

// ============================================================================
// CONSTANTS
// ============================================================================

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Get audio constraints from settings store
function getAudioConstraints(): MediaTrackConstraints {
  const settings = useAudioSettingsStore.getState();

  const constraints = {
    deviceId: settings.inputDeviceId
      ? { exact: settings.inputDeviceId }
      : undefined,
    // Use ideal instead of exact to avoid constraint failures
    echoCancellation: true, // Browser native echo cancellation
    // IMPORTANT: Disable browser native noise suppression when RNNoise is enabled
    noiseSuppression: settings.useRNNoise ? false : true,
    autoGainControl: true, // Browser native AGC
    sampleRate: { ideal: 48000 },
    channelCount: { ideal: 1 }
  };

  console.log('🎤 Voice audio constraints:', constraints);
  return constraints;
}

const VAD_CONFIG = {
  FFT_SIZE: 256,
  SMOOTHING: 0.5,
  SPEAKING_THRESHOLD: 30
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
  private originalLocalStream: MediaStream | null = null; // Track original stream for cleanup with RNNoise
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadAnimationFrame: number | null = null;
  private lastSpeakingState = false;
  private vadActive = false; // VAD gate state
  private vadFrameCounter = 0; // VAD hysteresis counter
  private audioPipeline: AudioPipelineNodes | null = null;

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

  private createPeerConnection(initiator: boolean): SimplePeer.Instance {
    return new SimplePeer({
      initiator,
      stream: this.localStream ?? undefined,
      trickle: true,
      config: { iceServers: ICE_SERVERS }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async joinChannel(channelId: string): Promise<void> {
    const store = useVoiceStore.getState();
    const audioSettings = useAudioSettingsStore.getState();

    try {
      store.setConnecting(true);

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: getAudioConstraints()
      });

      // Apply RNNoise AI noise suppression if enabled
      if (audioSettings.useRNNoise && isRNNoiseAvailable()) {
        console.log(
          '🤖 Applying RNNoise AI to voice call (browser noise suppression OFF)...'
        );
        this.originalLocalStream = this.localStream; // Save original stream reference
        try {
          if (!this.audioContext) {
            this.audioContext = new AudioContext();
          }
          this.localStream = await applyRNNoise(
            this.originalLocalStream,
            this.audioContext
          );
          console.log('✅ RNNoise AI active in voice call');
        } catch (error) {
          console.error('❌ RNNoise failed, using original stream:', error);
          this.localStream = this.originalLocalStream;
          this.originalLocalStream = null;
        }
      } else if (audioSettings.useRNNoise) {
        console.warn('⚠️ RNNoise enabled but not available');
        this.originalLocalStream = null;
      } else {
        console.log('ℹ️ Using browser native noise suppression for voice call');
        this.originalLocalStream = null;
      }

      // Setup audio context
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Create centralized audio processing pipeline
      this.audioPipeline = createAudioPipeline(
        this.audioContext,
        this.localStream,
        {
          outputGain: audioSettings.inputVolume * 2.0
          // Note: inputSensitivity controls VAD threshold dynamically, not pipeline config
        }
      );

      // Replace localStream with processed stream from pipeline
      // This ensures voice calls use the processed audio (with VAD gate, compression, etc.)
      this.localStream = this.audioPipeline.destination.stream;

      console.log('🎙️ Discord-quality voice processing active');

      if (store.isMuted) {
        this.setMicrophoneMuted(true);
      }

      store.setLocalStream(this.localStream);

      const { data: session } = await this.apiRequest<
        ApiResponse<VoiceSession>
      >(`/api/v1/voice/channels/${channelId}/join`, { method: 'POST' });

      store.setCurrentChannel(channelId, session.id);
      store.setConnected(true);
      store.setConnecting(false);

      this.startVoiceActivityDetection();
      this.socket?.emit(SOCKET_EVENTS.VOICE_JOIN, { channelId });

      // Play join sound
      playVoiceJoinSound();
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
      // Play leave sound BEFORE cleanup (so audio context is still active)
      playVoiceLeaveSound();

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
      isMuted: newDeafenedState ? true : store.isMuted
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

  addPeer(
    targetUserId: string,
    offer: SimplePeer.SignalData
  ): SimplePeer.Instance {
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
        [event === SOCKET_EVENTS.WEBRTC_OFFER ? 'offer' : 'answer']: signal
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
    if (!this.audioPipeline || !this.audioContext) return;

    try {
      // Create analyser connected to audio pipeline output
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = VAD_CONFIG.FFT_SIZE;
      this.analyser.smoothingTimeConstant = VAD_CONFIG.SMOOTHING;

      // Connect analyser to pipeline output (before outputGain)
      this.audioPipeline.limiter.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const detectSpeaking = () => {
        if (!this.analyser || !this.audioPipeline) return;

        this.analyser.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = (average / 128) * 100;
        const isSpeaking = average > VAD_CONFIG.SPEAKING_THRESHOLD;

        // Voice Activity Detection for gate control (Discord-like)
        // Input Sensitivity controls how easily the gate opens
        const audioSettings = useAudioSettingsStore.getState();
        const sensitivity = audioSettings.inputSensitivity;

        // Calculate VAD threshold from sensitivity (0-1)
        // 0.0 = 15% (very insensitive, only loud sounds open gate)
        // 0.21 = 8% (default, Discord-like)
        // 1.0 = 2% (very sensitive, whispers open gate)
        const VAD_THRESHOLD = 15 - sensitivity * 13; // 15% to 2%
        const VAD_ACTIVATE_THRESHOLD = 2; // Open after 2 frames above threshold (~32ms)
        const VAD_DEACTIVATE_THRESHOLD = 15; // Close after 15 frames below threshold (~240ms)

        if (normalizedLevel > VAD_THRESHOLD) {
          // Voice detected - increment counter
          this.vadFrameCounter++;
          if (this.vadFrameCounter >= VAD_ACTIVATE_THRESHOLD && !this.vadActive) {
            this.vadActive = true;
            this.audioPipeline.vadGate.gain.setTargetAtTime(1.0, 0, 0.01);
          }
        } else {
          // Silence - decrement counter
          this.vadFrameCounter--;
          if (this.vadFrameCounter <= 0 && this.vadActive) {
            // Start silence counter
            if (this.vadFrameCounter <= -VAD_DEACTIVATE_THRESHOLD) {
              this.vadActive = false;
              this.audioPipeline.vadGate.gain.setTargetAtTime(0.0, 0, 0.05);
            }
          }
        }

        // Clamp frame counter to prevent overflow
        this.vadFrameCounter = Math.max(-VAD_DEACTIVATE_THRESHOLD - 5, Math.min(VAD_ACTIVATE_THRESHOLD + 5, this.vadFrameCounter));

        // Update speaking indicator
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

    // Reset VAD state
    this.vadActive = false;
    this.vadFrameCounter = 0;
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
        body: JSON.stringify(state)
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
    const audioSettings = useAudioSettingsStore.getState();

    this.stopVoiceActivityDetection();

    // Stop processed stream
    if (this.localStream) {
      // Cleanup RNNoise if it was used
      if (audioSettings.useRNNoise) {
        cleanupRNNoise(this.localStream);
      }
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Stop original stream if RNNoise was used
    if (this.originalLocalStream) {
      this.originalLocalStream.getTracks().forEach((track) => track.stop());
      this.originalLocalStream = null;
    }

    // Cleanup audio pipeline
    if (this.audioPipeline) {
      cleanupAudioPipeline(this.audioPipeline);
      this.audioPipeline = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    store.peers.forEach((peer) => peer.destroy());

    store.users.forEach((user) => {
      document.getElementById(`voice-audio-${user.userId}`)?.remove();
    });
  }
}

export const voiceService = new VoiceService();
