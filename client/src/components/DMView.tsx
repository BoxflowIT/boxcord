// ============================================================================
// DM VIEW - Uses React Query for messages
// ============================================================================
// Messages come from React Query (useDMMessages hook)
// NO duplicate storage in local state
// ============================================================================

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { useDMMessages, useDMChannels, queryKeys } from '../hooks/useQuery';
import { useMessageActions } from '../hooks/useMessageActions';
import { MessageItem } from './MessageItem';
import FileUpload from './FileUpload';
import EmojiPicker from './ui/EmojiPicker';
import DeleteConfirmModal from './DeleteConfirmModal';
import { LoadingState } from './ui/LoadingSpinner';
import Avatar from './ui/Avatar';
import {
  groupReactionsByEmoji,
  shouldShowMessageHeader
} from '../utils/messageUtils';

export default function DMView() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Read appearance settings (reactive state)
  const [compactMode, setCompactMode] = useState(
    localStorage.getItem('compactMode') === 'true'
  );
  const [messageGrouping, setMessageGrouping] = useState(
    localStorage.getItem('messageGrouping') !== 'false'
  );

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      setCompactMode(localStorage.getItem('compactMode') === 'true');
      setMessageGrouping(localStorage.getItem('messageGrouping') !== 'false');
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () =>
      window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

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

  // Pre-process messages with computed properties (memoized for stable references)
  const messages = useMemo(() => {
    const rawMessages = messagesData?.items ?? [];
    return rawMessages.map((message, index) => {
      const prevMessage = rawMessages[index - 1];
      return {
        ...message,
        reactionCounts: groupReactionsByEmoji(message.reactions, user?.id),
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
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!channelId) return;

    // Join DM room for WebSocket events
    socketService.joinDM(channelId);

    return () => {
      socketService.leaveDM(channelId);
    };
  }, [channelId]);

  // Auto-mark as read after viewing for 1 second
  useEffect(() => {
    if (!channelId) return;

    const timeoutId = setTimeout(async () => {
      try {
        await api.markDMAsRead(channelId);
        // Invalidate DM channels query to refresh unread counts
        queryClient.invalidateQueries({ queryKey: queryKeys.dmChannels });
      } catch (err) {
        logger.error('Failed to mark DM as read:', err);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [channelId, queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const getUserName = (authorId: string) => {
    if (authorId === user?.id) return 'Du';
    return otherUser?.firstName ?? otherUser?.email ?? 'Unknown';
  };

  if (!otherUser || loadingUser) {
    return <LoadingState text="Laddar användare..." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-discord-darkest shadow">
        <Avatar size="sm" className="mr-3">
          {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
        </Avatar>
        <h2 className="font-semibold text-white">
          {otherUser.firstName ?? otherUser.email}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <LoadingState text="Laddar meddelanden..." />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Avatar size="lg" className="mb-4">
              {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
            </Avatar>
            <p className="text-xl mb-2">
              {otherUser.firstName ?? otherUser.email}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const authorInitial =
              message.authorId === user?.id
                ? (user?.firstName?.charAt(0) ?? user?.email?.charAt(0))
                : (otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0));

            return (
              <MessageItem
                key={message.id}
                messageId={message.id}
                content={message.content}
                createdAt={message.createdAt}
                edited={message.edited}
                attachments={message.attachments}
                reactionCounts={message.reactionCounts}
                showHeader={message.showHeader}
                isEditing={editingMessageId === message.id}
                isOwnMessage={message.authorId === user?.id}
                authorName={getUserName(message.authorId)}
                authorInitial={authorInitial.toUpperCase()}
                editContent={editingMessageId === message.id ? editContent : ''}
                editTextareaRef={editTextareaRef}
                onEditContentChange={setEditContent}
                onSaveEdit={saveEdit}
                onCancelEdit={handleCancelEdit}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                compact={compactMode}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6">
        <div className="bg-discord-darker rounded-lg flex items-center">
          <FileUpload
            onFileSelect={handleFileSelect}
            disabled={uploading || sending}
          />
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Meddelande @${otherUser?.firstName ?? otherUser?.email}`}
            className="flex-1 bg-transparent text-discord-light placeholder-gray-500 resize-none outline-none p-3 max-h-48"
            rows={1}
            disabled={uploading || sending}
          />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          {sending && (
            <div className="px-3 text-boxflow-muted text-sm">Skickar...</div>
          )}
        </div>
      </div>

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
