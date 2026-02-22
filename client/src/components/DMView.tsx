// ============================================================================
// DM VIEW - Uses React Query for messages
// ============================================================================
// Messages come from React Query (useDMMessages hook)
// NO duplicate storage in local state
// ============================================================================

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '../types';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { voiceService } from '../services/voice.service';
import { startRingingSound, stopRingingSound } from '../utils/voiceSound';
import { useAuthStore } from '../store/auth';
import { useDMCallStore } from '../store/dmCallStore';
import {
  useDMMessages,
  useDMChannels,
  queryKeys,
  useOnlineUsers
} from '../hooks/useQuery';
import type { PaginatedMessages } from '../types';
import { usePinnedDMs } from '../hooks/queries/dm';
import { useMessageActions } from '../hooks/useMessageActions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useProcessedMessages } from '../hooks/useProcessedMessages';
import { useMessageScroll } from '../hooks/useMessageScroll';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useSocketRoom } from '../hooks/useSocketRoom';
import { useDrafts } from '../hooks/useDrafts';
import DeleteConfirmModal from './DeleteConfirmModal';
import { LoadingState } from './ui/LoadingSpinner';
import { DMHeader } from './dm/DMHeader';
import { DMCallOverlay } from './dm/DMCallOverlay';
import MessageListDisplay from './channel/MessageListDisplay';
import DMInputSection from './dm/DMInputSection';
import { PinnedMessagesPanel } from './message/PinnedMessagesPanel';

export default function DMView() {
  const { t } = useTranslation();
  const { channelId } = useParams<{ channelId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { callState, startCall, acceptCall, rejectCall, endCall, reset } =
    useDMCallStore();

  // Read appearance settings (reactive state with auto-sync)
  const [compactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping] = useLocalStorage('messageGrouping', true);

  const { data: dmChannels } = useDMChannels();

  // Get other user's info directly from channel participants (no separate fetch needed)
  const otherUser = useMemo(() => {
    if (!channelId || !dmChannels || !user) return undefined;
    const channel = dmChannels.find((ch) => ch.id === channelId);
    if (!channel) return undefined;
    const otherParticipant = channel.participants.find(
      (p) => p.userId !== user.id
    );
    // Use user data embedded in participant
    return otherParticipant?.user;
  }, [channelId, dmChannels, user]);

  // Get online users for presence status
  const { data: onlineUsers = [] } = useOnlineUsers();
  const isOtherUserOnline = useMemo(() => {
    if (!otherUser) return false;
    return onlineUsers.some((u) => u.id === otherUser.id);
  }, [otherUser, onlineUsers]);

  // React Query hook for messages - single source of truth
  const { data: messagesData, isLoading: loadingMessages } =
    useDMMessages(channelId);

  // Fetch pinned DM messages
  const { data: pinnedMessages = [] } = usePinnedDMs(channelId);

  const loadingUser = !otherUser; // Loading if we don't have other user yet

  // Pre-process messages with computed properties (using shared hook)
  const messages = useProcessedMessages(
    messagesData?.items,
    user?.id,
    messageGrouping
  );
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Shared hooks for common message view patterns
  const messagesEndRef = useMessageScroll(messages);
  useMarkAsRead({ channelId, isDM: true });
  useSocketRoom(channelId, 'dm');

  // Draft management for DMs
  const { loadDraft, saveDraft, clearDraft } = useDrafts(channelId);

  // Load draft when channel changes
  useEffect(() => {
    if (channelId) {
      const draft = loadDraft();
      setInputValue(draft);
    }
  }, [channelId, loadDraft]);

  // Handle call ringing sound and timeout
  useEffect(() => {
    // Start ringing sound for outgoing (calling) or incoming (ringing) calls
    if (callState === 'calling' || callState === 'ringing') {
      startRingingSound();

      // Auto-cancel call after 45 seconds if not answered
      const timeout = setTimeout(() => {
        if (callState === 'calling' || callState === 'ringing') {
          logger.log('[DM_CALL] Call timeout - auto canceling');
          stopRingingSound();

          // Cancel/reject call
          if (channelId) {
            if (callState === 'calling') {
              // Caller cancels
              socketService.getSocket()?.emit('dm:call:end', { channelId });
            } else {
              // Receiver auto-rejects
              socketService.getSocket()?.emit('dm:call:reject', { channelId });
            }
          }
          reset();
        }
      }, 45000); // 45 seconds

      return () => {
        clearTimeout(timeout);
        stopRingingSound();
      };
    } else {
      // Stop ringing when call is answered, rejected, or ended
      stopRingingSound();
    }
  }, [callState, channelId, reset]);

  // DM Voice Call handlers (in order of dependencies)
  const handleEndCall = useCallback(async () => {
    if (!channelId) return;
    endCall();

    try {
      await voiceService.leaveDMCall();
      socketService.getSocket()?.emit('dm:call:end', { channelId });
    } catch (err) {
      logger.error('Failed to end DM call:', err);
    } finally {
      reset();
    }
  }, [channelId, endCall, reset]);

  const handleStartCall = useCallback(() => {
    if (!channelId || !otherUser) return;

    if (callState === 'idle') {
      // Start new call
      startCall(
        channelId,
        otherUser.id,
        otherUser.firstName ?? otherUser.email
      );
      socketService
        .getSocket()
        ?.emit('dm:call:start', { channelId, targetUserId: otherUser.id });
    } else if (callState === 'ringing') {
      // Answer incoming call (handled in overlay)
      return;
    } else {
      // End ongoing call
      handleEndCall();
    }
  }, [channelId, otherUser, callState, startCall, handleEndCall]);

  const handleAcceptCall = useCallback(async () => {
    if (!channelId || !otherUser) return;
    acceptCall();

    // Join WebRTC call (reuse voice service logic)
    try {
      await voiceService.joinDMCall(channelId);
      // Join dm-voice room for WebRTC signaling
      socketService.getSocket()?.emit('dm:call:accept', { channelId });
    } catch (err) {
      logger.error('Failed to join DM call:', err);
      reset();
    }
  }, [channelId, otherUser, acceptCall, reset]);

  const handleRejectCall = useCallback(() => {
    if (!channelId) return;
    rejectCall();
    socketService.getSocket()?.emit('dm:call:reject', { channelId });
  }, [channelId, rejectCall]);

  // Stable callbacks for message actions - optimistic cache update + WebSocket
  const handleEditDM = useCallback(
    async (messageId: string, content: string) => {
      // Optimistic update
      if (channelId) {
        const cacheKey = queryKeys.dmMessages(channelId, undefined);
        queryClient.setQueryData<PaginatedMessages>(cacheKey, (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((m) =>
              m.id === messageId ? { ...m, content, edited: true } : m
            )
          };
        });
      }
      // Send to server via WebSocket
      socketService.editDM(messageId, content);
    },
    [channelId, queryClient]
  );

  const handleDeleteDM = useCallback(
    async (messageId: string) => {
      // Optimistic update - remove from cache immediately
      if (channelId) {
        const cacheKey = queryKeys.dmMessages(channelId, undefined);
        queryClient.setQueryData<PaginatedMessages>(cacheKey, (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.filter((m) => m.id !== messageId)
          };
        });
        // Also remove from pinned DMs if present
        queryClient.setQueryData<Message[]>(['pinnedDMs', channelId], (old) => {
          if (!old) return old;
          return old.filter((m) => m.id !== messageId);
        });
      }
      // Send to server via WebSocket
      socketService.deleteDM(messageId, channelId!);
    },
    [channelId, queryClient]
  );

  const {
    editingMessageId,
    editContent,
    deleteMessageId,
    editTextareaRef,
    handleEditMessage,
    handleSaveEdit: saveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleConfirmDelete: confirmDelete,
    handleCancelDelete,
    setEditContent
  } = useMessageActions({
    onEdit: handleEditDM,
    onDelete: handleDeleteDM
  });

  const handleSend = async () => {
    if (!inputValue.trim() || !channelId || sending) return;

    const content = inputValue.trim();
    setInputValue('');
    clearDraft(); // Clear saved draft
    setSending(true);

    try {
      // Send via WebSocket only - it will update React Query cache
      socketService.sendDM(channelId, content);
    } catch (err) {
      logger.error('Failed to send DM:', err);
      // Restore input on error
      setInputValue(content);
      saveDraft(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!channelId) return;

    // For now, we need a message to attach to
    // In a real implementation, you'd create a message with attachment in one call
    setUploading(true);
    try {
      // First send a message
      const message = await api.sendDM(channelId, `📎 ${file.name}`);
      // Then upload the file
      await api.uploadDMFile(message.id, file);
      // React Query cache will be updated automatically via WebSocket
      // or you could invalidate the query to refetch
    } catch (err) {
      logger.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (!channelId) return;

    setSending(true);
    try {
      // Send GIF URL as a message
      await api.sendDM(channelId, gifUrl);
      // React Query will update automatically
    } catch (err) {
      logger.error('Failed to send GIF:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart ?? inputValue.length;
    const newValue =
      inputValue.slice(0, cursorPos) + emoji + inputValue.slice(cursorPos);
    setInputValue(newValue);

    // Focus and place cursor after emoji
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = cursorPos + emoji.length;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Transform messages to match MessageListDisplay expected format
  const displayMessages = useMemo(() => {
    const getUserName = (authorId: string) => {
      if (authorId === user?.id) return 'Du';
      return otherUser?.firstName ?? otherUser?.email ?? 'Unknown';
    };

    const getAvatar = (userId: string) => {
      if (userId === user?.id) return user?.avatarUrl;
      return otherUser?.avatarUrl;
    };

    return messages.map((message) => ({
      ...message,
      author: {
        firstName: getUserName(message.authorId),
        avatarUrl: getAvatar(message.authorId)
      }
    }));
  }, [messages, user, otherUser]);

  if (!otherUser || loadingUser) {
    return <LoadingState text={t('dm.loadingUser')} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <DMHeader
        channelId={channelId!}
        otherUserId={otherUser.id}
        userName={otherUser.firstName ?? otherUser.email}
        userInitial={(
          otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)
        ).toUpperCase()}
        avatarUrl={otherUser.avatarUrl}
        isOnline={isOtherUserOnline}
        onStartCall={handleStartCall}
      />

      {/* Pinned Messages */}
      <PinnedMessagesPanel
        pinnedMessages={pinnedMessages.map((msg) => ({
          ...msg,
          isPinned: msg.isPinned ?? true
        }))}
        onMessageClick={(messageId) => {
          // Scroll to message
          const element = document.getElementById(`message-${messageId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onUnpin={async (messageId) => {
          if (!channelId) return;

          try {
            // Unpin the message
            await api.unpinDM(messageId, channelId);

            // Directly update cache - remove from pinned list
            queryClient.setQueryData<Message[]>(
              ['pinnedDMs', channelId],
              (old) => old?.filter((m) => m.id !== messageId) ?? []
            );

            // Update message in messages list
            queryClient.setQueryData(
              ['dmMessages', channelId],
              (old: { items: Message[] } | undefined) => {
                if (!old?.items) return old;
                return {
                  ...old,
                  items: old.items.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          isPinned: false,
                          pinnedAt: null,
                          pinnedBy: null
                        }
                      : m
                  )
                };
              }
            );
          } catch (error) {
            console.error('Failed to unpin message:', error);
          }
        }}
        canUnpin={true}
      />

      {/* DM Call Overlay */}
      <DMCallOverlay
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEndCall={handleEndCall}
      />

      {/* Messages */}
      <MessageListDisplay
        messages={displayMessages}
        loading={loadingMessages}
        channelName={otherUser.firstName ?? otherUser.email}
        currentUserId={user?.id}
        currentUserAvatar={user?.avatarUrl}
        editingMessageId={editingMessageId}
        editContent={editContent}
        editTextareaRef={editTextareaRef}
        compactMode={compactMode}
        isDM={true}
        onEditContentChange={setEditContent}
        onSaveEdit={saveEdit}
        onCancelEdit={handleCancelEdit}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onPin={async (messageId) => {
          const message = displayMessages.find((m) => m.id === messageId);

          if (!message || !channelId) {
            return;
          }

          try {
            let updatedMessage: Message;
            if (message.isPinned) {
              updatedMessage = await api.unpinDM(messageId, channelId);

              // Directly update cache - remove from pinned list
              queryClient.setQueryData<Message[]>(
                ['pinnedDMs', channelId],
                (old) => old?.filter((m) => m.id !== messageId) ?? []
              );
            } else {
              updatedMessage = await api.pinDM(messageId, channelId);

              // Directly update cache - add to pinned list
              queryClient.setQueryData<Message[]>(
                ['pinnedDMs', channelId],
                (old) => {
                  if (!old) return [updatedMessage];
                  // Add if not already in list
                  if (old.some((m) => m.id === messageId)) return old;
                  return [...old, updatedMessage];
                }
              );
            }

            // Update message in messages list
            queryClient.setQueryData(
              ['dmMessages', channelId],
              (old: { items: Message[] } | undefined) => {
                if (!old?.items) return old;
                return {
                  ...old,
                  items: old.items.map((m) =>
                    m.id === messageId
                      ? {
                          ...m,
                          isPinned: updatedMessage.isPinned,
                          pinnedAt: updatedMessage.pinnedAt,
                          pinnedBy: updatedMessage.pinnedBy
                        }
                      : m
                  )
                };
              }
            );
          } catch (error) {
            console.error('Failed to pin/unpin message:', error);
          }
        }}
        canPin={true}
        messagesEndRef={messagesEndRef}
      />

      {/* Input */}
      <DMInputSection
        userName={otherUser.firstName ?? otherUser.email}
        inputValue={inputValue}
        uploading={uploading}
        sending={sending}
        textareaRef={textareaRef}
        onInputChange={(e) => {
          setInputValue(e.target.value);
          saveDraft(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFileSelect={handleFileSelect}
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteMessageId}
        onCancel={handleCancelDelete}
        onConfirm={confirmDelete}
        title={t('messages.delete')}
        message={t('messages.deleteConfirm')}
      />
    </div>
  );
}
