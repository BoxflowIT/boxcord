// Audio Stream Management
import { useVoiceStore } from '../../store/voiceStore';
import { useAudioSettingsStore } from '../../store/audioSettingsStore';

/**
 * Play a remote audio stream from a peer with volume control
 */
export function playRemoteStream(stream: MediaStream, userId: string): void {
  const elementId = `voice-audio-${userId}`;
  let audioElement = document.getElementById(elementId) as HTMLAudioElement;

  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.id = elementId;
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);
  }

  audioElement.srcObject = stream;
  audioElement.muted = useVoiceStore.getState().isDeafened;

  // Apply per-user volume (default to 1.0 if not set)
  const userVolume = useAudioSettingsStore.getState().getUserVolume(userId);
  audioElement.volume = userVolume;
}

/**
 * Update volume for a specific user
 */
export function setUserVolume(userId: string, volume: number): void {
  const audioElement = document.getElementById(
    `voice-audio-${userId}`
  ) as HTMLAudioElement;

  if (audioElement) {
    audioElement.volume = Math.max(0, Math.min(1, volume));
  }

  // Save to store
  useAudioSettingsStore.getState().setUserVolume(userId, volume);
}

/**
 * Mute or unmute all peer audio elements
 */
export function muteAllPeers(muted: boolean): void {
  useVoiceStore.getState().users.forEach((user) => {
    const audioElement = document.getElementById(
      `voice-audio-${user.userId}`
    ) as HTMLAudioElement;
    if (audioElement) {
      audioElement.muted = muted;
    }
  });
}

/**
 * Cleanup audio element for a single peer (call when user leaves)
 */
export function cleanupPeerAudioElement(userId: string): void {
  const el = document.getElementById(
    `voice-audio-${userId}`
  ) as HTMLAudioElement | null;
  if (el) {
    el.srcObject = null;
    el.remove();
  }
}

/**
 * Cleanup all peer audio elements
 */
export function cleanupPeerAudio(): void {
  const store = useVoiceStore.getState();

  store.users.forEach((user) => {
    cleanupPeerAudioElement(user.userId);
  });

  // Also remove any orphaned voice-audio elements
  document.querySelectorAll('audio[id^="voice-audio-"]').forEach((el) => {
    (el as HTMLAudioElement).srcObject = null;
    el.remove();
  });
}
