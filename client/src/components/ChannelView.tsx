// ============================================================================
// CHANNEL VIEW - Uses React Query for messages
// ============================================================================
// Messages come from React Query (useMessages hook)
// NO duplicate storage in Zustand
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '../types';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useMessages, useChannels, queryKeys } from '../hooks/useQuery';
import type { PaginatedMessages } from '../types';
import { usePinnedMessages } from '../hooks/queries/message';
import { useMessageActions } from '../hooks/useMessageActions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useChannelInput } from '../hooks/useChannelInput';
import { useProcessedMessages } from '../hooks/useProcessedMessages';
import { useMessageScroll } from '../hooks/useMessageScroll';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useSocketRoom } from '../hooks/useSocketRoom';
import DeleteConfirmModal from './DeleteConfirmModal';
import { ChannelHeader } from './channel/ChannelHeader';
import { BotResponseBanner } from './channel';
import MessageListDisplay from './channel/MessageListDisplay';
import ChannelInputSection from './channel/ChannelInputSection';
import { VoiceChannelView } from './voice/VoiceChannelView';
import { PinnedMessagesPanel } from './message/PinnedMessagesPanel';

interface ChannelViewProps {
  onToggleMemberList?: () => void;
}

export default function ChannelView({ onToggleMemberList }: ChannelViewProps) {
  const { t } = useTranslation();
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentChannel, setCurrentChannel, currentWorkspace } =
    useChatStore();
  const { user } = useAuthStore();

  // Read appearance settings (reactive state with auto-sync)
  const [compactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping] = useLocalStorage('messageGrouping', true);

  // React Query - single source of truth for server data
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

  // Check if channel exists before fetching messages
  const channelExists =
    channels.length === 0 || channels.some((c) => c.id === channelId);

  const { data: messagesData, isLoading: loadingMessages } = useMessages(
    channelExists ? channelId : undefined
  );

  // Fetch pinned messages
  const { data: pinnedMessages = [] } = usePinnedMessages(
    channelExists ? channelId : undefined
  );

  // Pre-process messages with computed properties (using shared hook)
  const processedMessages = useProcessedMessages(
    messagesData?.items,
    user?.id,
    messageGrouping
  );

  // Add attachments to processed messages
  const channelMessages = processedMessages.map((message) => {
    const rawMsg = messagesData?.items?.find((m) => m.id === message.id) as
      | (typeof message & {
          attachments?: Array<{
            id: string;
            fileName: string;
            fileUrl: string;
            fileType: string;
            fileSize: number;
          }>;
        })
      | undefined;

    return {
      ...message,
      attachments: rawMsg?.attachments
    };
  });

  const [uploading, setUploading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [botResponse, setBotResponse] = useState<{
    content: string;
    isPrivate: boolean;
  } | null>(null);

  // Shared hooks for common message view patterns
  const messagesEndRef = useMessageScroll(channelMessages);
  useMarkAsRead({
    channelId: channelExists ? channelId : undefined,
    workspaceId: currentWorkspace?.id,
    isDM: false
  });
  useSocketRoom(channelExists ? channelId : undefined, 'channel');

  const {
    inputValue,
    cursorPosition,
    textareaRef,
    handleInputChange,
    handleMentionSelect,
    handleSlashCommandSelect,
    handleEmojiSelect,
    clearInput
  } = useChannelInput({
    channelId: channelExists ? channelId : undefined,
    onShowMentions: setShowMentions,
    onShowSlashCommands: setShowSlashCommands
  });

  // Stable callbacks for message actions - optimistic cache update + WebSocket
  const handleEditChannelMessage = useCallback(
    async (messageId: string, content: string) => {
      // Optimistic update
      if (channelId) {
        const cacheKey = queryKeys.messages(channelId, undefined);
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
      socketService.editMessage(messageId, content);
    },
    [channelId, queryClient]
  );

  const handleDeleteChannelMessage = useCallback(
    async (messageId: string) => {
      // Optimistic update - remove from cache immediately
      if (channelId) {
        const cacheKey = queryKeys.messages(channelId, undefined);
        queryClient.setQueryData<PaginatedMessages>(cacheKey, (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.filter((m) => m.id !== messageId)
          };
        });
        // Also remove from pinned messages if present
        queryClient.setQueryData<Message[]>(
          ['pinnedMessages', channelId],
          (old) => {
            if (!old) return old;
            return old.filter((m) => m.id !== messageId);
          }
        );
      }
      // Send to server via WebSocket
      socketService.deleteMessage(messageId);
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
    onEdit: handleEditChannelMessage,
    onDelete: handleDeleteChannelMessage
  });

  // Set current channel when it changes
  useEffect(() => {
    if (!channelId || channels.length === 0) return;

    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
    } else {
      // Channel not found - redirect to first available channel or #general
      const defaultChannel =
        channels.find((c) => c.id === 'ch-general') || channels[0];
      if (defaultChannel) {
        logger.warn(
          `Channel ${channelId} not found, redirecting to ${defaultChannel.name}`
        );
        navigate(`/channel/${defaultChannel.id}`);
      }
    }
  }, [channelId, channels, setCurrentChannel, navigate]);

  const handleSend = async () => {
    if (!inputValue.trim() || !channelId) return;

    const content = inputValue.trim();
    clearInput();

    // Handle slash commands
    if (content.startsWith('/')) {
      try {
        const result = await api.post<{
          content: string;
          isPrivate?: boolean;
        }>('/chatbot/execute', {
          command: content,
          channelId,
          workspaceId: currentChannel?.workspaceId
        });

        if (result.data) {
          if (result.data.isPrivate) {
            // Show ephemeral response
            setBotResponse({
              content: result.data.content,
              isPrivate: true
            });
            // Auto-dismiss after 10 seconds
            setTimeout(() => setBotResponse(null), 10000);
          } else {
            // Public response will come through socket
          }
        }
      } catch {
        setBotResponse({
          content: '❌ Kunde inte köra kommandot',
          isPrivate: true
        });
        setTimeout(() => setBotResponse(null), 5000);
      }
      return;
    }

    // Regular message
    socketService.sendMessage(channelId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle Enter/Tab if autocomplete is open (it handles them)
    if (
      (showMentions || showSlashCommands) &&
      ['Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)
    ) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!channelId) return;

    setUploading(true);
    try {
      // First send a message mentioning the file
      socketService.sendMessage(channelId, `📎 ${file.name}`);
      // Note: In a real implementation, you'd create a message and upload in one call
      // For now, this is a simplified version
    } catch (err) {
      logger.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    if (!channelId) return;

    // Send GIF as a message with the URL
    // The message will be rendered as an image in MessageItem
    socketService.sendMessage(channelId, gifUrl);
  };

  // Voice channel view
  if (currentChannel?.type === 'VOICE') {
    return (
      <VoiceChannelView
        channelId={channelId!}
        channelName={currentChannel.name}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <ChannelHeader
        channelName={currentChannel?.name ?? t('channels.channel')}
        channelDescription={currentChannel?.description}
        onToggleMemberList={onToggleMemberList}
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
            await api.unpinMessage(messageId, channelId);

            // Directly update cache - remove from pinned list
            queryClient.setQueryData<Message[]>(
              ['pinnedMessages', channelId],
              (old) => old?.filter((m) => m.id !== messageId) ?? []
            );

            // Update message in messages list
            queryClient.setQueryData(
              ['messages', channelId],
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

      {/* Messages */}
      <MessageListDisplay
        messages={channelMessages}
        loading={loadingMessages}
        channelName={currentChannel?.name}
        currentUserId={user?.id}
        currentUserAvatar={user?.avatarUrl}
        editingMessageId={editingMessageId}
        editContent={editContent}
        editTextareaRef={editTextareaRef}
        compactMode={compactMode}
        onEditContentChange={setEditContent}
        onSaveEdit={saveEdit}
        onCancelEdit={handleCancelEdit}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onPin={async (messageId) => {
          const message = channelMessages.find((m) => m.id === messageId);
          if (!message || !channelId) return;

          try {
            let updatedMessage: Message;
            if (message.isPinned) {
              updatedMessage = await api.unpinMessage(messageId, channelId);

              // Directly update cache - remove from pinned list
              queryClient.setQueryData<Message[]>(
                ['pinnedMessages', channelId],
                (old) => old?.filter((m) => m.id !== messageId) ?? []
              );
            } else {
              updatedMessage = await api.pinMessage(messageId, channelId);

              // Directly update cache - add to pinned list
              queryClient.setQueryData<Message[]>(
                ['pinnedMessages', channelId],
                (old) => {
                  if (!old) return [updatedMessage];
                  if (old.some((m) => m.id === messageId)) return old;
                  return [...old, updatedMessage];
                }
              );
            }

            // Update message in messages list
            queryClient.setQueryData(
              ['messages', channelId],
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

      {/* Ephemeral bot response */}
      {botResponse && (
        <div className="px-4 pb-2">
          <BotResponseBanner
            content={botResponse.content}
            isPrivate={botResponse.isPrivate}
            onDismiss={() => setBotResponse(null)}
          />
        </div>
      )}

      {/* Input */}
      <ChannelInputSection
        channelName={currentChannel?.name}
        inputValue={inputValue}
        cursorPosition={cursorPosition}
        uploading={uploading}
        showMentions={showMentions}
        showSlashCommands={showSlashCommands}
        textareaRef={textareaRef}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFileSelect={handleFileSelect}
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
        onMentionSelect={handleMentionSelect}
        onSlashCommandSelect={handleSlashCommandSelect}
        onCloseMentions={() => setShowMentions(false)}
        onCloseSlashCommands={() => setShowSlashCommands(false)}
      />

      {/* Delete Message Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteMessageId}
        title={t('messages.delete')}
        message={t('messages.deleteConfirm')}
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
