// Audio Settings Store - Voice & Audio Configuration
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioSettings {
  // Device IDs
  inputDeviceId: string | null;
  outputDeviceId: string | null;

  // Audio Quality
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;

  // AI Noise Suppression
  useRNNoise: boolean; // Toggle for RNNoise AI

  // Volume levels (0-1)
  inputVolume: number;
  outputVolume: number;

  // Input sensitivity for noise gate (0-1, where 0=least sensitive, 1=most sensitive)
  inputSensitivity: number;

  // Testing state
  isTesting: boolean;
}

interface AudioSettingsStore extends AudioSettings {
  setInputDevice: (deviceId: string | null) => void;
  setOutputDevice: (deviceId: string | null) => void;
  setEchoCancellation: (enabled: boolean) => void;
  setNoiseSuppression: (enabled: boolean) => void;
  setAutoGainControl: (enabled: boolean) => void;
  setUseRNNoise: (enabled: boolean) => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  setInputSensitivity: (sensitivity: number) => void;
  setIsTesting: (testing: boolean) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: AudioSettings = {
  inputDeviceId: null, // null = default device
  outputDeviceId: null,
  echoCancellation: true,
  noiseSuppression: true,
  useRNNoise: true, // Enable AI noise suppression by default
  autoGainControl: true,
  inputVolume: 1.0, // 100% - user can adjust if too loud
  outputVolume: 1.0, // 100%
  inputSensitivity: 0.21, // 21% = OPTIMAL Discord-like (only voice, no background noise)
  isTesting: false
};

export const useAudioSettingsStore = create<AudioSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setInputDevice: (deviceId) => set({ inputDeviceId: deviceId }),
      setOutputDevice: (deviceId) => set({ outputDeviceId: deviceId }),
      setEchoCancellation: (enabled) => set({ echoCancellation: enabled }),
      setNoiseSuppression: (enabled) => set({ noiseSuppression: enabled }),
      setUseRNNoise: (enabled) => set({ useRNNoise: enabled }),
      setAutoGainControl: (enabled) => set({ autoGainControl: enabled }),
      setInputVolume: (volume) =>
        set({ inputVolume: Math.max(0, Math.min(1, volume)) }),
      setOutputVolume: (volume) =>
        set({ outputVolume: Math.max(0, Math.min(1, volume)) }),
      setInputSensitivity: (sensitivity) =>
        set({ inputSensitivity: Math.max(0, Math.min(1, sensitivity)) }),
      setIsTesting: (testing) => set({ isTesting: testing }),
      reset: () => set(DEFAULT_SETTINGS)
    }),
    {
      name: 'audio-settings'
    }
  )
);
