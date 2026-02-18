import { useVoiceStore } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { MicIcon, MicOffIcon, HeadphonesIcon, HeadphonesOffIcon, VoiceDisconnectIcon } from '../ui/Icons';

export function VoiceControls() {
  const { isMuted, isDeafened, isConnected } = useVoiceStore();

  if (!isConnected) return null;

  const handleToggleMute = async () => {
    try {
      await voiceService.toggleMute();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleToggleDeafen = async () => {
    try {
      await voiceService.toggleDeafen();
    } catch (error) {
      console.error('Failed to toggle deafen:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await voiceService.leaveChannel();
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800 border-t border-gray-700">
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-lg transition-colors ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOffIcon size="md" /> : <MicIcon size="md" />}
        </button>

        <button
          onClick={handleToggleDeafen}
          className={`p-2 rounded-lg transition-colors ${
            isDeafened
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
        >
          {isDeafened ? <HeadphonesOffIcon size="md" /> : <HeadphonesIcon size="md" />}
        </button>
      </div>

      <button
        onClick={handleLeave}
        className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        title="Leave voice channel"
      >
        <VoiceDisconnectIcon size="md" />
      </button>
    </div>
  );
}
