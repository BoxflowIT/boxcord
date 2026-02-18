import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useCreateChannel, useDeleteChannel } from './useQuery';
import type { Channel } from '../types';

interface UseChannelOperationsProps {
  channels: Channel[];
  currentWorkspaceId: string | undefined;
  currentChannel: Channel | null;
  onChannelSelect: (channel: Channel | null) => void;
}

export function useChannelOperations({
  channels,
  currentWorkspaceId,
  currentChannel,
  onChannelSelect
}: UseChannelOperationsProps) {
  const navigate = useNavigate();
  const createChannelMutation = useCreateChannel();
  const deleteChannelMutation = useDeleteChannel();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (name: string, type?: 'TEXT' | 'ANNOUNCEMENT' | 'VOICE') => {
    if (!currentWorkspaceId || isCreating) return;

    setIsCreating(true);
    try {
      const channel = await createChannelMutation.mutateAsync({
        workspaceId: currentWorkspaceId,
        name,
        type
      });
      onChannelSelect(channel);
      return channel;
    } catch (err) {
      logger.error('Failed to create channel:', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (
    id: string,
    data: { name: string; description: string }
  ) => {
    try {
      await api.updateChannel(id, data);
    } catch (err) {
      logger.error('Failed to update channel:', err);
      throw err;
    }
  };

  const handleDelete = async (channelId: string) => {
    try {
      await deleteChannelMutation.mutateAsync(channelId);

      // Navigate away if current channel was deleted
      if (currentChannel?.id === channelId) {
        const remaining = channels.filter((c) => c.id !== channelId);
        if (remaining.length > 0) {
          onChannelSelect(remaining[0]);
        } else {
          navigate('/chat');
        }
      }
    } catch (err) {
      logger.error('Failed to delete channel:', err);
      throw err;
    }
  };

  return {
    isCreating,
    createChannel: handleCreate,
    updateChannel: handleUpdate,
    deleteChannel: handleDelete
  };
}
