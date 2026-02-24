// Video Window Controls - Minimize, Maximize, PiP, Close buttons
// Used by FloatingVideoWindow

import { CloseIcon, MinimizeIcon, MaximizeIcon, PipIcon } from '../ui/Icons';
import VideoQualitySelector from './VideoQualitySelector';

interface VideoWindowControlsProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onPip?: () => void;
  onClose: () => void;
  isPipSupported?: boolean;
  isPipActive?: boolean;
  isVideoReady?: boolean;
  isVideoEnabled?: boolean;
  onQualityChange?: () => void;
}

export function VideoWindowControls({
  onMinimize,
  onMaximize,
  onPip,
  onClose,
  isPipSupported = false,
  isPipActive = false,
  isVideoReady = true,
  isVideoEnabled = false,
  onQualityChange
}: VideoWindowControlsProps) {
  return (
    <div className="flex items-center gap-1 ml-2">
      {/* Minimize Button */}
      <button
        onClick={onMinimize}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
        title="Minimize"
      >
        <MinimizeIcon size="sm" />
      </button>

      {/* Maximize Button */}
      <button
        onClick={onMaximize}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
        title="Maximize"
      >
        <MaximizeIcon size="sm" />
      </button>

      {/* PiP Button */}
      {isPipSupported && onPip && (
        <button
          onClick={onPip}
          disabled={!isVideoReady}
          className={`p-1.5 hover:bg-gray-700 rounded transition-colors ${
            isPipActive
              ? 'text-blue-400 bg-blue-500/20'
              : 'text-gray-300 hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={!isVideoReady ? 'Video is loading...' : 'Picture-in-Picture'}
        >
          <PipIcon size="sm" />
        </button>
      )}

      {/* Video Quality Selector */}
      {isVideoEnabled && onQualityChange && (
        <VideoQualitySelector compact onQualityChange={onQualityChange} />
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-red-600 rounded transition-colors text-gray-300 hover:text-white"
        title="Close"
      >
        <CloseIcon size="sm" />
      </button>
    </div>
  );
}
