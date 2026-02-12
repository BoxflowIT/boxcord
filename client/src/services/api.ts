// API Service
import { useAuthStore } from '../store/auth';
import type { Workspace, Channel, Message } from '../store/chat';

const API_BASE = '/api/v1';

// API Response types
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  presence?: {
    status: string;
    customStatus?: string;
    lastSeen: string;
  };
}

interface PaginatedMessages {
  items: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

interface DMChannel {
  id: string;
  createdAt: string;
  participants: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  lastMessage?: Message | null;
}

interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

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

  // Handle empty responses (like DELETE with 204 No Content)
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Request failed');
  }

  return data.data;
}

// For file uploads (no JSON content-type)
async function uploadFile(path: string, file: File): Promise<Attachment> {
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

  // Channels
  getChannels: (workspaceId: string) =>
    request<Channel[]>(`/channels?workspaceId=${workspaceId}`),
  createChannel: (workspaceId: string, name: string) =>
    request<Channel>('/channels', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name })
    }),
  deleteChannel: (id: string) =>
    request<void>(`/channels/${id}`, { method: 'DELETE' }),
  updateChannel: (id: string, data: { name?: string; description?: string }) =>
    request<Channel>(`/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Messages
  getMessages: (channelId: string, cursor?: string) =>
    request<PaginatedMessages>(
      `/messages?channelId=${channelId}${cursor ? `&cursor=${cursor}` : ''}`
    ),

  // Users
  getCurrentUser: () => request<User>('/users/me'),
  initUser: () => request<User>('/users/me/init', { method: 'POST' }),
  getUser: (id: string) => request<User>(`/users/${id}`),
  searchUsers: (query: string) => request<User[]>(`/users/search?q=${query}`),
  getOnlineUsers: () => request<User[]>('/users/online'),
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
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

  // Reactions
  getQuickReactions: () => request<string[]>('/reactions/quick'),
  toggleReaction: (messageId: string, emoji: string) =>
    request<{ added: boolean }>(`/reactions/messages/${messageId}`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),
  getReactions: (messageId: string) =>
    request<ReactionCount[]>(`/reactions/messages/${messageId}`),

  // Files
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
