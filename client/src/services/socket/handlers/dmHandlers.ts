// DM Event Handlers - Direct messages and DM voice calls
import { queryKeys } from '../../../hooks/useQuery';
import { useDMCallStore } from '../../../store/dmCallStore';
import { useVoiceStore } from '../../../store/voiceStore';
import { voiceService } from '../../voice.service';
import { playMessageNotification } from '../../../utils/notificationSound';
import { logger } from '../../../utils/logger';
import type { PaginatedMessages, DMChannel, Message } from '../../../types';
import type SimplePeer from 'simple-peer';
import type { SocketHandlerContext } from '../types';

// Map for legacy handlers
const dmMessageHandlers = new Map<string, (message: Message) => void>();
const dmEditHandlers = new Map<string, (message: Message) => void>();
const dmDeleteHandlers = new Map<
  string,
  (data: { messageId: string }) => void
>();

export function registerDMHandlers(
  context: SocketHandlerContext,
  emit: (event: string, data: unknown) => void
): void {
  const { socket, queryClient, getCurrentUserId, isViewingDM } = context;

  // dm:new - New DM message
  socket.on('dm:new', async (message: Message) => {
    const currentUserId = getCurrentUserId();
    const isOwnMessage = message.authorId === currentUserId;
    const isViewing = isViewingDM(message.channelId);

    console.log('[DM:NEW]', {
      messageId: message.id,
      channelId: message.channelId,
      isViewingDM: isViewing,
      isOwnMessage
    });

    if (message.channelId) {
      // Always update message cache directly (faster than invalidate + refetch)
      const dmKey = queryKeys.dmMessages(message.channelId, undefined);
      queryClient.setQueryData<PaginatedMessages>(dmKey, (old) => {
        if (!old) return { items: [message], hasMore: false };
        if (!old.items) return { ...old, items: [message] };
        if (old.items.some((m) => m.id === message.id)) return old;
        return { ...old, items: [...old.items, message] };
      });

      // If viewing this DM and not own message, mark as read immediately
      if (isViewing && !isOwnMessage) {
        try {
          const { api } = await import('../../api');
          await api.markDMAsRead(message.channelId);
          // Update unreadCount to 0 immediately in cache
          queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
            if (!old) return old;
            return old.map((ch) =>
              ch.id === message.channelId ? { ...ch, unreadCount: 0 } : ch
            );
          });
          logger.log('[DM:NEW] Auto-marked as read, cache updated');
        } catch (err) {
          logger.error('[DM:NEW] Failed to auto-mark as read:', err);
        }
      } else if (!isOwnMessage) {
        // Not viewing: increment unreadCount in cache
        queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
          if (!old) return old;
          return old.map((ch) =>
            ch.id === message.channelId
              ? { ...ch, unreadCount: (ch.unreadCount ?? 0) + 1 }
              : ch
          );
        });
        // Play sound if not own message AND not currently viewing
        playMessageNotification();
      }
    }

    // Also notify any active DM handlers (legacy support)
    dmMessageHandlers.forEach((handler) => handler(message));
  });

  // dm:edit - DM message edited
  socket.on('dm:edit', (message: Message) => {
    if (message.channelId) {
      queryClient.setQueryData<PaginatedMessages>(
        queryKeys.dmMessages(message.channelId),
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((m) => (m.id === message.id ? message : m))
          };
        }
      );
    }

    dmEditHandlers.forEach((handler) => handler(message));
  });

  // dm:delete - DM message deleted
  socket.on(
    'dm:delete',
    ({ messageId, channelId }: { messageId: string; channelId?: string }) => {
      if (channelId) {
        queryClient.setQueryData<PaginatedMessages>(
          queryKeys.dmMessages(channelId),
          (old) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.filter((m) => m.id !== messageId)
            };
          }
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['dmMessages'] });
      }

      dmDeleteHandlers.forEach((handler) => handler({ messageId }));
    }
  );

  // dm:pinned - DM message pinned
  socket.on('dm:pinned', (message: Message) => {
    if (!message || !message.id) {
      return;
    }
    
    if (message.channelId) {
      // Update message in dmMessages cache with isPinned: true
      queryClient.setQueryData<PaginatedMessages>(
        queryKeys.dmMessages(message.channelId),
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((m) => 
              m.id === message.id 
                ? { ...m, isPinned: true, pinnedAt: message.pinnedAt, pinnedBy: message.pinnedBy }
                : m
            )
          };
        }
      );

      // Add to pinnedDMs cache immediately (optimistic update)
      queryClient.setQueryData<Message[]>(
        ['pinnedDMs', message.channelId],
        (old) => {
          if (!old) return [message];
          // Add if not already in list
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, { ...message, isPinned: true }];
        }
      );
    }
  });

  // dm:unpinned - DM message unpinned
  socket.on('dm:unpinned', (message: Message) => {
    if (message.channelId) {
      // Update message in dmMessages cache with isPinned: false
      queryClient.setQueryData<PaginatedMessages>(
        queryKeys.dmMessages(message.channelId),
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((m) => 
              m.id === message.id 
                ? { ...m, isPinned: false, pinnedAt: null, pinnedBy: null }
                : m
            )
          };
        }
      );

      // Remove from pinnedDMs cache immediately (optimistic update)
      queryClient.setQueryData<Message[]>(
        ['pinnedDMs', message.channelId],
        (old) => {
          if (!old) return old;
          return old.filter((m) => m.id !== message.id);
        }
      );
    }
  });

  // dm:typing - Typing indicator (placeholder)
  socket.on('dm:typing', () => {
    // Handle DM typing indicator
  });

  // ============================================
  // DM VOICE CALL EVENTS
  // ============================================

  interface DMCallIncoming {
    channelId: string;
    fromUserId: string;
    caller: { id: string; name: string; email: string; avatarUrl?: string };
  }

  interface DMCallPayload {
    channelId: string;
    userId: string;
  }

  // Incoming DM call
  socket.on('dm:call:incoming', (data: DMCallIncoming) => {
    logger.log('[DM_CALL] Incoming call from:', data.caller.name);
    useDMCallStore
      .getState()
      .receiveCall(data.channelId, data.fromUserId, data.caller.name);
  });

  // Call accepted
  socket.on('dm:call:accepted', async (data: DMCallPayload) => {
    logger.log('[DM_CALL] Call accepted by:', data.userId);

    const callState = useDMCallStore.getState();
    if (
      callState.callState === 'calling' &&
      callState.channelId === data.channelId
    ) {
      try {
        await voiceService.joinDMCall(data.channelId);
        callState.acceptCall();

        // Create peer connection as initiator
        const peer = voiceService.createPeer(data.userId);

        // Send offer via socket
        peer.on('signal', (signal: SimplePeer.SignalData) => {
          emit('dm:webrtc:offer', {
            channelId: data.channelId,
            targetUserId: data.userId,
            offer: signal
          });
        });
      } catch (err) {
        logger.error('Failed to join DM call:', err);
        callState.reset();
      }
    }
  });

  // Call rejected
  socket.on('dm:call:rejected', (data: DMCallPayload) => {
    logger.log('[DM_CALL] Call rejected by:', data.userId);
    const callState = useDMCallStore.getState();
    if (callState.channelId === data.channelId) {
      callState.reset();
    }
  });

  // Call ended
  socket.on('dm:call:ended', async (data: DMCallPayload) => {
    logger.log('[DM_CALL] Call ended by:', data.userId);
    const callState = useDMCallStore.getState();
    if (callState.channelId === data.channelId) {
      await voiceService.leaveDMCall();
      callState.reset();
    }
  });

  // DM WebRTC Offer
  socket.on(
    'dm:webrtc:offer',
    (data: { fromUserId: string; offer: SimplePeer.SignalData }) => {
      logger.log('[DM_WEBRTC] Received offer from:', data.fromUserId);

      // Add peer (we are not the initiator)
      const peer = voiceService.addPeer(data.fromUserId, data.offer);

      // Send answer via socket
      peer.on('signal', (signal: SimplePeer.SignalData) => {
        const callState = useDMCallStore.getState();
        emit('dm:webrtc:answer', {
          channelId: callState.channelId,
          targetUserId: data.fromUserId,
          answer: signal
        });
      });
    }
  );

  // DM WebRTC Answer
  socket.on(
    'dm:webrtc:answer',
    (data: { fromUserId: string; answer: SimplePeer.SignalData }) => {
      handleWebRTCSignal(data.fromUserId, data.answer, 'answer');
    }
  );

  // DM WebRTC ICE Candidate
  socket.on(
    'dm:webrtc:ice-candidate',
    (data: { fromUserId: string; candidate: SimplePeer.SignalData }) => {
      handleWebRTCSignal(data.fromUserId, data.candidate, 'candidate');
    }
  );
}

// Helper: Handle WebRTC signal
function handleWebRTCSignal(
  fromUserId: string,
  signalData: SimplePeer.SignalData,
  signalType: 'answer' | 'candidate'
): void {
  logger.log(`[WEBRTC] Received ${signalType} from:`, fromUserId);

  const store = useVoiceStore.getState();
  const peer = store.peers.get(fromUserId);

  if (peer) {
    peer.signal(signalData);
  } else {
    logger.warn(
      `[WEBRTC] No peer found for ${fromUserId} when receiving ${signalType}`
    );
  }
}

// Export legacy handler registration functions
export function onDMMessage(id: string, handler: (message: Message) => void) {
  dmMessageHandlers.set(id, handler);
}

export function offDMMessage(id: string) {
  dmMessageHandlers.delete(id);
}

export function onDMEdit(id: string, handler: (message: Message) => void) {
  dmEditHandlers.set(id, handler);
}

export function offDMEdit(id: string) {
  dmEditHandlers.delete(id);
}

export function onDMDelete(
  id: string,
  handler: (data: { messageId: string }) => void
) {
  dmDeleteHandlers.set(id, handler);
}

export function offDMDelete(id: string) {
  dmDeleteHandlers.delete(id);
}
