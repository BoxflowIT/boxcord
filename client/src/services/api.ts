// API Service
import { useAuthStore } from '../store/auth';
import { logger } from '../utils/logger';
import type {
  Workspace,
  WorkspaceInvite,
  InvitePreview,
  Channel,
  Message,
  User,
  PaginatedMessages,
  DMChannel,
  ReactionCount,
  MessageAttachment,
  Poll
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      // Only set Content-Type if there's a body
      ...(options.body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    logger.warn('Session expired, logging out...');
    useAuthStore.getState().logout();
    // Redirect to login
    window.location.href = '/';
    throw new Error('Session expired');
  }

  // Handle empty responses (like DELETE with 204 No Content)
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Request failed');
  }

  return data.data;
}

// For file uploads (no JSON content-type)
async function uploadFile(
  path: string,
  file: File
): Promise<MessageAttachment | { url: string; fileName: string }> {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Upload failed');
  }

  return data.data;
}

export const api = {
  // Workspaces
  getWorkspaces: () => request<Workspace[]>('/workspaces'),
  getWorkspace: (id: string) => request<Workspace>(`/workspaces/${id}`),
  getWorkspaceMembers: (id: string) =>
    request<User[]>(`/workspaces/${id}/members`),
  createWorkspace: (name: string, description?: string) =>
    request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    }),
  deleteWorkspace: (id: string) =>
    request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
  updateWorkspace: (
    id: string,
    data: { name?: string; description?: string; iconUrl?: string }
  ) =>
    request<Workspace>(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  leaveWorkspace: (id: string) =>
    request<void>(`/workspaces/${id}/leave`, { method: 'POST' }),

  // Workspace Invites
  createInvite: (
    workspaceId: string,
    options?: { maxUses?: number; expiresInDays?: number }
  ) =>
    request<WorkspaceInvite>(`/workspaces/${workspaceId}/invites`, {
      method: 'POST',
      body: JSON.stringify(options ?? {})
    }),
  getWorkspaceInvites: (workspaceId: string) =>
    request<WorkspaceInvite[]>(`/workspaces/${workspaceId}/invites`),
  deleteInvite: (workspaceId: string, inviteId: string) =>
    request<void>(`/workspaces/${workspaceId}/invites/${inviteId}`, {
      method: 'DELETE'
    }),
  previewInvite: (code: string) => request<InvitePreview>(`/invites/${code}`),
  joinWithInvite: (code: string) =>
    request<{ workspace: Workspace }>(`/invites/${code}/join`, {
      method: 'POST'
    }),

  // Channels
  getChannels: (workspaceId: string) =>
    request<Channel[]>(`/channels?workspaceId=${workspaceId}`),
  createChannel: (
    workspaceId: string,
    name: string,
    type?: 'TEXT' | 'ANNOUNCEMENT' | 'VOICE'
  ) =>
    request<Channel>('/channels', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name, type: type || 'TEXT' })
    }),
  deleteChannel: async (id: string) => {
    try {
      return await request<void>(`/channels/${id}`, { method: 'DELETE' });
    } catch (error) {
      // If channel is already deleted (404), treat as success
      if (error instanceof Error && error.message.includes('not found')) {
        return;
      }
      throw error;
    }
  },
  updateChannel: (id: string, data: { name?: string; description?: string }) =>
    request<Channel>(`/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Voice
  getVoiceChannelUsers: (channelId: string) =>
    request<
      {
        userId: string;
        sessionId: string;
        isMuted: boolean;
        isDeafened: boolean;
        isSpeaking: boolean;
      }[]
    >(`/voice/channels/${channelId}/users`),
  getWorkspaceVoiceUsers: (workspaceId: string) =>
    request<
      Record<
        string,
        {
          userId: string;
          sessionId: string;
          isMuted: boolean;
          isDeafened: boolean;
          isSpeaking: boolean;
        }[]
      >
    >(`/voice/workspaces/${workspaceId}/voice-users`),

  // Messages
  getMessages: (channelId: string, cursor?: string) =>
    request<PaginatedMessages>(
      `/messages?channelId=${channelId}${cursor ? `&cursor=${cursor}` : ''}`
    ),
  createMessage: (channelId: string, content: string) =>
    request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ channelId, content })
    }),
  editMessage: (messageId: string, content: string) =>
    request<Message>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    }),
  deleteMessage: (messageId: string) =>
    request<void>(`/messages/${messageId}`, {
      method: 'DELETE'
    }),
  pinMessage: (messageId: string, channelId: string) =>
    request<Message>(`/messages/${messageId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ channelId })
    }),
  unpinMessage: (messageId: string, channelId: string) =>
    request<Message>(`/messages/${messageId}/pin`, {
      method: 'DELETE',
      body: JSON.stringify({ channelId })
    }),
  getPinnedMessages: (channelId: string) =>
    request<Message[]>(`/messages/pinned?channelId=${channelId}`),

  // Global Search
  globalSearch: (query: string) =>
    request<{
      items: Array<Message & { type: 'channel' | 'dm'; channel?: Channel }>;
      hasMore: boolean;
    }>(`/search?q=${encodeURIComponent(query)}`),

  // Users
  getCurrentUser: () => request<User>('/users/me'),
  getUser: (id: string) => request<User>(`/users/${id}`),
  getUsersBatch: (userIds: string[]) =>
    request<User[]>('/users/batch', {
      method: 'POST',
      body: JSON.stringify({ userIds })
    }),
  searchUsers: (query: string) => request<User[]>(`/users/search?q=${query}`),
  getOnlineUsers: () => request<User[]>('/users/online'),
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  }) =>
    request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  updatePresence: (status: string, customStatus?: string) =>
    request<void>('/users/me/presence', {
      method: 'POST',
      body: JSON.stringify({ status, customStatus })
    }),
  updateUserRole: (userId: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF') =>
    request<User>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    }),
  deleteAccount: () =>
    request<void>('/users/me', {
      method: 'DELETE'
    }),

  // Direct Messages
  getDMChannels: () => request<DMChannel[]>('/dm/channels'),
  getOrCreateDM: (userId: string) =>
    request<DMChannel>('/dm/channels', {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),
  getDMMessages: (channelId: string, cursor?: string) =>
    request<PaginatedMessages>(
      `/dm/channels/${channelId}/messages${cursor ? `?cursor=${cursor}` : ''}`
    ),
  sendDM: (channelId: string, content: string) =>
    request<Message>(`/dm/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),
  editDM: (messageId: string, content: string) =>
    request<Message>(`/dm/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    }),
  deleteDM: (channelId: string) =>
    request<void>(`/dm/channels/${channelId}`, {
      method: 'DELETE'
    }),
  markDMAsRead: (channelId: string) =>
    request<void>(`/dm/channels/${channelId}/read`, {
      method: 'POST'
    }),
  pinDM: (messageId: string, channelId: string) =>
    request<Message>(`/dm/messages/${messageId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ channelId })
    }),
  unpinDM: (messageId: string, channelId: string) =>
    request<Message>(`/dm/messages/${messageId}/pin`, {
      method: 'DELETE',
      body: JSON.stringify({ channelId })
    }),
  getPinnedDMs: (channelId: string) =>
    request<Message[]>(`/dm/channels/${channelId}/pinned`),

  // Reactions
  getQuickReactions: () => request<string[]>('/reactions/quick'),
  toggleReaction: (messageId: string, emoji: string) =>
    request<{ added: boolean }>(`/reactions/messages/${messageId}`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),
  toggleDMReaction: (messageId: string, emoji: string) =>
    request<{ added: boolean }>(`/reactions/dm/${messageId}`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),
  getReactions: (messageId: string) =>
    request<ReactionCount[]>(`/reactions/messages/${messageId}`),

  // Files
  uploadFile: (file: File) => uploadFile('/files', file),
  uploadMessageFile: (messageId: string, file: File) =>
    uploadFile(`/files/messages/${messageId}`, file),
  uploadDMFile: (messageId: string, file: File) =>
    uploadFile(`/files/dm/${messageId}`, file),

  // User Status & DND
  updateCustomStatus: (status: string, statusEmoji: string) =>
    request<User>('/users/me/status', {
      method: 'PATCH',
      body: JSON.stringify({
        status: status || null,
        statusEmoji: statusEmoji || null
      })
    }),
  updateDNDMode: (dndMode: boolean, dndUntil?: string) =>
    request<User>('/users/me/dnd', {
      method: 'PATCH',
      body: JSON.stringify({ dndMode, dndUntil })
    }),

  // Moderation
  kickUser: (workspaceId: string, userId: string, reason?: string) =>
    request<{ success: boolean }>(`/workspaces/${workspaceId}/kick`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    }),
  banUser: (workspaceId: string, userId: string, reason?: string) =>
    request<{ success: boolean }>(`/workspaces/${workspaceId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    }),
  unbanUser: (workspaceId: string, userId: string) =>
    request<{ success: boolean }>(`/workspaces/${workspaceId}/unban`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),

  // Threads
  getThreads: (channelId: string) =>
    request<{ items: unknown[]; hasMore: boolean; nextCursor?: string }>(
      `/threads?channelId=${channelId}`
    ),
  getThread: (threadId: string) => request<unknown>(`/threads/${threadId}`),
  getThreadByMessageId: (messageId: string) =>
    request<unknown>(`/threads/by-message/${messageId}`),
  createThread: (messageId: string, title: string) =>
    request<unknown>('/threads', {
      method: 'POST',
      body: JSON.stringify({ messageId, title })
    }),
  updateThread: (
    threadId: string,
    updates: {
      title?: string;
      isLocked?: boolean;
      isArchived?: boolean;
      isResolved?: boolean;
    }
  ) =>
    request<unknown>(`/threads/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteThread: (threadId: string) =>
    request<void>(`/threads/${threadId}`, { method: 'DELETE' }),
  searchThreads: (query: string, channelId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (channelId) params.set('channelId', channelId);
    return request<{ items: unknown[]; hasMore: boolean; nextCursor?: string }>(
      `/threads/search?${params}`
    );
  },
  getThreadReplies: (threadId: string, page = 1, limit = 50) =>
    request<{ items: Array<Record<string, unknown>>; hasMore: boolean }>(
      `/threads/${threadId}/replies?page=${page}&limit=${limit}`
    ),
  addThreadReply: (
    threadId: string,
    content: string,
    attachments?: Array<{ url: string; type: string; name: string }>
  ) =>
    request<Record<string, unknown>>(`/threads/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments })
    }),
  editThreadReply: (threadId: string, replyId: string, content: string) =>
    request<{ id: string; content: string; edited: boolean }>(
      `/threads/${threadId}/replies/${replyId}`,
      { method: 'PATCH', body: JSON.stringify({ content }) }
    ),
  deleteThreadReply: (threadId: string, replyId: string) =>
    request<void>(`/threads/${threadId}/replies/${replyId}`, {
      method: 'DELETE'
    }),
  addThreadReplyReaction: (threadId: string, replyId: string, emoji: string) =>
    request<{ id: string; messageId: string; userId: string; emoji: string }>(
      `/threads/${threadId}/replies/${replyId}/reactions`,
      { method: 'POST', body: JSON.stringify({ emoji }) }
    ),
  removeThreadReplyReaction: (
    threadId: string,
    replyId: string,
    emoji: string
  ) =>
    request<void>(
      `/threads/${threadId}/replies/${replyId}/reactions/${encodeURIComponent(emoji)}`,
      { method: 'DELETE' }
    ),
  toggleThreadFollow: (threadId: string, shouldFollow: boolean) =>
    request<unknown>(`/threads/${threadId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ shouldFollow })
    }),
  markThreadAsRead: (threadId: string) =>
    request<unknown>(`/threads/${threadId}/read`, { method: 'POST' }),
  getThreadAnalytics: (threadId: string) =>
    request<unknown>(`/threads/${threadId}/analytics`),
  getChannelThreadAnalytics: (channelId: string) =>
    request<unknown>(`/threads/analytics?channelId=${channelId}`),

  // Generic methods for services that manage their own endpoints
  get: <T = { data: unknown }>(path: string) =>
    request<T>(path).then((data) => ({ data })),
  post: <T = { data: unknown }>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }).then((data) => ({ data })),

  // Bookmarks
  getBookmarks: (workspaceId?: string) =>
    request<unknown[]>(
      workspaceId ? `/bookmarks?workspaceId=${workspaceId}` : '/bookmarks'
    ),
  getBookmarkCount: (workspaceId?: string) =>
    request<{ count: number }>(
      workspaceId
        ? `/bookmarks/count?workspaceId=${workspaceId}`
        : '/bookmarks/count'
    ),
  addBookmark: (input: {
    messageId?: string;
    dmMessageId?: string;
    workspaceId?: string;
    note?: string;
  }) =>
    request<unknown>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  removeBookmark: (bookmarkId: string) =>
    request<unknown>(`/bookmarks/${bookmarkId}`, { method: 'DELETE' }),
  removeBookmarkByMessage: (messageId: string) =>
    request<unknown>(`/bookmarks/message/${messageId}`, { method: 'DELETE' }),
  removeBookmarkByDM: (dmMessageId: string) =>
    request<unknown>(`/bookmarks/dm/${dmMessageId}`, { method: 'DELETE' }),
  updateBookmarkNote: (bookmarkId: string, note: string) =>
    request<unknown>(`/bookmarks/${bookmarkId}/note`, {
      method: 'PATCH',
      body: JSON.stringify({ note })
    }),

  // Permissions
  getChannelPermissions: (channelId: string) =>
    request<unknown>(`/permissions?channelId=${channelId}`),
  getUserPermissions: (channelId: string) =>
    request<unknown>(`/permissions/me?channelId=${channelId}`),
  checkPermission: (channelId: string, permission: string) =>
    request<{ hasPermission: boolean }>(
      `/permissions/check?channelId=${channelId}&permission=${permission}`
    ),
  setPermissions: (
    channelId: string,
    role: string,
    permissions: Record<string, boolean>
  ) =>
    request<unknown>('/permissions', {
      method: 'POST',
      body: JSON.stringify({ channelId, role, permissions })
    }),
  resetPermissions: (channelId: string, role: string) =>
    request<unknown>(`/permissions?channelId=${channelId}&role=${role}`, {
      method: 'DELETE'
    }),

  // Audit Logs
  getAuditLogs: (workspaceId: string, filter = 'all') =>
    request<unknown[]>(
      `/workspaces/${workspaceId}/audit-logs?filter=${filter}`
    ),

  // Polls
  createPoll: (data: {
    channelId: string;
    question: string;
    options: string[];
    isMultiple?: boolean;
    isAnonymous?: boolean;
    endsAt?: string;
  }) =>
    request<Poll>('/polls', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getPoll: (pollId: string) => request<Poll>(`/polls/${pollId}`),
  getPollByMessage: (messageId: string) =>
    request<Poll | null>(`/polls/message/${messageId}`),
  votePoll: (pollId: string, optionId: string) =>
    request<Poll>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId })
    }),
  endPoll: (pollId: string) =>
    request<Poll>(`/polls/${pollId}/end`, { method: 'POST' }),
  deletePoll: (pollId: string) =>
    request<void>(`/polls/${pollId}`, { method: 'DELETE' })
};
