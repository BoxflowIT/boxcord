import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for navigation with type-safe routes
 */
export function useAppNavigation() {
  const navigate = useNavigate();

  const goToChannel = useCallback(
    (channelId: string) => {
      navigate(`/chat/channels/${channelId}`);
    },
    [navigate]
  );

  const goToDM = useCallback(
    (dmChannelId: string) => {
      navigate(`/chat/dm/${dmChannelId}`);
    },
    [navigate]
  );

  const goToHome = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const goToSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  return {
    navigate,
    goToChannel,
    goToDM,
    goToHome,
    goToLogin,
    goToSettings
  };
}
