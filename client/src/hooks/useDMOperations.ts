// Custom hook for DM operations
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { toast } from '../store/notification';
import { queryKeys } from './useQuery';

/**
 * Hook for DM channel operations
 * Handles creating/navigating to DM channels
 */
export function useDMOperations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startDM = async (userId: string) => {
    try {
      const channel = await api.getOrCreateDM(userId);

      // Invalidate DM channels cache to include new/updated channel
      await queryClient.invalidateQueries({ queryKey: queryKeys.dmChannels });

      navigate(`/chat/dm/${channel.id}`);
    } catch (err) {
      logger.error('Failed to create DM channel:', err);
      toast.error('Failed to start conversation. Please try again.');
    }
  };

  return { startDM };
}
