// Video & Screen Share Manager for Voice Calls
import { useVoiceStore } from '../../store/voiceStore';
import { logger } from '../../utils/logger';
import { getVideoConstraints } from '../../utils/videoQuality';
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

    // Get video constraints based on user's quality preference
    const videoConstraints = getVideoConstraints();

    // Get video stream
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints
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
    }
  } catch (error) {
    logger.error('❌ Failed to enable video:', error);
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

    // Use standard getDisplayMedia for both web and Electron.
    // In Electron, the main process handles source selection via
    // session.setDisplayMediaRequestHandler + desktopCapturer.
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
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
    }
  } catch (error) {
    logger.error('❌ Failed to start screen share:', error);
    // User cancelled - this is normal, don't throw error
    if ((error as Error).name === 'NotAllowedError') {
      logger.log('Screen share permission denied by user');
      return;
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
    // Check displaySurface first, then label keywords to identify screen share tracks
    const label = track.label.toLowerCase();
    const settings = track.getSettings();
    const isScreenTrack =
      settings.displaySurface ||
      label.includes('screen') ||
      label.includes('monitor') ||
      label.includes('display');

    if (isScreenTrack) {
      track.stop();
      audioState.localStream!.removeTrack(track);
    }
  });

  store.setScreenSharing(false);
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

/**
 * Change video quality during a call
 * Restarts video with new quality settings
 */
export async function changeVideoQuality(
  audioState: AudioPipelineState
): Promise<void> {
  const store = useVoiceStore.getState();

  // Only change quality if video is currently enabled
  if (!store.isVideoEnabled) {
    logger.info('Video not enabled, skipping quality change');
    return;
  }

  try {
    logger.info('Changing video quality...');

    // Disable current video
    disableVideo(audioState);

    // Wait a bit for tracks to stop
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-enable with new quality
    await enableVideo(audioState);

    logger.info('✅ Video quality changed successfully');
  } catch (error) {
    logger.error('❌ Failed to change video quality:', error);
    // Try to restore video with any quality
    try {
      await enableVideo(audioState);
    } catch (restoreError) {
      logger.error('❌ Failed to restore video:', restoreError);
    }
  }
}
