// Notification Sound Service - Discord-style notification
import { logger } from './logger';

export type NotificationSoundType =
  | 'default'
  | 'subtle'
  | 'ping'
  | 'chime'
  | 'bell';

let audioContext: AudioContext | null = null;
let soundEnabled = true;
let currentSoundType: NotificationSoundType = 'default';

// Initialize AudioContext (lazy)
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    )();
  }
  return audioContext;
}

// Sound generators for different notification types
const SOUND_GENERATORS: Record<
  NotificationSoundType,
  (
    ctx: AudioContext,
    oscillator: OscillatorNode,
    gainNode: GainNode,
    time: number
  ) => void
> = {
  default: (_ctx, osc, gain, time) => {
    // Discord-like: quick two-tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, time);
    osc.frequency.setValueAtTime(700, time + 0.05);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.08);
    gain.gain.linearRampToValueAtTime(0, time + 0.15);
  },
  subtle: (_ctx, osc, gain, time) => {
    // Soft single tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
    gain.gain.linearRampToValueAtTime(0, time + 0.1);
  },
  ping: (_ctx, osc, gain, time) => {
    // Sharp quick ping
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
  },
  chime: (_ctx, osc, gain, time) => {
    // Melodic three-tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, time); // C5
    osc.frequency.setValueAtTime(659, time + 0.06); // E5
    osc.frequency.setValueAtTime(784, time + 0.12); // G5
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.06);
    gain.gain.linearRampToValueAtTime(0.16, time + 0.12);
    gain.gain.linearRampToValueAtTime(0, time + 0.25);
  },
  bell: (_ctx, osc, gain, time) => {
    // Classic bell sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  }
};

// Generate notification sound using Web Audio API
async function playNotificationSound() {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Create oscillator for the notification sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Apply sound generator for selected type
    const generator = SOUND_GENERATORS[currentSoundType];
    const startTime = ctx.currentTime;
    generator(ctx, oscillator, gainNode, startTime);

    // Calculate duration based on sound type
    const durations: Record<NotificationSoundType, number> = {
      default: 0.15,
      subtle: 0.1,
      ping: 0.08,
      chime: 0.25,
      bell: 0.2
    };
    const duration = durations[currentSoundType];

    // Play sound
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  } catch (error) {
    logger.error('Failed to play notification sound:', error);
  }
}

// Toggle sound on/off
export function toggleNotificationSound(enabled: boolean) {
  soundEnabled = enabled;
}

// Check if sound is enabled
export function isNotificationSoundEnabled(): boolean {
  return soundEnabled;
}

// Play notification sound
export function playMessageNotification() {
  playNotificationSound();
}

// Set notification sound type
export function setNotificationSoundType(type: NotificationSoundType) {
  currentSoundType = type;
}

// Get current notification sound type
export function getNotificationSoundType(): NotificationSoundType {
  return currentSoundType;
}

// Preview a specific sound type
export async function previewNotificationSound(type: NotificationSoundType) {
  const originalType = currentSoundType;
  const originalEnabled = soundEnabled;

  currentSoundType = type;
  soundEnabled = true;

  await playNotificationSound();

  currentSoundType = originalType;
  soundEnabled = originalEnabled;
}
