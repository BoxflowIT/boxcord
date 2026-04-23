/**
 * Audio Pipeline Utilities
 * Centralized audio processing configuration for voice channels
 */

export interface AudioPipelineConfig {
  preGain: number;
  highPassFrequency: number;
  compressorThreshold: number;
  compressorRatio: number;
  limiterThreshold: number;
  outputGain: number;
  inputSensitivity?: number; // 0-1, controls VAD gate sensitivity (not used in pipeline directly)
}

export const DEFAULT_PIPELINE_CONFIG: AudioPipelineConfig = {
  preGain: 2.5, // Optimized for clarity - clear voice without feedback
  highPassFrequency: 100, // Removes low-frequency room noise and rumble
  compressorThreshold: -18, // Smooth dynamics
  compressorRatio: 8, // Strong compression for consistent levels
  limiterThreshold: -3, // Brick wall limiter prevents clipping
  outputGain: 2.0 // Total gain: 2.5 × 2.0 = 5x (clear and loud)
};

export interface AudioPipelineNodes {
  source: MediaStreamAudioSourceNode;
  preGain: GainNode;
  highPassFilter: BiquadFilterNode;
  vadGate: GainNode; // Voice Activity Detection gate - on/off control
  compressor: DynamicsCompressorNode;
  destination: MediaStreamAudioDestinationNode; // Output stream
  limiter: DynamicsCompressorNode;
  outputGain: GainNode;
}

/**
 * Creates a professional audio processing pipeline
 * Discord-quality: Pre-gain → HPF → VAD Gate → Compression → Limiting → Output
 * Note: RNNoise AI handles noise suppression, VAD gate handles background silence
 */
export function createAudioPipeline(
  audioContext: AudioContext,
  inputStream: MediaStream,
  config: Partial<AudioPipelineConfig> = {}
): AudioPipelineNodes {
  const fullConfig = { ...DEFAULT_PIPELINE_CONFIG, ...config };

  // Note: inputSensitivity controls VAD threshold, not noise gate
  // RNNoise AI handles actual noise suppression

  // Source
  const source = audioContext.createMediaStreamSource(inputStream);

  // Pre-gain boost for weak signals
  const preGain = audioContext.createGain();
  preGain.gain.value = fullConfig.preGain;

  // High-pass filter removes low-frequency rumble
  const highPassFilter = audioContext.createBiquadFilter();
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.value = fullConfig.highPassFrequency;
  highPassFilter.Q.value = 0.7;

  // VAD Gate - Voice Activity Detection gate (on/off control)
  // This is the REAL gate that blocks background noise
  const vadGate = audioContext.createGain();
  vadGate.gain.value = 1.0; // Default: open (controlled by VAD in voice calls)

  // Main compressor - smooth dynamics
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = fullConfig.compressorThreshold;
  compressor.knee.value = 20; // Smooth curve
  compressor.ratio.value = fullConfig.compressorRatio;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  // Limiter - prevent clipping
  const limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.value = fullConfig.limiterThreshold;
  limiter.knee.value = 0; // Brick wall
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  // Output gain
  const outputGain = audioContext.createGain();
  outputGain.gain.value = fullConfig.outputGain;

  // Output destination - creates processed MediaStream
  const destination = audioContext.createMediaStreamDestination();

  // Connect pipeline: Pre-gain → HPF → VAD Gate → Compressor → Limiter → Output → Destination
  source.connect(preGain);
  preGain.connect(highPassFilter);
  highPassFilter.connect(vadGate); // VAD gate is the real noise gate
  vadGate.connect(compressor);
  compressor.connect(limiter);
  limiter.connect(outputGain);
  outputGain.connect(destination); // Connect to destination to get processed stream

  return {
    source,
    preGain,
    highPassFilter,
    vadGate, // Return VAD gate for external control
    compressor,
    limiter,
    outputGain,
    destination // Contains the processed MediaStream
  };
}

/**
 * Updates output gain in an existing pipeline
 */
export function updateOutputGain(
  nodes: AudioPipelineNodes,
  volume: number
): void {
  nodes.outputGain.gain.value = volume * DEFAULT_PIPELINE_CONFIG.outputGain;
}

/**
 * Disconnects and cleans up audio pipeline
 */
export function cleanupAudioPipeline(nodes: Partial<AudioPipelineNodes>): void {
  // Stop destination stream tracks before disconnecting nodes
  if (nodes.destination) {
    nodes.destination.stream.getTracks().forEach((track) => track.stop());
  }

  Object.values(nodes).forEach((node) => {
    if (node && 'disconnect' in node) {
      node.disconnect();
    }
  });
}
