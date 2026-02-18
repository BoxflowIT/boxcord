// Socket Module Types
import type { Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';
import type SimplePeer from 'simple-peer';

// Handler context passed to all socket handlers
export interface SocketHandlerContext {
  socket: Socket;
  queryClient: QueryClient;
  getCurrentUserId: () => string | undefined;
  getCurrentWorkspaceId: () => string | undefined;
  isViewingChannel: (channelId: string) => boolean;
  isViewingDM: (channelId: string) => boolean;
}

// Generic handler registration function type
export type RegisterHandlers = (context: SocketHandlerContext) => void;

// Event payloads
export interface MessagePayload {
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    status: string;
    createdAt: string;
  };
  parentId?: string | null;
  attachments?: unknown[];
}

export interface MessageDeletePayload {
  messageId: string;
  channelId: string;
}

export interface TypingPayload {
  userId: string;
  channelId: string;
}

export interface ReactionPayload {
  messageId: string;
  userId: string;
  emoji: string;
  added: boolean;
}

export interface ChannelPayload {
  id: string;
  name: string;
  workspaceId: string;
  type: 'TEXT' | 'VOICE';
}

export interface ChannelDeletePayload {
  channelId: string;
  workspaceId: string;
}

export interface PresencePayload {
  userId: string;
}

export interface UserUpdatePayload {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

// DM Call payloads
export interface DMCallIncomingPayload {
  channelId: string;
  fromUserId: string;
  caller: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface DMCallPayload {
  channelId: string;
  userId: string;
}

// WebRTC payloads
export interface WebRTCOfferPayload {
  fromUserId: string;
  offer: SimplePeer.SignalData;
}

export interface WebRTCAnswerPayload {
  fromUserId: string;
  answer: SimplePeer.SignalData;
}

export interface WebRTCCandidatePayload {
  fromUserId: string;
  candidate: SimplePeer.SignalData;
}

// Voice channel payloads
export interface VoiceUserJoinedPayload {
  userId: string;
  sessionId: string;
}

export interface VoiceUserLeftPayload {
  userId: string;
}

export interface VoiceStateChangedPayload {
  userId: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

export interface VoiceUsersUpdatedPayload {
  channelId: string;
}

export interface PeerDisconnectedPayload {
  userId: string;
}
