// Voice Service Constants

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export const VAD_CONFIG = {
  FFT_SIZE: 256,
  SMOOTHING: 0.5,
  SPEAKING_THRESHOLD: 30,
  ACTIVATE_THRESHOLD: 2, // frames above threshold to open gate (~32ms)
  DEACTIVATE_THRESHOLD: 15 // frames below threshold to close gate (~240ms)
} as const;

// VAD threshold calculation constants
export const VAD_SENSITIVITY = {
  MIN_THRESHOLD: 2, // Most sensitive (1.0 sensitivity)
  MAX_THRESHOLD: 15, // Least sensitive (0.0 sensitivity)
  DEFAULT_THRESHOLD: 8 // Default at 0.21 sensitivity
} as const;
