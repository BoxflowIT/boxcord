// Audio Stream Management
import { useVoiceStore } from '../../store/voiceStore';

/**
 * Play a remote audio stream from a peer
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
 * Cleanup all peer audio elements
 */
export function cleanupPeerAudio(): void {
  const store = useVoiceStore.getState();

  store.users.forEach((user) => {
    document.getElementById(`voice-audio-${user.userId}`)?.remove();
  });
}
