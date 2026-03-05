// Core constants for Boxcord

export const APP_NAME = 'Boxcord';
export const APP_VERSION = '1.0.0';

// Socket.io events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',

  // Channels
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  CHANNEL_TYPING: 'channel:typing',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Reactions
  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:remove',

  // Threads
  THREAD_CREATE: 'thread:create',
  THREAD_CREATED: 'thread:created',
  THREAD_REPLY: 'thread:reply',
  THREAD_REPLY_EDITED: 'thread:reply:edited',
  THREAD_REPLY_DELETED: 'thread:reply:deleted',
  THREAD_REPLY_REACTION: 'thread:reply:reaction',
  THREAD_UPDATED: 'thread:updated',
  THREAD_DELETED: 'thread:deleted',
  THREAD_FOLLOW: 'thread:follow',
  THREAD_READ: 'thread:read',

  // Voice Channels
  VOICE_JOIN: 'voice:join',
  VOICE_LEAVE: 'voice:leave',
  VOICE_STATE: 'voice:state',
  VOICE_USER_JOINED: 'voice:user-joined',
  VOICE_USER_LEFT: 'voice:user-left',
  VOICE_STATE_CHANGED: 'voice:state-changed',
  VOICE_USERS_UPDATED: 'voice:users-updated',

  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  WEBRTC_PEER_DISCONNECTED: 'webrtc:peer-disconnected',

  // Polls
  POLL_CREATED: 'poll:created',
  POLL_VOTED: 'poll:voted',
  POLL_ENDED: 'poll:ended',
  POLL_DELETED: 'poll:deleted',

  // Shared aliases (routes use these; the socket layer uses the base names)
  MESSAGE_DELETED: 'message:delete'
} as const;

// Rate limiting
export const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 30,
  REACTIONS_PER_MINUTE: 60
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100
} as const;

// Poll message prefix - shared between server and client
export const POLL_MESSAGE_PREFIX = '📊 **Omröstning:**';
