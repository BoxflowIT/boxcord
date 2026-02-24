/**
 * Video Quality Utilities
 * Manages video quality settings across the application
 */

export type VideoQuality = 'low' | 'medium' | 'high';

export interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  frameRate: { ideal: number };
}

const QUALITY_CONSTRAINTS: Record<VideoQuality, VideoConstraints> = {
  low: {
    width: { ideal: 320 },
    height: { ideal: 240 },
    frameRate: { ideal: 24 }
  },
  medium: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 }
  },
  high: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};

const QUALITY_LABELS: Record<VideoQuality, string> = {
  low: '320x240 @ 24fps',
  medium: '640x480 @ 24fps',
  high: '1280x720 @ 30fps'
};

/**
 * Get current video quality from localStorage
 */
export function getVideoQuality(): VideoQuality {
  const saved = localStorage.getItem('video-quality');
  return (saved as VideoQuality) || 'medium';
}

/**
 * Save video quality to localStorage
 */
export function setVideoQuality(quality: VideoQuality): void {
  localStorage.setItem('video-quality', quality);
}

/**
 * Get video constraints for current quality setting
 */
export function getVideoConstraints(quality?: VideoQuality): VideoConstraints {
  const currentQuality = quality || getVideoQuality();
  return QUALITY_CONSTRAINTS[currentQuality];
}

/**
 * Get label for quality setting
 */
export function getQualityLabel(quality: VideoQuality): string {
  return QUALITY_LABELS[quality];
}

/**
 * Get all quality options
 */
export function getAllQualities(): VideoQuality[] {
  return ['low', 'medium', 'high'];
}
