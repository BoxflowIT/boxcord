// React Query Constants - Cache times and query keys

// Cache duration constants (in milliseconds)
// Discord-style: Long cache times since WebSocket keeps data fresh
export const CACHE_TIMES = {
  WORKSPACES: { stale: 30 * 1000, gc: 60 * 60 * 1000 }, // 30s stale (socket keeps fresh, refetch as safety net), 1h gc
  CHANNELS: { stale: Infinity, gc: 60 * 60 * 1000 }, // Never stale (socket updates), 1h gc
  MESSAGES: { stale: Infinity, gc: 10 * 60 * 1000 }, // Never stale (WebSocket keeps fresh!), 10min gc
  USERS: { stale: Infinity, gc: 30 * 60 * 1000 }, // Never stale (socket updates), 30min gc
  CURRENT_USER: { stale: Infinity, gc: 60 * 60 * 1000 } // Never stale, 1h gc
} as const;

// Query Keys for caching
export const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  workspaceMembers: (id: string) => ['workspaceMembers', id] as const,
  channels: (workspaceId: string) => ['channels', workspaceId] as const,
  voiceChannelUsers: (channelId: string) =>
    ['voiceChannelUsers', channelId] as const,
  messages: (channelId: string, cursor?: string) =>
    ['messages', channelId, cursor] as const,
  dmChannels: ['dmChannels'] as const,
  dmMessages: (channelId: string, cursor?: string) =>
    ['dmMessages', channelId, cursor] as const,
  onlineUsers: ['onlineUsers'] as const,
  currentUser: ['currentUser'] as const,
  user: (id: string) => ['user', id] as const,
  reactions: (messageId: string) => ['reactions', messageId] as const,
  poll: (messageId: string) => ['poll', messageId] as const
};
