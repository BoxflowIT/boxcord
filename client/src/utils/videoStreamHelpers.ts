// Video Stream Helper Functions
// Utilities for managing video tracks and streams in voice components

import { logger } from './logger';

interface TrackFilter {
  isScreenShare: boolean;
}

/**
 * Finds the appropriate video track from a MediaStream
 * @param stream - The MediaStream containing video tracks
 * @param filter - Filter criteria for track selection
 * @returns The matching video track or null
 */
export function findVideoTrack(
  stream: MediaStream,
  filter: TrackFilter
): MediaStreamTrack | null {
  const videoTracks = stream.getVideoTracks();

  if (videoTracks.length === 0) {
    return null;
  }

  if (filter.isScreenShare) {
    // Find screen share track
    return (
      videoTracks.find((track) => {
        const settings = track.getSettings();
        return (
          settings.displaySurface ||
          track.label.toLowerCase().includes('screen') ||
          track.label.toLowerCase().includes('monitor')
        );
      }) || videoTracks[videoTracks.length - 1]
    ); // Fallback to last track
  } else {
    // Find camera track (not screen share)
    return (
      videoTracks.find((track) => {
        const settings = track.getSettings();
        const isScreenTrack =
          settings.displaySurface ||
          track.label.toLowerCase().includes('screen') ||
          track.label.toLowerCase().includes('monitor');
        return !isScreenTrack;
      }) || videoTracks[0]
    ); // Fallback to first track
  }
}

/**
 * Sets up a video element with the appropriate track from a stream
 * @param element - The video HTMLElement to set up
 * @param stream - The source MediaStream
 * @param isScreenShare - Whether to use screen share or camera track
 * @returns Promise that resolves when video is ready to play
 */
export async function setupVideoElement(
  element: HTMLVideoElement,
  stream: MediaStream,
  isScreenShare: boolean
): Promise<void> {
  const track = findVideoTrack(stream, { isScreenShare });

  if (!track) {
    throw new Error('No suitable video track found');
  }

  const singleTrackStream = new MediaStream([track]);
  element.srcObject = singleTrackStream;

  try {
    await element.play();
  } catch (error) {
    logger.error('Video play error:', error);
    throw error;
  }
}

/**
 * Clears video element source
 * @param element - The video element to clear
 */
export function clearVideoElement(element: HTMLVideoElement | null): void {
  if (element) {
    element.srcObject = null;
  }
}
