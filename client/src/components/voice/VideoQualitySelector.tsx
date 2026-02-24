/**
 * Video Quality Selector
 * Allows changing video quality during active calls
 */

import { useState, useEffect } from 'react';
import { cn } from '../../utils/classNames';
import {
  getVideoQuality,
  setVideoQuality,
  getQualityLabel,
  getAllQualities,
  type VideoQuality
} from '../../utils/videoQuality';

interface VideoQualitySelectorProps {
  onQualityChange?: (quality: VideoQuality) => void;
  showLabel?: boolean;
  compact?: boolean;
}

export default function VideoQualitySelector({
  onQualityChange,
  showLabel = true,
  compact = false
}: VideoQualitySelectorProps) {
  const [currentQuality, setCurrentQuality] =
    useState<VideoQuality>(getVideoQuality());
  const [isOpen, setIsOpen] = useState(false);

  // Listen for external quality changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentQuality(getVideoQuality());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleQualityChange = (quality: VideoQuality) => {
    setCurrentQuality(quality);
    setVideoQuality(quality);
    setIsOpen(false);

    // Notify parent component
    if (onQualityChange) {
      onQualityChange(quality);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1 bg-black/70 hover:bg-black/90 text-white text-xs rounded backdrop-blur-sm transition-colors flex items-center gap-1"
          title="Video Quality"
        >
          📹 {getQualityLabel(currentQuality)}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full right-0 mt-1 bg-boxflow-darkest border border-boxflow-hover rounded-lg shadow-lg z-50 min-w-[180px]">
              {getAllQualities().map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg',
                    currentQuality === quality
                      ? 'bg-boxflow-accent text-white'
                      : 'text-gray-300 hover:bg-boxflow-hover'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{quality}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {getQualityLabel(quality)}
                    </span>
                    {currentQuality === quality && (
                      <span className="text-green-400 ml-2">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode with label
  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-300">
          📹 Video Quality
        </label>
      )}

      <div className="space-y-2">
        {getAllQualities().map((quality) => (
          <button
            key={quality}
            onClick={() => handleQualityChange(quality)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition-colors',
              currentQuality === quality
                ? 'bg-boxflow-hover border-boxflow-accent text-white'
                : 'bg-boxflow-darkest border-boxflow-hover text-gray-300 hover:bg-boxflow-hover/50'
            )}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium capitalize">{quality}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {getQualityLabel(quality)}
                </span>
              </div>
              {currentQuality === quality && (
                <span className="text-green-400">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        💡 Higher quality uses more bandwidth. Changes apply immediately.
      </p>
    </div>
  );
}
