// Custom hook for DM operations
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { toast } from '../store/notification';

/**
 * Hook for DM channel operations
 * Handles creating/navigating to DM channels
 */
export function useDMOperations() {
  const navigate = useNavigate();

  const startDM = async (userId: string) => {
    try {
      const channel = await api.getOrCreateDM(userId);
      navigate(`/chat/dm/${channel.id}`);
    } catch (err) {
      logger.error('Failed to create DM channel:', err);
      toast.error('Failed to start conversation. Please try again.');
    }
  };

  return { startDM };
}
