// Video & Screen Share Manager for Voice Calls
import { useVoiceStore } from '../../store/voiceStore';
import type { AudioPipelineState } from './types';

/**
 * Enable video for the voice call
 * Adds video track to existing audio stream
 */
export async function enableVideo(
  audioState: AudioPipelineState
): Promise<void> {
  try {
    const store = useVoiceStore.getState();

    // Get video stream
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    });

    // Add video tracks to local stream
    const videoTracks = videoStream.getVideoTracks();
    if (audioState.localStream && videoTracks.length > 0) {
      videoTracks.forEach((track) => {
        audioState.localStream!.addTrack(track);
      });

      // Note: SimplePeer will automatically handle track renegotiation
      // The remote peer will see the new track when they receive the signal

      store.setVideoEnabled(true);
      console.log('✅ Video enabled');
    }
  } catch (error) {
    console.error('❌ Failed to enable video:', error);
    throw new Error(
      'Could not access camera. Please check camera permissions.'
    );
  }
}

/**
 * Disable video for the voice call
 * Removes video tracks from stream
 */
export function disableVideo(audioState: AudioPipelineState): void {
  const store = useVoiceStore.getState();

  if (!audioState.localStream) return;

  // Stop and remove video tracks
  const videoTracks = audioState.localStream.getVideoTracks();
  videoTracks.forEach((track) => {
    track.stop();
    audioState.localStream!.removeTrack(track);
  });

  // Note: SimplePeer will automatically handle track removal via renegotiation

  store.setVideoEnabled(false);
  console.log('✅ Video disabled');
}

/**
 * Start screen sharing
 * Replaces video tracks with display media
 */
export async function startScreenShare(
  audioState: AudioPipelineState
): Promise<void> {
  try {
    const store = useVoiceStore.getState();

    // Get display media stream
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor'
      } as MediaTrackConstraints,
      audio: false // Don't capture system audio for now
    });

    // Note: We keep existing camera video tracks
    // Screen share is added as an additional video track
    // SimplePeer will handle multiple video tracks

    // Add screen share tracks
    const screenTracks = screenStream.getVideoTracks();
    if (audioState.localStream && screenTracks.length > 0) {
      screenTracks.forEach((track) => {
        audioState.localStream!.addTrack(track);

        // Handle screen share stop event (when user clicks "Stop sharing" in browser)
        track.onended = () => {
          stopScreenShare(audioState);
        };
      });

      // Note: SimplePeer will automatically handle track renegotiation

      store.setScreenSharing(true);
      console.log('✅ Screen sharing started');
    }
  } catch (error) {
    console.error('❌ Failed to start screen share:', error);
    // User probably cancelled
    if ((error as Error).name === 'NotAllowedError') {
      throw new Error('Screen share permission denied');
    }
    throw new Error('Could not start screen sharing');
  }
}

/**
 * Stop screen sharing
 * Removes display media tracks
 */
export function stopScreenShare(audioState: AudioPipelineState): void {
  const store = useVoiceStore.getState();

  if (!audioState.localStream) return;

  // Stop and remove ONLY screen share tracks (keep camera video if enabled)
  const videoTracks = audioState.localStream.getVideoTracks();
  videoTracks.forEach((track) => {
    // Only stop display surface tracks (screen share), not camera tracks
    const settings = track.getSettings();
    if (settings.displaySurface) {
      track.stop();
      audioState.localStream!.removeTrack(track);
    }
  });

  store.setScreenSharing(false);
  console.log('✅ Screen sharing stopped');
}

/**
 * Toggle video on/off
 */
export async function toggleVideo(
  audioState: AudioPipelineState
): Promise<void> {
  const store = useVoiceStore.getState();

  if (store.isVideoEnabled) {
    disableVideo(audioState);
  } else {
    await enableVideo(audioState);
  }
}

/**
 * Toggle screen share on/off
 */
export async function toggleScreenShare(
  audioState: AudioPipelineState
): Promise<void> {
  const store = useVoiceStore.getState();

  if (store.isScreenSharing) {
    stopScreenShare(audioState);
  } else {
    await startScreenShare(audioState);
  }
}
