// Message Forward Modal - Forward message to another channel/DM
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, SendIcon } from '../ui/Icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  workspaceName?: string;
}

interface ForwardMessageModalProps {
  messageContent: string;
  onForward: (targetId: string, targetType: 'channel' | 'dm') => void;
  onClose: () => void;
}

export function ForwardMessageModal({
  messageContent,
  onForward,
  onClose
}: ForwardMessageModalProps) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available channels and DMs
    const fetchTargets = async () => {
      try {
        setLoading(true);

        // Fetch all workspaces first
        const workspaces = await api.getWorkspaces();

        // Fetch channels for each workspace
        const allChannels: Channel[] = [];
        for (const workspace of workspaces) {
          const workspaceChannels = await api.getChannels(workspace.id);
          allChannels.push(
            ...workspaceChannels.map((ch) => ({
              id: ch.id,
              name: ch.name,
              type: 'channel' as const,
              workspaceName: workspace.name
            }))
          );
        }
        setChannels(allChannels);

        // Fetch DMs
        const dmsData = await api.getDMChannels();
        setDms(
          dmsData.map((dm) => {
            // Get the other user (not the current user)
            const otherParticipant = dm.participants.find(
              (p) => p.userId !== currentUser?.id
            );
            const otherUser =
              otherParticipant?.user || dm.participants[0]?.user;

            return {
              id: dm.id,
              name: otherUser?.firstName || otherUser?.email || 'Unknown',
              type: 'dm' as const
            };
          })
        );
      } catch (error) {
        console.error('Failed to fetch targets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTargets();
  }, [currentUser?.id]);

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDMs = dms.filter((dm) =>
    dm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = () => {
    if (selectedTarget) {
      onForward(selectedTarget.id, selectedTarget.type);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">{t('messages.forwardMessage')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 bg-gray-800/50 border-b border-gray-800">
          <div className="text-sm text-gray-400 mb-1">
            {t('messages.forwardingMessage')}:
          </div>
          <div className="text-sm italic line-clamp-2">{messageContent}</div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('messages.searchDestination')}
            className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Target List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner-ring w-8 h-8" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Channels */}
              {filteredChannels.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    {t('channels.title')}
                  </h3>
                  <div className="space-y-1">
                    {filteredChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedTarget(channel)}
                        className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                          selectedTarget?.id === channel.id
                            ? 'bg-blue-600'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-gray-400">#</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{channel.name}</div>
                          {channel.workspaceName && (
                            <div className="text-xs text-gray-400">
                              {channel.workspaceName}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Messages */}
              {filteredDMs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    {t('dm.title')}
                  </h3>
                  <div className="space-y-1">
                    {filteredDMs.map((dm) => (
                      <button
                        key={dm.id}
                        onClick={() => setSelectedTarget(dm)}
                        className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                          selectedTarget?.id === dm.id
                            ? 'bg-blue-600'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-gray-400">@</span>
                        <div className="font-medium">{dm.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredChannels.length === 0 && filteredDMs.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  {t('messages.noDestinationsFound')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedTarget}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <SendIcon size="sm" />
            {t('messages.forward')}
          </button>
        </div>
      </div>
    </div>
  );
}
