/**
 * useSocketRoom - Join/leave socket room on mount/unmount
 * Shared logic for channels and DMs
 */
import { useEffect } from 'react';
import { socketService } from '../services/socket';

export function useSocketRoom(
  channelId: string | undefined,
  type: 'channel' | 'dm'
) {
  useEffect(() => {
    if (!channelId) return;

    if (type === 'channel') {
      socketService.joinChannel(channelId);
      return () => socketService.leaveChannel(channelId);
    } else {
      socketService.joinDM(channelId);
      return () => socketService.leaveDM(channelId);
    }
  }, [channelId, type]);
}
