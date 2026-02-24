// Audio Setup and Configuration
import { useAudioSettingsStore } from '../../store/audioSettingsStore';
import { useVoiceStore } from '../../store/voiceStore';
import {
  applyRNNoise,
  cleanupRNNoise,
  isRNNoiseAvailable
} from '../../utils/rnnoise';
import {
  createAudioPipeline,
  cleanupAudioPipeline,
  AudioPipelineNodes
} from '../../utils/audioPipeline';
import { logger } from '../../utils/logger';
import type { AudioPipelineState } from './types';

/**
 * Get audio constraints from settings store
 */
export function getAudioConstraints(): MediaTrackConstraints {
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

  return constraints;
}

/**
 * Sets up audio for voice calls (both channel and DM)
 * Handles: getUserMedia, RNNoise, audio pipeline, VAD
 */
export async function setupAudioForCall(
  state: AudioPipelineState
): Promise<void> {
  const store = useVoiceStore.getState();
  const audioSettings = useAudioSettingsStore.getState();

  // Get user media
  state.localStream = await navigator.mediaDevices.getUserMedia({
    audio: getAudioConstraints()
  });

  // Apply RNNoise AI noise suppression if enabled
  if (audioSettings.useRNNoise && isRNNoiseAvailable()) {
    logger.debug('🤖 Applying RNNoise AI to voice call...');
    state.originalLocalStream = state.localStream;
    try {
      if (!state.audioContext) {
        state.audioContext = new AudioContext();
      }
      state.localStream = await applyRNNoise(
        state.originalLocalStream,
        state.audioContext
      );
      logger.debug('✅ RNNoise AI active in voice call');
    } catch (error) {
      logger.error('❌ RNNoise failed, using original stream:', error);
      state.localStream = state.originalLocalStream;
      state.originalLocalStream = null;
    }
  } else if (audioSettings.useRNNoise) {
    logger.warn('⚠️ RNNoise enabled but not available');
    state.originalLocalStream = null;
  } else {
    state.originalLocalStream = null;
  }

  // Setup audio context
  if (!state.audioContext) {
    state.audioContext = new AudioContext();
  }

  // Create centralized audio processing pipeline
  state.audioPipeline = createAudioPipeline(
    state.audioContext,
    state.localStream,
    {
      outputGain: audioSettings.inputVolume * 2.0
      // Note: inputSensitivity controls VAD threshold dynamically, not pipeline config
    }
  ) as unknown;

  // Replace localStream with processed stream from pipeline
  // This ensures voice calls use the processed audio (with VAD gate, compression, etc.)
  state.localStream = (
    state.audioPipeline as AudioPipelineNodes
  ).destination.stream;

  logger.debug('🎙️ Discord-quality voice processing active');

  // Apply mute state if already muted
  if (store.isMuted) {
    setMicrophoneMuted(state.localStream, true);
  }

  store.setLocalStream(state.localStream);
}

/**
 * Mutes or unmutes the microphone
 */
export function setMicrophoneMuted(
  stream: MediaStream | null,
  muted: boolean
): void {
  stream?.getAudioTracks().forEach((track) => {
    track.enabled = !muted;
  });
}

/**
 * Cleanup audio resources
 */
export function cleanupAudio(state: AudioPipelineState): void {
  const audioSettings = useAudioSettingsStore.getState();

  // Stop processed stream
  if (state.localStream) {
    // Cleanup RNNoise if it was used
    if (audioSettings.useRNNoise) {
      cleanupRNNoise(state.localStream);
    }
    state.localStream.getTracks().forEach((track) => track.stop());
    state.localStream = null;
  }

  // Stop original stream if RNNoise was used
  if (state.originalLocalStream) {
    state.originalLocalStream.getTracks().forEach((track) => track.stop());
    state.originalLocalStream = null;
  }

  // Cleanup audio pipeline
  if (state.audioPipeline) {
    cleanupAudioPipeline(state.audioPipeline as AudioPipelineNodes);
    state.audioPipeline = null;
  }

  // Close audio context
  if (state.audioContext) {
    state.audioContext.close();
    state.audioContext = null;
  }
}
