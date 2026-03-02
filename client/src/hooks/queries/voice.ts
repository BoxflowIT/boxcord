// Voice Channel Queries
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from './constants';

// Workspace voice users - batch fetch all voice channel users at once
// Optimized to reduce API calls from N (per channel) to 1 (per workspace)
export function useWorkspaceVoiceUsers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? ['workspaceVoiceUsers', workspaceId]
      : ['workspaceVoiceUsers-null'],
    queryFn: () =>
      workspaceId ? api.getWorkspaceVoiceUsers(workspaceId) : {},
    enabled: !!workspaceId,
    staleTime: 10 * 1000, // 10s - socket events keep fresh
    gcTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
    // No refetchInterval - socket events trigger refetch via refetchQueries
  });
}

// Voice channel users - check who's in a voice channel
// Updated via socket events, no polling needed
// NOTE: Consider using useWorkspaceVoiceUsers for better performance
export function useVoiceChannelUsers(channelId: string | undefined) {
  return useQuery({
    queryKey: channelId
      ? queryKeys.voiceChannelUsers(channelId)
      : ['voiceChannelUsers-null'],
    queryFn: () => (channelId ? api.getVoiceChannelUsers(channelId) : []),
    enabled: !!channelId,
    staleTime: 10 * 1000, // 10s - socket events keep fresh
    gcTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
    // No refetchInterval - socket events trigger refetch via refetchQueries
  });
}
