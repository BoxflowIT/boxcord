// ============================================================================
// CHAT STORE (Zustand) - UI State Only
// ============================================================================
// SERVER DATA is in React Query (messages, channels, workspaces)
// This store only holds transient UI state
// ============================================================================

import { create } from 'zustand';
import type { Channel, Workspace } from '../types';

export type ActiveView =
  | { type: 'workspace' }
  | { type: 'helloflow' }
  | { type: 'integration'; id: 'onedrive' | 'calendar' | 'sharepoint' };

interface ChatState {
  // UI State - which workspace/channel is currently selected
  currentWorkspace: Workspace | null;
  currentChannel: Channel | null;

  // Active view for server bar navigation
  activeView: ActiveView;

  // Mobile sidebar toggle
  mobileSidebarOpen: boolean;

  // Transient State - typing indicators (not persisted)
  typingUsers: Map<string, Set<string>>; // channelId -> Set of userIds

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setActiveView: (view: ActiveView) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTyping: (channelId: string, userId: string) => void;
  clearTyping: (channelId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  currentWorkspace: null,
  currentChannel: null,
  activeView: { type: 'workspace' },
  mobileSidebarOpen: false,
  typingUsers: new Map(),

  // Actions
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  setActiveView: (view) => set({ activeView: view }),

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

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
