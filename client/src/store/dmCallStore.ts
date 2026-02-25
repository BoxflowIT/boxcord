/**
 * DM Voice Call Store
 * Manages 1-on-1 voice calls in direct messages
 * Audio state (isMuted, isDeafened) is managed by voiceStore
 */
import { create } from 'zustand';

export type DMCallState =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connected'
  | 'ending';

interface DMCallStore {
  // Call state
  callState: DMCallState;
  channelId: string | null;
  otherUserId: string | null;
  otherUserName: string | null;

  // Actions
  startCall: (
    channelId: string,
    otherUserId: string,
    otherUserName: string
  ) => void;
  receiveCall: (
    channelId: string,
    otherUserId: string,
    otherUserName: string
  ) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  reset: () => void;
}

export const useDMCallStore = create<DMCallStore>((set) => ({
  // Initial state
  callState: 'idle',
  channelId: null,
  otherUserId: null,
  otherUserName: null,

  // Start outgoing call
  startCall: (channelId, otherUserId, otherUserName) =>
    set({
      callState: 'calling',
      channelId,
      otherUserId,
      otherUserName
    }),

  // Receive incoming call
  receiveCall: (channelId, otherUserId, otherUserName) =>
    set({
      callState: 'ringing',
      channelId,
      otherUserId,
      otherUserName
    }),

  // Accept incoming call
  acceptCall: () => set({ callState: 'connected' }),

  // Reject incoming call
  rejectCall: () =>
    set({
      callState: 'idle',
      channelId: null,
      otherUserId: null,
      otherUserName: null
    }),

  // End call (same as reset - no intermediate 'ending' state needed)
  endCall: () =>
    set({
      callState: 'idle',
      channelId: null,
      otherUserId: null,
      otherUserName: null
    }),

  // Reset state
  reset: () =>
    set({
      callState: 'idle',
      channelId: null,
      otherUserId: null,
      otherUserName: null
    })
}));
