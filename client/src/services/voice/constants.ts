// Voice Service Constants

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Metered.ca free TURN servers (relay for NAT/firewall traversal)
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: 'open',
    credential: 'open'
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: 'open',
    credential: 'open'
  },
  {
    urls: 'turn:a.relay.metered.ca:443?transport=tcp',
    username: 'open',
    credential: 'open'
  }
];

export const PEER_RECONNECT = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000, // 1s, 2s, 4s exponential backoff
  ICE_QUEUE_TIMEOUT_MS: 5000 // Drop queued candidates after 5s
} as const;

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
