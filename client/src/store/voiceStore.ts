import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type SimplePeer from 'simple-peer';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceUser {
  userId: string;
  sessionId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface VoiceStateData {
  currentChannelId: string | null;
  currentSessionId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  users: Map<string, VoiceUser>;
  peers: Map<string, SimplePeer.Instance>;
  localStream: MediaStream | null;
}

interface VoiceActions {
  setCurrentChannel: (channelId: string | null, sessionId: string | null) => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setDeafened: (isDeafened: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addUser: (user: VoiceUser) => void;
  removeUser: (userId: string) => void;
  updateUserState: (userId: string, state: Partial<VoiceUser>) => void;
  addPeer: (userId: string, peer: SimplePeer.Instance) => void;
  removePeer: (userId: string) => void;
  reset: () => void;
}

type VoiceState = VoiceStateData & VoiceActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): VoiceStateData => ({
  currentChannelId: null,
  currentSessionId: null,
  isConnected: false,
  isConnecting: false,
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  users: new Map(),
  peers: new Map(),
  localStream: null,
});

// ============================================================================
// STORE
// ============================================================================

export const useVoiceStore = create<VoiceState>((set, get) => ({
  ...createInitialState(),

  // Channel state
  setCurrentChannel: (channelId, sessionId) => 
    set({ currentChannelId: channelId, currentSessionId: sessionId }),
  
  setConnecting: (isConnecting) => set({ isConnecting }),
  setConnected: (isConnected) => set({ isConnected }),
  
  // Local user state
  setMuted: (isMuted) => set({ isMuted }),
  setDeafened: (isDeafened) => set({ isDeafened }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setLocalStream: (localStream) => set({ localStream }),

  // User management
  addUser: (user) => set((state) => {
    const users = new Map(state.users);
    users.set(user.userId, user);
    return { users };
  }),

  removeUser: (userId) => set((state) => {
    const users = new Map(state.users);
    users.delete(userId);
    return { users };
  }),

  updateUserState: (userId, update) => set((state) => {
    const user = state.users.get(userId);
    if (!user) return state;
    
    const users = new Map(state.users);
    users.set(userId, { ...user, ...update });
    return { users };
  }),

  // Peer management
  addPeer: (userId, peer) => set((state) => {
    const peers = new Map(state.peers);
    peers.set(userId, peer);
    return { peers };
  }),

  removePeer: (userId) => {
    const peer = get().peers.get(userId);
    peer?.destroy();
    
    set((state) => {
      const peers = new Map(state.peers);
      peers.delete(userId);
      return { peers };
    });
  },

  // Cleanup
  reset: () => {
    const { peers, localStream } = get();
    
    // Cleanup peers
    peers.forEach((peer) => peer.destroy());
    
    // Stop media tracks
    localStream?.getTracks().forEach((track) => track.stop());
    
    set(createInitialState());
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/** Connection state for UI */
export const useVoiceConnection = () => useVoiceStore(
  useShallow((s) => ({
    channelId: s.currentChannelId,
    sessionId: s.currentSessionId,
    isConnected: s.isConnected,
    isConnecting: s.isConnecting,
  }))
);

/** Local user voice controls */
export const useVoiceControls = () => useVoiceStore(
  useShallow((s) => ({
    isMuted: s.isMuted,
    isDeafened: s.isDeafened,
    isSpeaking: s.isSpeaking,
    setMuted: s.setMuted,
    setDeafened: s.setDeafened,
  }))
);

/** Voice channel users as array */
export const useVoiceUsers = () => useVoiceStore((s) => Array.from(s.users.values()));

/** Check if currently in a voice channel */
export const useIsInVoiceChannel = (channelId?: string) => useVoiceStore((s) => 
  channelId ? s.currentChannelId === channelId : s.currentChannelId !== null
);
