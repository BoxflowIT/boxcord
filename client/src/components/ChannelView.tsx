// ============================================================================
// CHANNEL VIEW - Uses React Query for messages
// ============================================================================
// Messages come from React Query (useMessages hook)
// NO duplicate storage in Zustand
// ============================================================================

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useMessages, useChannels, queryKeys } from '../hooks/useQuery';
import { useMessageActions } from '../hooks/useMessageActions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useChannelInput } from '../hooks/useChannelInput';
import DeleteConfirmModal from './DeleteConfirmModal';
import { ChannelHeader } from './channel/ChannelHeader';
import { BotResponseBanner } from './channel';
import MessageListDisplay from './channel/MessageListDisplay';
import ChannelInputSection from './channel/ChannelInputSection';
import {
  groupReactionsByEmoji,
  shouldShowMessageHeader
} from '../utils/messageUtils';

interface ChannelViewProps {
  onToggleMemberList?: () => void;
}

export default function ChannelView({ onToggleMemberList }: ChannelViewProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const { currentChannel, setCurrentChannel, currentWorkspace } =
    useChatStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Read appearance settings (reactive state with auto-sync)
  const [compactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping] = useLocalStorage('messageGrouping', true);

  // React Query - single source of truth for server data
  const { data: messagesData, isLoading: loadingMessages } =
    useMessages(channelId);
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

  // Pre-process messages with computed properties (memoized for stable references)
  const channelMessages = useMemo(() => {
    const rawMessages = messagesData?.items ?? [];
    return rawMessages.map((message, index) => {
      const prevMessage = rawMessages[index - 1];
      const msg = message as typeof message & {
        attachments?: Array<{
          id: string;
          fileName: string;
          fileUrl: string;
          fileType: string;
          fileSize: number;
        }>;
        reactions?: Array<{ emoji: string; userId: string }>;
      };

      return {
        ...message,
        attachments: msg.attachments,
        reactionCounts: groupReactionsByEmoji(msg.reactions, user?.id),
        showHeader: messageGrouping
          ? shouldShowMessageHeader(
              message.authorId,
              message.createdAt,
              prevMessage?.authorId,
              prevMessage?.createdAt
            )
          : true
      };
    });
  }, [messagesData?.items, user?.id, messageGrouping]);

  const [uploading, setUploading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [botResponse, setBotResponse] = useState<{
    content: string;
    isPrivate: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    channelId,
    onShowMentions: setShowMentions,
    onShowSlashCommands: setShowSlashCommands
  });

  // Stable callbacks for message actions - WebSocket ONLY (no API calls)
  const handleEditChannelMessage = useCallback(
    async (messageId: string, content: string) => {
      socketService.editMessage(messageId, content);
    },
    []
  );

  const handleDeleteChannelMessage = useCallback(async (messageId: string) => {
    socketService.deleteMessage(messageId);
  }, []);

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
    if (!channelId) return;
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
    }
  }, [channelId, channels, setCurrentChannel]);

  // Join/leave channel room (separate effect to avoid unnecessary rejoins)
  useEffect(() => {
    if (!channelId) return;
    socketService.joinChannel(channelId);

    return () => {
      socketService.leaveChannel(channelId);
    };
  }, [channelId]);

  // Mark channel as read after viewing for 1 second
  useEffect(() => {
    if (!channelId || !currentWorkspace?.id) return;

    const timer = setTimeout(async () => {
      try {
        await api.post(`/channels/${channelId}/read`);

        // Invalidate channels query to refresh unread counts
        queryClient.invalidateQueries({
          queryKey: queryKeys.channels(currentWorkspace.id)
        });
      } catch (error) {
        logger.error('Failed to mark channel as read:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [channelId, currentWorkspace?.id, queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

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

  return (
    <>
      {/* Header */}
      <ChannelHeader
        channelName={currentChannel?.name ?? 'Kanal'}
        channelDescription={currentChannel?.description}
        onToggleMemberList={onToggleMemberList}
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
        onMentionSelect={handleMentionSelect}
        onSlashCommandSelect={handleSlashCommandSelect}
        onCloseMentions={() => setShowMentions(false)}
        onCloseSlashCommands={() => setShowSlashCommands(false)}
      />

      {/* Delete Message Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteMessageId}
        title="Ta bort meddelande"
        message="Är du säker på att du vill ta bort det här meddelandet? Detta kan inte ångras."
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
