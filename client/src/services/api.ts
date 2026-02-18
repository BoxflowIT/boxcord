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
  MessageAttachment
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
  createChannel: (workspaceId: string, name: string, type?: 'TEXT' | 'ANNOUNCEMENT' | 'VOICE') =>
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
    request<{ userId: string; sessionId: string; isMuted: boolean; isDeafened: boolean; isSpeaking: boolean }[]>(
      `/voice/channels/${channelId}/users`
    ),

  // Messages
  getMessages: (channelId: string, cursor?: string) =>
    request<PaginatedMessages>(
      `/messages?channelId=${channelId}${cursor ? `&cursor=${cursor}` : ''}`
    ),
  editMessage: (messageId: string, content: string) =>
    request<Message>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content })
    }),
  deleteMessage: (messageId: string) =>
    request<void>(`/messages/${messageId}`, {
      method: 'DELETE'
    }),

  // Users
  getCurrentUser: () => request<User>('/users/me'),
  getUser: (id: string) => request<User>(`/users/${id}`),
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
  deleteDM: (messageId: string) =>
    request<void>(`/dm/messages/${messageId}`, {
      method: 'DELETE'
    }),
  markDMAsRead: (channelId: string) =>
    request<void>(`/dm/channels/${channelId}/read`, {
      method: 'POST'
    }),

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

  // Generic methods for services that manage their own endpoints
  get: <T = { data: unknown }>(path: string) =>
    request<T>(path).then((data) => ({ data })),
  post: <T = { data: unknown }>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }).then((data) => ({ data }))
};
