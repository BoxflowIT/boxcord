// Voice channel sound effects using Web Audio API
import { useAudioSettingsStore } from '../store/audioSettingsStore';

// Create audio context
const AudioContextClass: typeof AudioContext =
  window.AudioContext ||
  ((
    window as Window &
      typeof globalThis & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext as typeof AudioContext);
let audioContext: AudioContext | null = null;
let ringingInterval: number | null = null;

// Get sound effects volume from settings
function getSoundEffectsVolume(): number {
  return useAudioSettingsStore.getState().soundEffectsVolume;
}

// Initialize audio context on first use
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

// Generate a rising "join" tone (E5 -> A5)
async function generateJoinSound() {
  try {
    const ctx = getAudioContext();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Get user's sound effects volume setting
    const userVolume = getSoundEffectsVolume();

    // Rising tone
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    oscillator.frequency.exponentialRampToValueAtTime(
      880,
      ctx.currentTime + 0.1
    ); // A5

    // Volume envelope: fade in quickly, fade out smoothly (multiplied by user volume)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.15 * userVolume,
      ctx.currentTime + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01 * userVolume,
      ctx.currentTime + 0.15
    );

    oscillator.type = 'sine';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.error('Failed to generate voice join sound:', err);
  }
}

// Generate a falling "leave" tone (A5 -> E5)
async function generateLeaveSound() {
  try {
    const ctx = getAudioContext();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Get user's sound effects volume setting
    const userVolume = getSoundEffectsVolume();

    // Falling tone
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(
      659.25,
      ctx.currentTime + 0.1
    ); // E5

    // Volume envelope: fade in quickly, fade out smoothly (multiplied by user volume)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.15 * userVolume,
      ctx.currentTime + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01 * userVolume,
      ctx.currentTime + 0.15
    );

    oscillator.type = 'sine';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.error('Failed to generate voice leave sound:', err);
  }
}

// Play join sound
export function playVoiceJoinSound() {
  generateJoinSound();
}

// Play leave sound
export function playVoiceLeaveSound() {
  generateLeaveSound();
}

// Preload function (no-op, kept for API compatibility)
export function preloadVoiceSounds() {
  // Web Audio API generates sounds on demand, no preloading needed
}

// Generate a short ring tone (like phone ringing)
async function generateRingTone() {
  try {
    const ctx = getAudioContext();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Get user's sound effects volume setting
    const userVolume = getSoundEffectsVolume();

    // Two-tone ring (like a phone)
    oscillator1.frequency.value = 440; // A4
    oscillator2.frequency.value = 480; // Slightly higher for harmony
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Ring pattern: 0.4s on, 0.2s off (creates ring-ring effect)
    const duration = 0.4;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.12 * userVolume,
      ctx.currentTime + 0.05
    );
    gainNode.gain.setValueAtTime(0.12 * userVolume, ctx.currentTime + duration);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration + 0.05);

    oscillator1.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + duration + 0.05);
    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + duration + 0.05);
  } catch (err) {
    console.error('Failed to generate ring tone:', err);
  }
}

// Start ringing (plays ring tone repeatedly)
export async function startRingingSound() {
  stopRingingSound(); // Clear any existing interval

  // Play immediately
  await generateRingTone();

  // Then repeat every 1.5 seconds
  ringingInterval = window.setInterval(async () => {
    await generateRingTone();
  }, 1500);
}

// Stop ringing
export function stopRingingSound() {
  if (ringingInterval !== null) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
}
