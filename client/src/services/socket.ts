// ============================================================================
// SOCKET SERVICE - Re-export from modular implementation
// ============================================================================
// This file re-exports from ./socket/index.ts for backward compatibility.
// The actual implementation is split into:
//   - socket/handlers/messageHandlers.ts - Channel message events
//   - socket/handlers/dmHandlers.ts - DM message + call events
//   - socket/handlers/channelHandlers.ts - Channel lifecycle
//   - socket/handlers/voiceHandlers.ts - Voice/WebRTC events
//   - socket/handlers/presenceHandlers.ts - User presence
// ============================================================================

export { socketService, setQueryClient, getQueryClient } from './socket/index';
