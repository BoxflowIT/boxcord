// Voice channel sound effects using Web Audio API

// Create audio context
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioContext: AudioContext | null = null;

// Initialize audio context on first use
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Generate a rising "join" tone (E5 -> A5)
function generateJoinSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Rising tone
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

    // Volume envelope: fade in quickly, fade out smoothly
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.type = 'sine';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.error('Failed to generate voice join sound:', err);
  }
}

// Generate a falling "leave" tone (A5 -> E5)
function generateLeaveSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Falling tone
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5

    // Volume envelope: fade in quickly, fade out smoothly
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

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
