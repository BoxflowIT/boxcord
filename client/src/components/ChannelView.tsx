// Channel View Component - Messages and Input
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useMessageActions } from '../hooks/useMessageActions';
import { MessageItem } from './MessageItem';
import FileUpload from './FileUpload';
import MentionAutocomplete, { parseMentions } from './MentionAutocomplete';
import SlashCommandAutocomplete from './SlashCommandAutocomplete';
import DeleteConfirmModal from './DeleteConfirmModal';

interface ChannelViewProps {
  onToggleMemberList?: () => void;
}

export default function ChannelView({ onToggleMemberList }: ChannelViewProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const { messages, setMessages, currentChannel, setCurrentChannel, channels } =
    useChatStore();
  const { user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [botResponse, setBotResponse] = useState<{
    content: string;
    isPrivate: boolean;
  } | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number>();

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
    onEdit: async (messageId, content) => {
      await api.editMessage(messageId, content);
      socketService.editMessage(messageId, content);
    },
    onDelete: async (messageId) => {
      await api.deleteMessage(messageId);
      socketService.deleteMessage(messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    }
  });

  // Filter messages for current channel only
  const channelMessages = messages.filter((m) => m.channelId === channelId);

  useEffect(() => {
    if (!channelId) return;

    // Set current channel
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
    }

    // Join channel room
    socketService.joinChannel(channelId);

    // Load messages once when channel changes
    setLoading(true);
    api
      .getMessages(channelId)
      .then((result) => {
        console.log(
          '📥 Loaded messages for channel:',
          channelId,
          'count:',
          result.items.length
        );
        // Merge messages: keep existing messages from other channels, replace messages from this channel
        const otherChannelMessages = messages.filter(
          (m) => m.channelId !== channelId
        );
        const newMessages = [
          ...otherChannelMessages,
          ...result.items.reverse()
        ];
        setMessages(newMessages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      if (channelId) {
        socketService.leaveChannel(channelId);
      }
    };
    // Only re-run when channelId changes, not when messages update
    // New messages come via WebSocket, no need to refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (messageMenuOpen && !(e.target as Element).closest('.relative')) {
        setMessageMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [messageMenuOpen]);

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
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

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
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Visa/dölj medlemslista"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Laddar meddelanden...
          </div>
        ) : channelMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-xl mb-2">
              Välkommen till #{currentChannel?.name}!
            </p>
          </div>
        ) : (
          channelMessages.map((message, index) => {
            const prevMessage = channelMessages[index - 1];
            const showHeader =
              !prevMessage ||
              prevMessage.authorId !== message.authorId ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                300000;

            // Type the message with optional attachments/reactions
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

            // Group reactions
            const reactionCounts =
              msg.reactions?.reduce(
                (acc, r) => {
                  const existing = acc.find((x) => x.emoji === r.emoji);
                  if (existing) {
                    existing.count++;
                    if (r.userId === user?.id) existing.hasReacted = true;
                  } else {
                    acc.push({
                      emoji: r.emoji,
                      count: 1,
                      hasReacted: r.userId === user?.id
                    });
                  }
                  return acc;
                },
                [] as Array<{
                  emoji: string;
                  count: number;
                  hasReacted: boolean;
                }>
              ) ?? [];

            const authorName =
              message.authorId === user?.id
                ? 'Du'
                : message.author?.firstName && message.author?.lastName
                  ? `${message.author.firstName} ${message.author.lastName}`
                  : (message.author?.firstName ?? message.authorId.slice(0, 8));

            const authorInitial = (
              message.author?.firstName?.[0] ?? message.authorId[0]
            ).toUpperCase();

            return (
              <MessageItem
                key={message.id}
                messageId={message.id}
                content={message.content}
                createdAt={message.createdAt}
                edited={message.edited}
                attachments={msg.attachments}
                reactionCounts={reactionCounts}
                showHeader={showHeader}
                isEditing={editingMessageId === message.id}
                isOwnMessage={message.authorId === user?.id}
                authorName={authorName}
                authorInitial={authorInitial}
                editContent={editContent}
                editTextareaRef={editTextareaRef}
                onEditContentChange={setEditContent}
                onSaveEdit={saveEdit}
                onCancelEdit={handleCancelEdit}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                renderContent={(content) => parseMentions(content)}
                showMessageMenu={true}
                messageMenuOpen={messageMenuOpen === message.id}
                onToggleMessageMenu={() =>
                  setMessageMenuOpen(
                    messageMenuOpen === message.id ? null : message.id
                  )
                }
                compact={true}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ephemeral bot response */}
      {botResponse && (
        <div className="px-4 pb-2">
          <div className="bg-discord-blurple/10 border border-discord-blurple/30 rounded-lg p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm">
              🤖
            </div>
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
        description="Är du säker på att du vill ta bort det här meddelandet? Detta kan inte ångras."
        onConfirm={confirmDelete}
        onClose={handleCancelDelete}
      />
    </>
  );
}
