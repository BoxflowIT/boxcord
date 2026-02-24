/**
 * Audio Device Management Hook
 * Handles enumeration and selection of audio input/output devices
 */

import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface UseAudioDevicesReturn {
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  isLoading: boolean;
  error: Error | null;
  refreshDevices: () => Promise<void>;
}

export function useAudioDevices(): UseAudioDevicesReturn {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
          kind: d.kind as MediaDeviceKind
        }));

      const outputs = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`,
          kind: d.kind as MediaDeviceKind
        }));

      setInputDevices(inputs);
      setOutputDevices(outputs);
    } catch (err) {
      logger.error('Failed to load audio devices:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
    };
  }, []);

  return {
    inputDevices,
    outputDevices,
    isLoading,
    error,
    refreshDevices: loadDevices
  };
}
