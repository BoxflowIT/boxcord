// ============================================================================
// CHANNEL VIEW - Uses React Query for messages
// ============================================================================
// Messages come from React Query (useMessages hook)
// NO duplicate storage in Zustand
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useMessages, useChannels } from '../hooks/useQuery';
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

interface ChannelViewProps {
  onToggleMemberList?: () => void;
}

export default function ChannelView({ onToggleMemberList }: ChannelViewProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const { currentChannel, setCurrentChannel, currentWorkspace } =
    useChatStore();
  const { user } = useAuthStore();

  // Read appearance settings (reactive state with auto-sync)
  const [compactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping] = useLocalStorage('messageGrouping', true);

  // React Query - single source of truth for server data
  const { data: messagesData, isLoading: loadingMessages } =
    useMessages(channelId);
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

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
    channelId,
    workspaceId: currentWorkspace?.id,
    isDM: false
  });
  useSocketRoom(channelId, 'channel');

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
