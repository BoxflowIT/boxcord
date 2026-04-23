import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type SimplePeer from 'simple-peer';
import { logger } from '../utils/logger';

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

export type VideoWindowMode = 'fullscreen' | 'minimized' | 'pip' | 'floating';

export interface VideoWindowState {
  mode: VideoWindowMode;
  previousMode: VideoWindowMode | null; // Track previous mode for PiP exit
  modeChangedAt: number; // Timestamp when mode last changed (to prevent immediate clicks)
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface VoiceStateData {
  currentChannelId: string | null;
  currentSessionId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isPushToTalk: boolean;
  users: Map<string, VoiceUser>;
  peers: Map<string, SimplePeer.Instance>;
  localStream: MediaStream | null;
  videoWindow: VideoWindowState;
}

interface VoiceActions {
  setCurrentChannel: (
    channelId: string | null,
    sessionId: string | null
  ) => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setDeafened: (isDeafened: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setVideoEnabled: (isVideoEnabled: boolean) => void;
  setScreenSharing: (isScreenSharing: boolean) => void;
  setPushToTalk: (isPushToTalk: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addUser: (user: VoiceUser) => void;
  removeUser: (userId: string) => void;
  updateUserState: (userId: string, state: Partial<VoiceUser>) => void;
  addPeer: (userId: string, peer: SimplePeer.Instance) => void;
  removePeer: (userId: string) => void;
  setVideoWindowMode: (mode: VideoWindowMode) => void;
  setVideoWindowPosition: (x: number, y: number) => void;
  setVideoWindowSize: (width: number, height: number) => void;
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
  isVideoEnabled: false,
  isScreenSharing: false,
  isPushToTalk: false,
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  users: new Map(),
  peers: new Map(),
  localStream: null,
  videoWindow: {
    mode: 'fullscreen',
    previousMode: null,
    modeChangedAt: 0,
    position: { x: 0, y: 0 },
    size: { width: 800, height: 600 }
  }
});

// ============================================================================
// STORE
// ============================================================================

export const useVoiceStore = create<VoiceState>((set, get) => ({
  ...createInitialState(),

  // Channel state
  setCurrentChannel: (channelId, sessionId) => {
    set({ currentChannelId: channelId, currentSessionId: sessionId });
  },

  setConnecting: (isConnecting) => {
    set({ isConnecting });
  },

  setConnected: (isConnected) => {
    set({ isConnected });
  },

  // Local user state
  setVideoEnabled: (isVideoEnabled) => set({ isVideoEnabled }),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setPushToTalk: (isPushToTalk) => set({ isPushToTalk }),
  setMuted: (isMuted) => set({ isMuted }),
  setDeafened: (isDeafened) => set({ isDeafened }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setLocalStream: (localStream) => set({ localStream }),

  // User management
  addUser: (user) =>
    set((state) => {
      const users = new Map(state.users);
      users.set(user.userId, user);
      return { users };
    }),

  removeUser: (userId) =>
    set((state) => {
      const users = new Map(state.users);
      users.delete(userId);
      return { users };
    }),

  updateUserState: (userId, update) =>
    set((state) => {
      const user = state.users.get(userId);
      if (!user) return state;

      const users = new Map(state.users);
      users.set(userId, { ...user, ...update });
      return { users };
    }),

  // Peer management
  addPeer: (userId, peer) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.set(userId, peer);
      return { peers };
    }),

  removePeer: (userId) => {
    const peer = get().peers.get(userId);

    // Remove from map first to prevent other code from accessing a destroyed peer
    set((state) => {
      const peers = new Map(state.peers);
      peers.delete(userId);
      return { peers };
    });

    // Destroy after removal
    try {
      peer?.destroy();
    } catch (err) {
      logger.error(`Error destroying peer ${userId}:`, err);
    }
  },

  // Video window controls
  setVideoWindowMode: (mode) => {
    const currentMode = get().videoWindow.mode;
    logger.debug('[voiceStore] setVideoWindowMode:', currentMode, '->', mode);

    set((state) => {
      // Save previous mode when entering PiP (so we can restore on exit)
      const previousMode =
        mode === 'pip'
          ? state.videoWindow.mode
          : state.videoWindow.previousMode;

      return {
        videoWindow: {
          ...state.videoWindow,
          mode,
          previousMode,
          modeChangedAt: Date.now()
        }
      };
    });

    // Save to localStorage for persistence
    localStorage.setItem('boxcord_video_window_mode', mode);
  },

  setVideoWindowPosition: (x, y) => {
    set((state) => ({
      videoWindow: { ...state.videoWindow, position: { x, y } }
    }));

    // Save to localStorage
    localStorage.setItem(
      'boxcord_video_window_position',
      JSON.stringify({ x, y })
    );
  },

  setVideoWindowSize: (width, height) => {
    set((state) => ({
      videoWindow: { ...state.videoWindow, size: { width, height } }
    }));

    // Save to localStorage
    localStorage.setItem(
      'boxcord_video_window_size',
      JSON.stringify({ width, height })
    );
  },

  // Cleanup
  reset: () => {
    const { peers, localStream } = get();

    // Cleanup peers
    peers.forEach((peer) => {
      peer.destroy();
    });

    // Stop media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    set(createInitialState());
  }
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/** Connection state for UI */
export const useVoiceConnection = () =>
  useVoiceStore(
    useShallow((s) => ({
      channelId: s.currentChannelId,
      sessionId: s.currentSessionId,
      isConnected: s.isConnected,
      isConnecting: s.isConnecting
    }))
  );

/** Local user voice controls */
export const useVoiceControls = () =>
  useVoiceStore(
    useShallow((s) => ({
      isMuted: s.isMuted,
      isDeafened: s.isDeafened,
      isSpeaking: s.isSpeaking,
      isVideoEnabled: s.isVideoEnabled,
      isScreenSharing: s.isScreenSharing,
      isPushToTalk: s.isPushToTalk,
      setMuted: s.setMuted,
      setDeafened: s.setDeafened,
      setVideoEnabled: s.setVideoEnabled,
      setScreenSharing: s.setScreenSharing,
      setPushToTalk: s.setPushToTalk
    }))
  );

/** Voice channel users as array */
export const useVoiceUsers = () =>
  useVoiceStore((s) => Array.from(s.users.values()));

/** Check if currently in a voice channel */
export const useIsInVoiceChannel = (channelId?: string) =>
  useVoiceStore((s) =>
    channelId ? s.currentChannelId === channelId : s.currentChannelId !== null
  );
