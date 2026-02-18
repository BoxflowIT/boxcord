// Voice Activity Detection
import { useVoiceStore } from '../../store/voiceStore';
import { useAudioSettingsStore } from '../../store/audioSettingsStore';
import { VAD_CONFIG, VAD_SENSITIVITY } from './constants';
import type { AudioPipelineState, VADState } from './types';

/**
 * Start voice activity detection
 */
export function startVoiceActivityDetection(
  audioState: AudioPipelineState,
  vadState: VADState
): void {
  if (!audioState.audioPipeline || !audioState.audioContext) return;

  try {
    // Create analyser connected to audio pipeline output
    audioState.analyser = audioState.audioContext.createAnalyser();
    audioState.analyser.fftSize = VAD_CONFIG.FFT_SIZE;
    audioState.analyser.smoothingTimeConstant = VAD_CONFIG.SMOOTHING;

    // Connect analyser to pipeline output (before outputGain)
    audioState.audioPipeline.limiter.connect(audioState.analyser);

    const dataArray = new Uint8Array(audioState.analyser.frequencyBinCount);

    const detectSpeaking = () => {
      if (!audioState.analyser || !audioState.audioPipeline) return;

      audioState.analyser.getByteFrequencyData(dataArray);

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
      const VAD_THRESHOLD =
        VAD_SENSITIVITY.MAX_THRESHOLD -
        sensitivity *
          (VAD_SENSITIVITY.MAX_THRESHOLD - VAD_SENSITIVITY.MIN_THRESHOLD);

      if (normalizedLevel > VAD_THRESHOLD) {
        // Voice detected - increment counter
        vadState.frameCounter++;
        if (
          vadState.frameCounter >= VAD_CONFIG.ACTIVATE_THRESHOLD &&
          !vadState.vadActive
        ) {
          vadState.vadActive = true;
          audioState.audioPipeline.vadGate.gain.setTargetAtTime(1.0, 0, 0.01);
        }
      } else {
        // Silence - decrement counter
        vadState.frameCounter--;
        if (vadState.frameCounter <= 0 && vadState.vadActive) {
          // Start silence counter
          if (vadState.frameCounter <= -VAD_CONFIG.DEACTIVATE_THRESHOLD) {
            vadState.vadActive = false;
            audioState.audioPipeline.vadGate.gain.setTargetAtTime(0.0, 0, 0.05);
          }
        }
      }

      // Clamp frame counter to prevent overflow
      vadState.frameCounter = Math.max(
        -VAD_CONFIG.DEACTIVATE_THRESHOLD - 5,
        Math.min(VAD_CONFIG.ACTIVATE_THRESHOLD + 5, vadState.frameCounter)
      );

      // Update speaking indicator
      if (isSpeaking !== vadState.lastSpeakingState) {
        vadState.lastSpeakingState = isSpeaking;
        const store = useVoiceStore.getState();

        if (!store.isMuted) {
          store.setSpeaking(isSpeaking);
        }
      }

      vadState.animationFrame = requestAnimationFrame(detectSpeaking);
    };

    detectSpeaking();
  } catch (error) {
    console.error('Failed to start VAD:', error);
  }
}

/**
 * Stop voice activity detection and reset state
 */
export function stopVoiceActivityDetection(
  audioState: AudioPipelineState,
  vadState: VADState
): void {
  if (vadState.animationFrame) {
    cancelAnimationFrame(vadState.animationFrame);
    vadState.animationFrame = null;
  }

  // Reset VAD state
  vadState.vadActive = false;
  vadState.frameCounter = 0;
  audioState.analyser = null;
  vadState.lastSpeakingState = false;
}
