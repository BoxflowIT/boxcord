// RNNoise - AI-powered Noise Suppression
import {
  RnnoiseWorkletNode,
  loadRnnoise
} from '@sapphi-red/web-noise-suppressor';
import { logger } from './logger';

// These files are copied to public folder and served as static assets
const rnnoiseWasmPath = '/@sapphi-red/web-noise-suppressor/rnnoise.wasm';
const rnnoiseSimdWasmPath =
  '/@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm';
const rnnoiseWorkletPath =
  '/@sapphi-red/web-noise-suppressor/rnnoise/workletProcessor.js';

let rnnoiseWasmBinary: ArrayBuffer | null = null;
let isInitialized = false;
const workletAddedContexts = new WeakSet<AudioContext>();

/**
 * Initialize RNNoise processor - loads WASM binary
 */
export async function initializeRNNoise(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    rnnoiseWasmBinary = await loadRnnoise({
      url: rnnoiseWasmPath,
      simdUrl: rnnoiseSimdWasmPath
    });
    isInitialized = true;
  } catch (error) {
    logger.error('❌ Failed to load RNNoise:', error);
    isInitialized = false;
    throw error;
  }
}

/**
 * Apply RNNoise to a MediaStream
 * Returns a new MediaStream with AI-powered noise suppression
 * IMPORTANT: Stops original stream tracks to avoid conflicts
 */
export async function applyRNNoise(
  inputStream: MediaStream,
  audioContext: AudioContext
): Promise<MediaStream> {
  if (!isInitialized || !rnnoiseWasmBinary) {
    logger.warn('⚠️ RNNoise not initialized, using original stream');
    return inputStream;
  }

  try {
    // Add worklet module once per AudioContext
    if (!workletAddedContexts.has(audioContext)) {
      await audioContext.audioWorklet.addModule(rnnoiseWorkletPath);
      workletAddedContexts.add(audioContext);
    }

    // Create audio nodes
    const source = audioContext.createMediaStreamSource(inputStream);
    const destination = audioContext.createMediaStreamDestination();

    // Create RNNoise worklet
    const rnnoiseNode = new RnnoiseWorkletNode(audioContext, {
      maxChannels: 1, // Mono for voice
      wasmBinary: rnnoiseWasmBinary
    });

    // Connect: Input -> RNNoise AI -> Output
    source.connect(rnnoiseNode);
    rnnoiseNode.connect(destination);

    // NOTE: We keep the original stream running because the AudioWorklet needs it!
    // The processed stream (destination.stream) is what we use for output.
    // The original stream will be cleaned up when the MediaStreamSource is disconnected.

    return destination.stream;
  } catch (error) {
    logger.error('❌ Failed to apply RNNoise:', error);
    // Return original stream if RNNoise fails
    return inputStream;
  }
}

/**
 * Stop and cleanup RNNoise
 */
export function cleanupRNNoise(stream?: MediaStream): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * Check if RNNoise is available and initialized
 */
export function isRNNoiseAvailable(): boolean {
  return isInitialized && rnnoiseWasmBinary !== null;
}
