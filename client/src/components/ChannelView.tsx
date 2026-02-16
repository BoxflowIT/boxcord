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
import { MessageItem } from './MessageItem';
import FileUpload from './FileUpload';
import EmojiPicker from './ui/EmojiPicker';
import MentionAutocomplete, { parseMentions } from './MentionAutocomplete';
import SlashCommandAutocomplete from './SlashCommandAutocomplete';
import DeleteConfirmModal from './DeleteConfirmModal';
import { LoadingState } from './ui/LoadingSpinner';
import { UsersIcon } from './ui/Icons';
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
        showHeader: shouldShowMessageHeader(
          message.authorId,
          message.createdAt,
          prevMessage?.authorId,
          prevMessage?.createdAt
        )
      };
    });
  }, [messagesData?.items, user?.id]);

  const [inputValue, setInputValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [botResponse, setBotResponse] = useState<{
    content: string;
    isPrivate: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number>();

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
    setInputValue('');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? 0;
    setInputValue(value);
    setCursorPosition(cursor);

    // Check if we should show slash command autocomplete
    // Only show if "/" is at the start of the input
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowSlashCommands(true);
      setShowMentions(false);
    } else {
      setShowSlashCommands(false);

      // Check if we should show mention autocomplete
      const textBeforeCursor = value.slice(0, cursor);
      const atIndex = textBeforeCursor.lastIndexOf('@');
      if (atIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(atIndex + 1);
        // Show if @ is at start or after space, and no space after @
        const isValidAt = atIndex === 0 || value[atIndex - 1] === ' ';
        setShowMentions(isValidAt && !textAfterAt.includes(' '));
      } else {
        setShowMentions(false);
      }
    }

    // Send typing indicator (debounced)
    if (channelId) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        socketService.sendTyping(channelId);
      }, 500);
    }
  };

  const handleMentionSelect = useCallback(
    (mention: { value: string }, startPos: number, endPos: number) => {
      // Replace the @query with the selected mention
      const newValue =
        inputValue.slice(0, startPos) +
        mention.value +
        ' ' +
        inputValue.slice(endPos);
      setInputValue(newValue);
      setShowMentions(false);

      // Set cursor after the mention
      const newCursorPos = startPos + mention.value.length + 1;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [inputValue]
  );

  const handleSlashCommandSelect = useCallback(
    (command: { name: string; usage: string }) => {
      // Replace input with the command usage template
      setInputValue(`/${command.name} `);
      setShowSlashCommands(false);

      // Focus and place cursor at end
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = command.name.length + 2;
        textareaRef.current?.setSelectionRange(len, len);
      }, 0);
    },
    []
  );

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

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const cursorPos =
        textareaRef.current?.selectionStart ?? inputValue.length;
      const newValue =
        inputValue.slice(0, cursorPos) + emoji + inputValue.slice(cursorPos);
      setInputValue(newValue);

      // Focus and place cursor after emoji
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = cursorPos + emoji.length;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [inputValue]
  );

  return (
    <>
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-discord-darkest shadow">
        <span className="text-xl text-gray-400 mr-2">#</span>
        <h2 className="font-semibold text-white">
          {currentChannel?.name ?? 'Kanal'}
        </h2>
        {currentChannel?.description && (
          <>
            <div className="w-px h-6 bg-gray-600 mx-4" />
            <p className="text-sm text-gray-400 truncate flex-1">
              {currentChannel.description}
            </p>
          </>
        )}
        {!currentChannel?.description && <div className="flex-1" />}

        {/* Toggle member list button */}
        {onToggleMemberList && (
          <button
            onClick={onToggleMemberList}
            className="btn-icon"
            title="Visa/dölj medlemslista"
          >
            <UsersIcon />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <LoadingState text="Laddar meddelanden..." />
        ) : channelMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-xl mb-2">
              Välkommen till #{currentChannel?.name}!
            </p>
          </div>
        ) : (
          channelMessages.map((message) => (
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
              authorName={
                message.authorId === user?.id
                  ? 'Du'
                  : message.author?.firstName && message.author?.lastName
                    ? `${message.author.firstName} ${message.author.lastName}`
                    : (message.author?.firstName ??
                      message.authorId.slice(0, 8))
              }
              authorInitial={(
                message.author?.firstName?.[0] ?? message.authorId[0]
              ).toUpperCase()}
              editContent={editingMessageId === message.id ? editContent : ''}
              editTextareaRef={editTextareaRef}
              onEditContentChange={setEditContent}
              onSaveEdit={saveEdit}
              onCancelEdit={handleCancelEdit}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              renderContent={(content) => parseMentions(content)}
              compact={true}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ephemeral bot response */}
      {botResponse && (
        <div className="px-4 pb-2">
          <div className="bot-response">
            <div className="bot-avatar">🤖</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-discord-blurple">
                  Boxcord Bot
                </span>
                {botResponse.isPrivate && (
                  <span className="text-xs text-gray-400">
                    Endast synligt för dig
                  </span>
                )}
              </div>
              <div className="text-gray-200 text-sm whitespace-pre-wrap">
                {botResponse.content}
              </div>
            </div>
            <button
              onClick={() => setBotResponse(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-6">
        <div className="bg-discord-darker rounded-lg flex items-center relative">
          <FileUpload onFileSelect={handleFileSelect} disabled={uploading} />
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Skicka meddelande i #${currentChannel?.name ?? 'kanal'}`}
            className="flex-1 bg-transparent text-discord-light placeholder-gray-500 resize-none outline-none p-3 max-h-48"
            rows={1}
            disabled={uploading}
          />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          {showMentions && (
            <MentionAutocomplete
              inputValue={inputValue}
              cursorPosition={cursorPosition}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
              position={{ top: 0, left: 50 }}
            />
          )}
          {showSlashCommands && (
            <SlashCommandAutocomplete
              inputValue={inputValue}
              onSelect={handleSlashCommandSelect}
              onClose={() => setShowSlashCommands(false)}
            />
          )}
        </div>
      </div>

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
