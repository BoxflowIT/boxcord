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

    console.log('🖥️ Starting screen share...');

    // Get display media stream
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor'
      } as MediaTrackConstraints,
      audio: false // Don't capture system audio for now
    });

    console.log('✅ Got screen stream:', {
      id: screenStream.id,
      tracks: screenStream.getTracks().map((t) => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState
      }))
    });

    // Note: We keep existing camera video tracks
    // Screen share is added as an additional video track
    // SimplePeer will handle multiple video tracks

    // Add screen share tracks
    const screenTracks = screenStream.getVideoTracks();
    if (audioState.localStream && screenTracks.length > 0) {
      console.log('➕ Adding screen tracks to localStream');
      const beforeTracks = audioState.localStream.getTracks().length;

      screenTracks.forEach((track) => {
        audioState.localStream!.addTrack(track);
        console.log('  - Added track:', track.label, track.getSettings());

        // Handle screen share stop event (when user clicks "Stop sharing" in browser)
        track.onended = () => {
          console.log('🛑 Screen share ended by user');
          stopScreenShare(audioState);
        };
      });

      const afterTracks = audioState.localStream.getTracks().length;
      console.log(`📊 LocalStream tracks: ${beforeTracks} → ${afterTracks}`);
      console.log(
        '📹 All tracks:',
        audioState.localStream.getTracks().map((t) => ({
          kind: t.kind,
          label: t.label,
          displaySurface: t.getSettings().displaySurface
        }))
      );

      // Note: SimplePeer will automatically handle track renegotiation

      store.setScreenSharing(true);
      console.log('✅ Screen sharing started, state updated');
    } else {
      console.error('❌ No localStream or no screen tracks');
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

  console.log('🛑 Stopping screen share...');
  const beforeTracks = audioState.localStream.getTracks().length;

  // Stop and remove ONLY screen share tracks (keep camera video if enabled)
  const videoTracks = audioState.localStream.getVideoTracks();
  console.log(
    '📹 Current video tracks:',
    videoTracks.map((t) => ({
      label: t.label,
      displaySurface: t.getSettings().displaySurface
    }))
  );

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
      console.log('  - Stopping screen track:', track.label);
      track.stop();
      audioState.localStream!.removeTrack(track);
    }
  });

  const afterTracks = audioState.localStream.getTracks().length;
  console.log(`📊 LocalStream tracks: ${beforeTracks} → ${afterTracks}`);

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
