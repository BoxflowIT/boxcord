/**
 * Voice & Audio Settings Tab
 * Refactored to use custom hooks and sub-components for better code organization
 */

import { useEffect, useState } from 'react';
import { useAudioSettingsStore } from '../../store/audioSettingsStore';
import { useAudioDevices } from '../../hooks/useAudioDevices';
import { useMicTest } from '../../hooks/useMicTest';
import { initializeRNNoise } from '../../utils/rnnoise';
import DeviceSelector from './voice/DeviceSelector';
import VolumeSlider from './voice/VolumeSlider';
import MicTest from './voice/MicTest';
import AudioQualityToggles from './voice/AudioQualityToggles';

export default function VoiceAudioTab() {
  const [rnnoiseReady, setRnnoiseReady] = useState(false);

  // Audio settings from store
  const {
    inputDeviceId,
    outputDeviceId,
    echoCancellation,
    noiseSuppression,
    autoGainControl,
    useRNNoise,
    inputVolume,
    outputVolume,
    inputSensitivity,
    isTesting,
    setInputDevice,
    setOutputDevice,
    setEchoCancellation,
    setNoiseSuppression,
    setAutoGainControl,
    setUseRNNoise,
    setInputVolume,
    setOutputVolume,
    setInputSensitivity
  } = useAudioSettingsStore();

  // Custom hooks for device management and mic testing
  const {
    inputDevices,
    outputDevices,
    isLoading: isLoadingDevices
  } = useAudioDevices();
  const micTest = useMicTest(rnnoiseReady);

  // Initialize RNNoise AI on component mount
  useEffect(() => {
    initializeRNNoise()
      .then(() => {
        console.log('✅ RNNoise AI initialized');
        setRnnoiseReady(true);
      })
      .catch((err) => {
        console.error('❌ RNNoise initialization failed:', err);
        setRnnoiseReady(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Input Device Selection */}
      <DeviceSelector
        label="Input Device (Microphone)"
        devices={inputDevices}
        selectedDeviceId={inputDeviceId}
        onSelect={setInputDevice}
        disabled={isLoadingDevices}
      />

      {/* Microphone Test with Level Meter */}
      <MicTest micTest={micTest} />

      {/* Input Volume Control */}
      <VolumeSlider
        label="Input Volume"
        value={inputVolume}
        onChange={setInputVolume}
      />

      {/* Input Sensitivity Control (VAD Gate) */}
      <div>
        <VolumeSlider
          label="Input Sensitivity"
          value={inputSensitivity}
          onChange={setInputSensitivity}
        />
        <p className="text-xs text-gray-400 mt-1">
          🎯 Controls Voice Activity Detection (VAD) gate in voice calls
          <br />
          Lower = Opens only for loud sounds (less sensitive) • Higher = Opens
          for quiet sounds (more sensitive)
        </p>
      </div>

      {/* Output Device Selection */}
      <DeviceSelector
        label="Output Device (Speaker/Headphones)"
        devices={outputDevices}
        selectedDeviceId={outputDeviceId}
        onSelect={setOutputDevice}
        disabled={isLoadingDevices}
      />

      {/* Output Volume Control */}
      <VolumeSlider
        label="Output Volume"
        value={outputVolume}
        onChange={setOutputVolume}
      />

      {/* Audio Quality Settings & Toggles */}
      <AudioQualityToggles
        echoCancellation={echoCancellation}
        noiseSuppression={noiseSuppression}
        autoGainControl={autoGainControl}
        useRNNoise={useRNNoise}
        rnnoiseReady={rnnoiseReady}
        isTesting={isTesting}
        onEchoCancellationChange={setEchoCancellation}
        onNoiseSuppressionChange={setNoiseSuppression}
        onAutoGainControlChange={setAutoGainControl}
        onUseRNNoiseChange={setUseRNNoise}
      />
    </div>
  );
}
