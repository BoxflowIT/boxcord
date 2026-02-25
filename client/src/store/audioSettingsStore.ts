// Audio Settings Store - Voice & Audio Configuration
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioQualityPreset = 'low' | 'balanced' | 'high' | 'studio';

interface AudioSettings {
  // Device IDs
  inputDeviceId: string | null;
  outputDeviceId: string | null;

  // Audio Quality Preset
  audioQualityPreset: AudioQualityPreset;

  // Audio Quality
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;

  // AI Noise Suppression
  useRNNoise: boolean; // Toggle for RNNoise AI

  // Volume levels (0-1)
  inputVolume: number;
  outputVolume: number;
  soundEffectsVolume: number; // Volume for join/leave/ring sounds

  // Per-user volume control (userId -> volume 0-1)
  userVolumes: Record<string, number>;

  // Input sensitivity for noise gate (0-1, where 0=least sensitive, 1=most sensitive)
  inputSensitivity: number;

  // Testing state
  isTesting: boolean;
}

interface AudioSettingsStore extends AudioSettings {
  setInputDevice: (deviceId: string | null) => void;
  setOutputDevice: (deviceId: string | null) => void;
  setAudioQualityPreset: (preset: AudioQualityPreset) => void;
  setEchoCancellation: (enabled: boolean) => void;
  setNoiseSuppression: (enabled: boolean) => void;
  setAutoGainControl: (enabled: boolean) => void;
  setUseRNNoise: (enabled: boolean) => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  setSoundEffectsVolume: (volume: number) => void;
  setUserVolume: (userId: string, volume: number) => void;
  getUserVolume: (userId: string) => number;
  setInputSensitivity: (sensitivity: number) => void;
  setIsTesting: (testing: boolean) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: AudioSettings = {
  inputDeviceId: null, // null = default device
  outputDeviceId: null,
  audioQualityPreset: 'balanced', // Default to balanced for best experience
  echoCancellation: true,
  noiseSuppression: true,
  useRNNoise: false, // Disabled by default, enabled in 'high' and 'studio' presets
  autoGainControl: true,
  inputVolume: 1.0, // 100% - user can adjust if too loud
  outputVolume: 1.0, // 100%
  soundEffectsVolume: 0.5, // 50% - reasonable default for effects
  userVolumes: {}, // Empty by default, user sets per-person volumes
  inputSensitivity: 0.21, // 21% = OPTIMAL Discord-like (only voice, no background noise)
  isTesting: false
};

// Audio quality preset configurations
const PRESET_CONFIGS: Record<AudioQualityPreset, Partial<AudioSettings>> = {
  low: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    useRNNoise: false,
    inputSensitivity: 0.1 // More lenient
  },
  balanced: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    useRNNoise: false, // Browser-based only
    inputSensitivity: 0.21 // Optimal
  },
  high: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    useRNNoise: true, // Enable AI
    inputSensitivity: 0.21 // Optimal
  },
  studio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    useRNNoise: true, // Full AI processing
    inputSensitivity: 0.3 // Stricter noise gate
  }
};

export const useAudioSettingsStore = create<AudioSettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setInputDevice: (deviceId) => set({ inputDeviceId: deviceId }),
      setOutputDevice: (deviceId) => set({ outputDeviceId: deviceId }),
      setAudioQualityPreset: (preset) => {
        const config = PRESET_CONFIGS[preset];
        set({ audioQualityPreset: preset, ...config });
      },
      setEchoCancellation: (enabled) => set({ echoCancellation: enabled }),
      setNoiseSuppression: (enabled) => set({ noiseSuppression: enabled }),
      setUseRNNoise: (enabled) => set({ useRNNoise: enabled }),
      setAutoGainControl: (enabled) => set({ autoGainControl: enabled }),
      setInputVolume: (volume) =>
        set({ inputVolume: Math.max(0, Math.min(1, volume)) }),
      setOutputVolume: (volume) =>
        set({ outputVolume: Math.max(0, Math.min(1, volume)) }),
      setSoundEffectsVolume: (volume) =>
        set({ soundEffectsVolume: Math.max(0, Math.min(1, volume)) }),
      setUserVolume: (userId, volume) =>
        set((state) => ({
          userVolumes: {
            ...state.userVolumes,
            [userId]: Math.max(0, Math.min(2, volume)) // Allow up to 200%
          }
        })),
      getUserVolume: (userId: string): number => {
        const state = get();
        return state.userVolumes[userId] ?? 1.0; // Default to 100%
      },
      setInputSensitivity: (sensitivity: number) =>
        set({ inputSensitivity: Math.max(0, Math.min(1, sensitivity)) }),
      setIsTesting: (testing: boolean) => set({ isTesting: testing }),
      reset: () => set(DEFAULT_SETTINGS)
    }),
    {
      name: 'audio-settings'
    }
  )
);
