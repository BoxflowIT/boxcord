/**
 * Audio Quality Toggles Component
 * Settings for echo cancellation, noise suppression, AGC, and RNNoise
 */

interface AudioQualityTogglesProps {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  useRNNoise: boolean;
  rnnoiseReady: boolean;
  isTesting: boolean;
  onEchoCancellationChange: (enabled: boolean) => void;
  onNoiseSuppressionChange: (enabled: boolean) => void;
  onAutoGainControlChange: (enabled: boolean) => void;
  onUseRNNoiseChange: (enabled: boolean) => void;
}

export default function AudioQualityToggles({
  echoCancellation,
  noiseSuppression,
  autoGainControl,
  useRNNoise,
  rnnoiseReady,
  isTesting,
  onEchoCancellationChange,
  onNoiseSuppressionChange,
  onAutoGainControlChange,
  onUseRNNoiseChange
}: AudioQualityTogglesProps) {
  return (
    <div className="border-t border-gray-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Audio Quality</h3>
        {isTesting && (
          <span className="text-xs text-green-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live preview
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {isTesting
          ? '✨ Changes apply instantly with professional audio processing - speak to hear crystal clear quality'
          : 'Start mic test to preview Discord-quality audio processing'}
      </p>

      <div className="space-y-3">
        {/* Echo Cancellation */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1">
            <div className="text-sm text-white group-hover:text-green-400 transition-colors">
              Echo Cancellation
            </div>
            <div className="text-xs text-gray-400">
              Eliminates acoustic echo and feedback from speakers
            </div>
          </div>
          <input
            type="checkbox"
            checked={echoCancellation}
            onChange={(e) => onEchoCancellationChange(e.target.checked)}
            className="w-5 h-5 accent-green-600 cursor-pointer"
          />
        </label>

        {/* Native Noise Suppression */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1">
            <div className="text-sm text-white group-hover:text-green-400 transition-colors">
              Noise Suppression
            </div>
            <div className="text-xs text-gray-400">
              Removes background noise (keyboard, fan, traffic)
            </div>
          </div>
          <input
            type="checkbox"
            checked={noiseSuppression}
            onChange={(e) => onNoiseSuppressionChange(e.target.checked)}
            className="w-5 h-5 accent-green-600 cursor-pointer"
          />
        </label>

        {/* RNNoise AI */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1">
            <div className="text-sm text-white group-hover:text-green-400 transition-colors flex items-center gap-2">
              RNNoise AI Suppression
              {rnnoiseReady && (
                <span className="text-xs px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded">
                  AI
                </span>
              )}
              {!rnnoiseReady && (
                <span className="text-xs px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">
                  Loading...
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Advanced AI noise removal (same tech as OBS Studio)
            </div>
          </div>
          <input
            type="checkbox"
            checked={useRNNoise}
            onChange={(e) => onUseRNNoiseChange(e.target.checked)}
            disabled={!rnnoiseReady}
            className="w-5 h-5 accent-green-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>

        {/* Auto Gain Control */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1">
            <div className="text-sm text-white group-hover:text-green-400 transition-colors">
              Auto Gain Control
            </div>
            <div className="text-xs text-gray-400">
              Normalizes volume when speaking quietly or loudly
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoGainControl}
            onChange={(e) => onAutoGainControlChange(e.target.checked)}
            className="w-5 h-5 accent-green-600 cursor-pointer"
          />
        </label>
      </div>

      {/* Audio Quality Info */}
      <div className="mt-4 p-3 bg-boxflow-darker rounded-lg border border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>48kHz sample rate for studio-quality audio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>6x gain boost with professional compression</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>80Hz high-pass filter removes rumble</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Noise gate blocks background sounds</span>
          </div>
          {useRNNoise && rnnoiseReady && (
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="font-semibold">
                AI-powered noise removal active
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
