/**
 * Mic Test Component
 * Microphone testing with volume meter and monitoring
 */

import { UseMicTestReturn } from '../../../hooks/useMicTest';

interface MicTestProps {
  micTest: UseMicTestReturn;
}

export default function MicTest({ micTest }: MicTestProps) {
  const { isTesting, micLevel, isMonitoring, toggleTest, toggleMonitoring } =
    micTest;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300">
          Mic Test
        </label>
        <button
          onClick={toggleTest}
          className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
            isTesting
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isTesting ? 'Stop Test' : 'Test Mic'}
        </button>
      </div>

      {/* Volume Meter */}
      <div className="bg-gray-800 rounded-lg h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100"
          style={{ width: `${micLevel}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-1">
        {isTesting
          ? 'Speak to test your microphone'
          : 'Click "Test Mic" to check audio levels'}
      </p>

      {/* Headphones Warning */}
      {isTesting && (
        <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
          <p className="text-xs text-yellow-200">
            ⚠️ <strong>Use headphones</strong> to prevent feedback/echo
            (rundgång)
          </p>
        </div>
      )}

      {/* Monitor/Loopback Option */}
      {isTesting && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isMonitoring}
            onChange={toggleMonitoring}
            className="w-4 h-4 accent-green-600"
          />
          <div>
            <span className="text-sm text-white">Hear Myself (Monitor)</span>
            <p className="text-xs text-gray-400">
              Listen to your microphone input (requires headphones!)
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
