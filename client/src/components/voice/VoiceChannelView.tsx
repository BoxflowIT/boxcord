import { useState } from 'react';
import { useVoiceStore } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { VoiceUserList } from './VoiceUserList';
import { VoiceControls } from './VoiceControls';
import { VoiceChannelIcon, VoiceConnectIcon, VoiceDisconnectIcon } from '../ui/Icons';
import { VoiceLoader } from '../ui/VoiceLoader';

interface VoiceChannelViewProps {
  channelId: string;
  channelName: string;
}

export function VoiceChannelView({
  channelId,
  channelName,
}: VoiceChannelViewProps) {
  const { isConnected, isConnecting, currentChannelId } = useVoiceStore();
  const [error, setError] = useState<string | null>(null);

  const isInThisChannel =
    isConnected && currentChannelId === channelId;

  const handleJoin = async () => {
    try {
      setError(null);
      await voiceService.joinChannel(channelId);
    } catch (err) {
      console.error('Failed to join voice channel:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to join voice channel. Please check your microphone permissions.'
      );
    }
  };

  const handleLeave = async () => {
    try {
      setError(null);
      await voiceService.leaveChannel();
    } catch (err) {
      console.error('Failed to leave voice channel:', err);
      setError('Failed to leave voice channel');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
            <VoiceChannelIcon size="lg" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              {channelName}
            </h2>
            <p className="text-sm text-gray-400">Voice Channel</p>
          </div>
        </div>
      </div>

      {/* Voice Channel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Not connected state */}
        {!isInThisChannel && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-500">
              <VoiceChannelIcon size="lg" className="w-12 h-12" />
            </div>

            <h3 className="text-2xl font-semibold text-gray-100 mb-2">
              {channelName}
            </h3>

            <p className="text-gray-400 mb-8 max-w-md">
              Click the button below to join the voice channel. Make sure your
              microphone is connected and browser permissions are granted.
            </p>

            <button
              onClick={handleJoin}
              disabled={isConnecting}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center gap-3 min-w-[200px] justify-center"
            >
              {isConnecting ? (
                <VoiceLoader />
              ) : (
                <>
                  <VoiceConnectIcon size="md" />
                  Join Voice Channel
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4">
              WebRTC peer-to-peer voice chat
            </p>
          </div>
        )}

        {/* Connected state */}
        {isInThisChannel && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Connected banner */}
            <div className="p-4 bg-green-500/10 border-b border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-green-400 font-medium">
                    Connected to voice
                  </p>
                </div>

                <button
                  onClick={handleLeave}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <VoiceDisconnectIcon size="sm" />
                  Leave
                </button>
              </div>
            </div>

            {/* Voice users list */}
            <div className="flex-1 overflow-y-auto">
              <VoiceUserList />
            </div>

            {/* Voice controls */}
            <VoiceControls />
          </div>
        )}
      </div>
    </div>
  );
}
