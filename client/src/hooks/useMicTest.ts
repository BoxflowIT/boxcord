/**
 * Microphone Test Hook
 * Manages mic test state, audio processing, and level monitoring
 */

import { useState, useRef, useEffect } from 'react';
import { useAudioSettingsStore } from '../store/audioSettingsStore';
import {
  createAudioPipeline,
  updateOutputGain,
  cleanupAudioPipeline,
  AudioPipelineNodes
} from '../utils/audioPipeline';
import { applyRNNoise, cleanupRNNoise } from '../utils/rnnoise';

export interface UseMicTestReturn {
  isTesting: boolean;
  micLevel: number;
  isMonitoring: boolean;
  startTest: () => Promise<void>;
  stopTest: () => void;
  toggleTest: () => void;
  toggleMonitoring: () => void;
}

export function useMicTest(rnnoiseReady: boolean): UseMicTestReturn {
  const [micLevel, setMicLevel] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const originalStreamRef = useRef<MediaStream | null>(null); // Track original stream for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pipelineRef = useRef<AudioPipelineNodes | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    inputDeviceId,
    echoCancellation,
    noiseSuppression,
    autoGainControl,
    useRNNoise,
    inputVolume,
    outputVolume,
    // Note: inputSensitivity not used here - only affects VAD in voice calls
    isTesting,
    setIsTesting
  } = useAudioSettingsStore();

  const startTest = async () => {
    try {
      setIsTesting(true);

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: inputDeviceId ? { exact: inputDeviceId } : undefined,
          echoCancellation,
          // IMPORTANT: Disable browser native noise suppression when using RNNoise
          // to avoid conflicts and let RNNoise AI handle all noise removal
          noiseSuppression:
            useRNNoise && rnnoiseReady ? false : noiseSuppression,
          autoGainControl,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 }
        }
      };

      console.log('🎤 Starting mic test:', constraints.audio);
      streamRef.current =
        await navigator.mediaDevices.getUserMedia(constraints);

      // Log applied settings
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log('✅ Applied audio settings:', {
          sampleRate: settings.sampleRate,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          channelCount: settings.channelCount
        });
      }

      // Apply RNNoise if enabled
      if (useRNNoise && rnnoiseReady) {
        console.log(
          '🤖 Applying RNNoise AI (browser noise suppression OFF)...'
        );
        originalStreamRef.current = streamRef.current; // Save original stream reference
        try {
          audioContextRef.current = new AudioContext();
          streamRef.current = await applyRNNoise(
            originalStreamRef.current,
            audioContextRef.current
          );
          console.log(
            '✅ RNNoise active - AI processing audio, browser suppression disabled'
          );
        } catch (error) {
          console.error('❌ RNNoise failed, using original stream:', error);
          streamRef.current = originalStreamRef.current;
          originalStreamRef.current = null;
          audioContextRef.current = new AudioContext();
        }
      } else {
        originalStreamRef.current = null; // No RNNoise, no need to track original
        audioContextRef.current = new AudioContext();
        if (useRNNoise && !rnnoiseReady) {
          console.warn('⚠️ RNNoise enabled but not ready yet');
        } else {
          console.log('ℹ️ Using browser native noise suppression');
        }
      }

      // Create analyser for level monitoring
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Create audio processing pipeline
      pipelineRef.current = createAudioPipeline(
        audioContextRef.current,
        streamRef.current,
        {
          outputGain: inputVolume * 2.0
          // Note: inputSensitivity not passed - only affects VAD in voice calls
        }
      );

      // IMPORTANT: Keep VAD gate OPEN for mic test (we want to always hear ourselves)
      // VAD is only used for voice calls to save bandwidth
      pipelineRef.current.vadGate.gain.value = 1.0;

      // Connect to analyser
      pipelineRef.current.outputGain.connect(analyserRef.current);

      // Setup monitoring (loopback)
      monitorGainRef.current = audioContextRef.current.createGain();
      monitorGainRef.current.gain.value = isMonitoring ? outputVolume * 0.6 : 0;
      analyserRef.current.connect(monitorGainRef.current);
      monitorGainRef.current.connect(audioContextRef.current.destination);

      // Start level monitoring
      updateMicLevel();
    } catch (error) {
      console.error('Failed to start mic test:', error);
      setIsTesting(false);
      throw error;
    }
  };

  const stopTest = () => {
    setIsTesting(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop processed stream
    if (streamRef.current) {
      if (useRNNoise) {
        cleanupRNNoise(streamRef.current);
      }
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop original stream if RNNoise was used
    if (originalStreamRef.current) {
      originalStreamRef.current.getTracks().forEach((track) => track.stop());
      originalStreamRef.current = null;
    }

    if (pipelineRef.current) {
      cleanupAudioPipeline(pipelineRef.current);
      pipelineRef.current = null;
    }

    // Close audio context after a short delay to prevent race conditions
    if (audioContextRef.current) {
      const contextToClose = audioContextRef.current;
      setTimeout(() => {
        if (contextToClose.state !== 'closed') {
          contextToClose.close();
        }
      }, 100);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    monitorGainRef.current = null;
    setMicLevel(0);
  };

  const updateMicLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);

    setMicLevel(normalizedLevel);

    // NOTE: No VAD for mic test - we want to always hear ourselves
    // VAD is only used in actual voice calls (see voice.service.ts)

    animationFrameRef.current = requestAnimationFrame(updateMicLevel);
  };

  const toggleTest = () => {
    if (isTesting) {
      stopTest();
    } else {
      startTest();
    }
  };

  const toggleMonitoring = () => {
    const newState = !isMonitoring;
    setIsMonitoring(newState);

    if (monitorGainRef.current) {
      monitorGainRef.current.gain.value = newState ? outputVolume * 0.6 : 0;
    }
  };

  // Update gains when volumes change
  useEffect(() => {
    if (pipelineRef.current && isTesting) {
      updateOutputGain(pipelineRef.current, inputVolume);
    }
  }, [inputVolume, isTesting]);

  useEffect(() => {
    if (monitorGainRef.current && isMonitoring) {
      monitorGainRef.current.gain.value = outputVolume * 0.6;
    }
  }, [outputVolume, isMonitoring]);

  // Restart test when settings change
  useEffect(() => {
    if (isTesting) {
      console.log('🔄 Restarting mic test with new settings');
      stopTest();
      setTimeout(() => startTest(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    echoCancellation,
    noiseSuppression,
    autoGainControl,
    useRNNoise,
    inputDeviceId
    // Note: inputSensitivity NOT included - it only affects VAD in voice calls
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTest();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isTesting,
    micLevel,
    isMonitoring,
    startTest,
    stopTest,
    toggleTest,
    toggleMonitoring
  };
}
