// Channel View Component - Messages and Input
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import MessageReactions from './MessageReactions';
import FileUpload, { AttachmentPreview } from './FileUpload';
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number>();

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

    // Load messages
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
  }, [channelId, channels, setCurrentChannel, setMessages]);

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

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
    setMessageMenuOpen(null);
    // Focus the edit textarea
    setTimeout(() => editTextareaRef.current?.focus(), 0);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editContent.trim()) return;
    socketService.editMessage(editingMessageId, editContent.trim());
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    setDeleteMessageId(messageId);
    setMessageMenuOpen(null);
  };

  const confirmDeleteMessage = () => {
    if (deleteMessageId) {
      socketService.deleteMessage(deleteMessageId);
      setDeleteMessageId(null);
    }
  };

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <p>Det här är början på kanalen.</p>
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

            const isEditing = editingMessageId === message.id;
            const isOwnMessage = message.authorId === user?.id;

            return (
              <div
                key={message.id}
                className="group hover:bg-discord-darker/30 -mx-4 px-4 py-0.5 rounded relative"
              >
                {showHeader ? (
                  <div className="flex items-start gap-4 mt-4">
                    <div className="w-10 h-10 rounded-full bg-discord-blurple flex-shrink-0 flex items-center justify-center text-white font-bold">
                      {(
                        message.author?.firstName?.[0] ?? message.authorId[0]
                      ).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-white hover:underline cursor-pointer">
                          {message.authorId === user?.id
                            ? 'Du'
                            : message.author?.firstName &&
                                message.author?.lastName
                              ? `${message.author.firstName} ${message.author.lastName}`
                              : (message.author?.firstName ??
                                message.authorId.slice(0, 8))}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.createdAt)}
                        </span>
                        {message.edited && (
                          <span className="text-xs text-gray-500">
                            (redigerad)
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="mt-1">
                          <textarea
                            ref={editTextareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="w-full bg-discord-darker text-discord-light p-2 rounded resize-none outline-none"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2 text-xs">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded"
                            >
                              Spara
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 hover:bg-discord-darker text-gray-400 hover:text-white rounded"
                            >
                              Avbryt
                            </button>
                            <span className="text-gray-500 pt-1">
                              Escape för att <strong>avbryta</strong> • Enter
                              för att <strong>spara</strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-discord-light break-words">
                          {parseMentions(message.content)}
                        </p>
                      )}

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att) => (
                            <AttachmentPreview
                              key={att.id}
                              fileName={att.fileName}
                              fileUrl={att.fileUrl}
                              fileType={att.fileType}
                              fileSize={att.fileSize}
                            />
                          ))}
                        </div>
                      )}

                      {/* Reactions */}
                      <MessageReactions
                        messageId={message.id}
                        initialReactions={reactionCounts}
                      />
                    </div>
                    {/* Message actions */}
                    {isOwnMessage && !isEditing && (
                      <div className="absolute top-0 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMessageMenuOpen(
                                messageMenuOpen === message.id
                                  ? null
                                  : message.id
                              )
                            }
                            className="p-1 hover:bg-discord-dark rounded text-gray-400 hover:text-white"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {messageMenuOpen === message.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-discord-dark border border-discord-darker rounded-lg shadow-xl z-10">
                              <button
                                onClick={() =>
                                  handleEditMessage(message.id, message.content)
                                }
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-discord-blurple hover:text-white rounded-t-lg flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Redigera
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-600 hover:text-white rounded-b-lg flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Ta bort
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-4 pl-14">
                    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 -ml-10 w-10 text-right">
                      {formatTime(message.createdAt)}
                    </span>
                    <div className="flex-1">
                      {isEditing ? (
                        <div>
                          <textarea
                            ref={editTextareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="w-full bg-discord-darker text-discord-light p-2 rounded resize-none outline-none"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-2 text-xs">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded"
                            >
                              Spara
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 hover:bg-discord-darker text-gray-400 hover:text-white rounded"
                            >
                              Avbryt
                            </button>
                            <span className="text-gray-500 pt-1">
                              Escape för att <strong>avbryta</strong> • Enter
                              för att <strong>spara</strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-discord-light break-words">
                          {parseMentions(message.content)}
                        </p>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att) => (
                            <AttachmentPreview
                              key={att.id}
                              fileName={att.fileName}
                              fileUrl={att.fileUrl}
                              fileType={att.fileType}
                              fileSize={att.fileSize}
                            />
                          ))}
                        </div>
                      )}
                      <MessageReactions
                        messageId={message.id}
                        initialReactions={reactionCounts}
                      />
                    </div>
                    {/* Message actions for compact view */}
                    {isOwnMessage && !isEditing && (
                      <div className="absolute top-0 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMessageMenuOpen(
                                messageMenuOpen === message.id
                                  ? null
                                  : message.id
                              )
                            }
                            className="p-1 hover:bg-discord-dark rounded text-gray-400 hover:text-white"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {messageMenuOpen === message.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-discord-dark border border-discord-darker rounded-lg shadow-xl z-10">
                              <button
                                onClick={() =>
                                  handleEditMessage(message.id, message.content)
                                }
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-discord-blurple hover:text-white rounded-t-lg flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Redigera
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-600 hover:text-white rounded-b-lg flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Ta bort
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
        message={
          <>
            Är du säker på att du vill ta bort det här meddelandet? Detta kan
            inte ångras.
          </>
        }
        onConfirm={confirmDeleteMessage}
        onCancel={() => setDeleteMessageId(null)}
      />
    </>
  );
}
