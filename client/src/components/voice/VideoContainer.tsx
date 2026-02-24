// Video Container - Reusable video display component
// Used by FloatingVideoWindow and VideoGrid

import { RefObject, LegacyRef } from 'react';

interface VideoContainerProps {
  videoRef: RefObject<HTMLVideoElement> | LegacyRef<HTMLVideoElement>;
  label: string;
  mirrored?: boolean;
  isScreenShare?: boolean;
  showLiveIndicator?: boolean; // Show green "LIVE" badge for screen shares
}

export function VideoContainer({
  videoRef,
  label,
  mirrored = false,
  isScreenShare = false,
  showLiveIndicator = false
}: VideoContainerProps) {
  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: isScreenShare ? 'contain' : 'cover',
          ...(mirrored && { transform: 'scaleX(-1)' })
        }}
      />
      <div
        className={`absolute ${
          isScreenShare && showLiveIndicator
            ? 'top-3 left-3 bg-green-600 flex items-center gap-2'
            : 'bottom-1 left-1 bg-black/80'
        } px-2 py-1 rounded text-xs font-medium text-white z-10`}
      >
        {isScreenShare && showLiveIndicator && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        {label}
      </div>
    </div>
  );
}
