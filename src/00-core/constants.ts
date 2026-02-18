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
  WEBRTC_PEER_DISCONNECTED: 'webrtc:peer-disconnected'
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
