// Notification Sound Service - Discord-style notification
let audioContext: AudioContext | null = null;
let soundEnabled = true;

// Initialize AudioContext (lazy)
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Generate Discord-like notification sound using Web Audio API
async function playNotificationSound() {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    
    // Create oscillator for the notification sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Discord-like sound: quick two-tone notification
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, ctx.currentTime); // First tone
    oscillator.frequency.setValueAtTime(700, ctx.currentTime + 0.05); // Second tone (higher)
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01); // Quick fade in
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15); // Fade out
    
    // Play sound
    const startTime = ctx.currentTime;
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.15); // 150ms duration
    
  } catch (error) {
    console.error('Failed to play notification sound:', error);
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
