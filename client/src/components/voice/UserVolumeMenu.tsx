/**
 * User Volume Context Menu
 * Right-click menu to adjust individual user volume (0-200%)
 */
import { useState, useEffect } from 'react';
import { useAudioSettingsStore } from '../../store/audioSettingsStore';
import { setUserVolume } from '../../services/voice/audioManager';
import { VolumeIcon, VolumeLowIcon, VolumeMutedIcon } from '../ui/Icons';

interface UserVolumeMenuProps {
  userId: string;
  displayName: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function UserVolumeMenu({
  userId,
  displayName,
  position,
  onClose
}: UserVolumeMenuProps) {
  const getUserVolume = useAudioSettingsStore((state) => state.getUserVolume);
  const [volume, setVolume] = useState(getUserVolume(userId));

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-volume-menu')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setUserVolume(userId, newVolume);
  };

  const volumePercent = Math.round(volume * 100);

  // Get volume icon
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeMutedIcon size="sm" />;
    if (volume < 0.5) return <VolumeLowIcon size="sm" />;
    return <VolumeIcon size="sm" />;
  };

  return (
    <div
      className="user-volume-menu fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[280px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {getVolumeIcon()}
        <h3 className="text-sm font-medium text-white">User Volume</h3>
      </div>

      {/* User name */}
      <p className="text-xs text-gray-400 mb-3 truncate">{displayName}</p>

      {/* Volume slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Volume</span>
          <span className="text-xs font-medium text-white">
            {volumePercent}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => {
          setVolume(1.0);
          setUserVolume(userId, 1.0);
        }}
        className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors"
      >
        Reset to 100%
      </button>

      {/* Info */}
      <p className="text-xs text-gray-500 mt-3">
        💡 Adjust this user's volume without affecting others. Changes are saved
        automatically.
      </p>
    </div>
  );
}
