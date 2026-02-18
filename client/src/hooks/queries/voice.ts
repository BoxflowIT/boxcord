// Voice Channel Queries
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from './constants';

// Voice channel users - check who's in a voice channel
// Updated via socket events, no polling needed
export function useVoiceChannelUsers(channelId: string | undefined) {
  return useQuery({
    queryKey: channelId
      ? queryKeys.voiceChannelUsers(channelId)
      : ['voiceChannelUsers-null'],
    queryFn: () => (channelId ? api.getVoiceChannelUsers(channelId) : []),
    enabled: !!channelId,
    staleTime: 0, // Always refetch when needed
    gcTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
    // No refetchInterval - socket events trigger refetch via refetchQueries
  });
}
