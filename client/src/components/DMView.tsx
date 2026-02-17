// ============================================================================
// DM VIEW - Uses React Query for messages
// ============================================================================
// Messages come from React Query (useDMMessages hook)
// NO duplicate storage in local state
// ============================================================================

import { useRef, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { useDMMessages, useDMChannels } from '../hooks/useQuery';
import { useMessageActions } from '../hooks/useMessageActions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useProcessedMessages } from '../hooks/useProcessedMessages';
import { useMessageScroll } from '../hooks/useMessageScroll';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useSocketRoom } from '../hooks/useSocketRoom';
import DeleteConfirmModal from './DeleteConfirmModal';
import { LoadingState } from './ui/LoadingSpinner';
import { DMHeader } from './dm/DMHeader';
import MessageListDisplay from './channel/MessageListDisplay';
import DMInputSection from './dm/DMInputSection';

export default function DMView() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuthStore();

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

  // React Query hook for messages - single source of truth
  const { data: messagesData, isLoading: loadingMessages } =
    useDMMessages(channelId);

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

  // Stable callbacks for message actions
  const handleEditDM = useCallback(
    async (messageId: string, content: string) => {
      socketService.editDM(messageId, content);
    },
    []
  );

  const handleDeleteDM = useCallback(
    async (messageId: string) => {
      if (channelId) {
        socketService.deleteDM(messageId, channelId);
      }
    },
    [channelId]
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
    setSending(true);

    try {
      // Send via WebSocket only - it will update React Query cache
      socketService.sendDM(channelId, content);
    } catch (err) {
      logger.error('Failed to send DM:', err);
      // Restore input on error
      setInputValue(content);
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
    return <LoadingState text="Laddar användare..." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <DMHeader
        userName={otherUser.firstName ?? otherUser.email}
        userInitial={(
          otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)
        ).toUpperCase()}
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
        messagesEndRef={messagesEndRef}
      />

      {/* Input */}
      <DMInputSection
        userName={otherUser.firstName ?? otherUser.email}
        inputValue={inputValue}
        uploading={uploading}
        sending={sending}
        textareaRef={textareaRef}
        onInputChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFileSelect={handleFileSelect}
        onEmojiSelect={handleEmojiSelect}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteMessageId}
        onCancel={handleCancelDelete}
        onConfirm={confirmDelete}
        title="Ta bort meddelande"
        message="Är du säker på att du vill ta bort det här meddelandet? Det går inte att ångra."
      />
    </div>
  );
}
