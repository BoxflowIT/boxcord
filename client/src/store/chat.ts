// Chat Store - Zustand
import { create } from 'zustand';

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  content: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: 'TEXT' | 'ANNOUNCEMENT' | 'THREAD';
  isPrivate: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

interface ChatState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  typingUsers: Map<string, Set<string>>; // channelId -> Set of userIds

  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setTyping: (channelId: string, userId: string) => void;
  clearTyping: (channelId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  channels: [],
  currentChannel: null,
  messages: [],
  typingUsers: new Map(),

  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m))
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId)
    })),

  setTyping: (channelId, userId) =>
    set((state) => {
      const newTyping = new Map(state.typingUsers);
      if (!newTyping.has(channelId)) {
        newTyping.set(channelId, new Set());
      }
      newTyping.get(channelId)!.add(userId);
      return { typingUsers: newTyping };
    }),

  clearTyping: (channelId, userId) =>
    set((state) => {
      const newTyping = new Map(state.typingUsers);
      newTyping.get(channelId)?.delete(userId);
      return { typingUsers: newTyping };
    })
}));
