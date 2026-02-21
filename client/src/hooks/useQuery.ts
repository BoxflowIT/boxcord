// Re-export all query hooks for backward compatibility
// This maintains compatibility with existing imports from useQuery.ts

export { CACHE_TIMES, queryKeys } from './queries/constants';
export {
  useWorkspaces,
  useWorkspaceMembers,
  useCreateWorkspace,
  useDeleteWorkspace
} from './queries/workspace';
export {
  useChannels,
  useCreateChannel,
  useDeleteChannel
} from './queries/channel';
export {
  useOnlineUsers,
  useCurrentUser,
  useUser,
  useUsers,
  useUpdateProfile,
  useUpdateUserRole
} from './queries/user';
export { useMessages, useReactions } from './queries/message';
export { useDMChannels, useDMMessages } from './queries/dm';
export {
  useVoiceChannelUsers,
  useWorkspaceVoiceUsers
} from './queries/voice';
