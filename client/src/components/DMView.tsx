// Direct Message View Component
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { useMessageActions } from '../hooks/useMessageActions';
import { formatTime } from '../lib/formatters';
import MessageReactions from './MessageReactions';
import FileUpload, { AttachmentPreview } from './FileUpload';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Message {
  id: string;
  authorId: string;
  content: string;
  edited: boolean;
  createdAt: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  reactions?: Array<{
    emoji: string;
    userId: string;
  }>;
}

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export default function DMView() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      await api.editDM(messageId, content);
      socketService.editDM(messageId, content);
    },
    onDelete: async (messageId) => {
      await api.deleteDM(messageId);
      socketService.deleteDM(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  });

  useEffect(() => {
    if (!channelId) return;

    // Fetch channel info to get other user
    api.getDMChannels().then((channels) => {
      const channel = channels.find((c) => c.id === channelId);
      if (channel) {
        const other = channel.participants.find((p) => p.userId !== user?.id);
        if (other) {
          setOtherUser({
            id: other.user.id,
            email: other.user.email,
            firstName: other.user.firstName,
            lastName: other.user.lastName
          });
        }
      }
    });

    // Join DM room
    socketService.joinDM(channelId);

    // Load messages
    setLoading(true);
    api
      .getDMMessages(channelId)
      .then((result) => setMessages(result.items.reverse()))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Listen for DM events
    const onNewMessage = (message: Message) => {
      if (message.channelId === channelId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const onEditMessage = (message: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    };

    const onDeleteMessage = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socketService.onDMMessage('dm-view', onNewMessage);

    if (socketService.socket) {
      socketService.socket.on('dm:edit', onEditMessage);
      socketService.socket.on('dm:delete', onDeleteMessage);
    }

    return () => {
      socketService.leaveDM(channelId);
      socketService.offDMMessage('dm-view');

      if (socketService.socket) {
        socketService.socket.off('dm:edit', onEditMessage);
        socketService.socket.off('dm:delete', onDeleteMessage);
      }
    };
  }, [channelId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !channelId) return;

    try {
      const message = await api.sendDM(channelId, inputValue.trim());
      setMessages((prev) => [...prev, message]);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send DM:', err);
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
      // Reload messages to get the attachment
      const result = await api.getDMMessages(channelId);
      setMessages(result.items.reverse());
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

  const getUserName = (authorId: string) => {
    if (authorId === user?.id) return 'Du';
    return otherUser?.firstName ?? otherUser?.email ?? 'Unknown';
  };

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Laddar...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-discord-darkest shadow">
        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm mr-3">
          {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
        </div>
        <h2 className="font-semibold text-white">
          {otherUser.firstName ?? otherUser.email}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Laddar meddelanden...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 rounded-full bg-discord-blurple flex items-center justify-center text-3xl mb-4">
              {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
            </div>
            <p className="text-xl mb-2">
              {otherUser.firstName ?? otherUser.email}
            </p>
            <p>Det här är början på er konversation.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showHeader =
              !prevMessage ||
              prevMessage.authorId !== message.authorId ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                300000;

            // Group reactions by emoji
            const reactionCounts =
              message.reactions?.reduce(
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
                      {message.authorId === user?.id
                        ? (user?.firstName?.charAt(0) ?? user?.email?.charAt(0))
                        : (otherUser.firstName?.charAt(0) ??
                          otherUser.email.charAt(0))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-white">
                          {getUserName(message.authorId)}
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
                                saveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="w-full bg-discord-darker text-discord-light rounded p-2 text-sm resize-none outline-none"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={saveEdit}
                              className="text-xs px-3 py-1 bg-discord-blurple hover:bg-discord-blurple-hover rounded text-white"
                            >
                              Spara
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-xs px-3 py-1 hover:bg-discord-darker rounded text-gray-400"
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-discord-light break-words">
                            {message.content}
                          </p>

                          {/* Attachments */}
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((att) => (
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
                          {reactionCounts.length > 0 && (
                            <MessageReactions
                              messageId={message.id}
                              initialReactions={reactionCounts}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Message menu */}
                    {isOwnMessage && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={() =>
                            handleEditMessage(message.id, message.content)
                          }
                          className="p-1 hover:bg-discord-darker rounded text-gray-400 hover:text-white"
                          title="Redigera"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 hover:bg-discord-darker rounded text-gray-400 hover:text-red-500"
                          title="Ta bort"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
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
                        <div className="mt-1">
                          <textarea
                            ref={editTextareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="w-full bg-discord-darker text-discord-light rounded p-2 text-sm resize-none outline-none"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={saveEdit}
                              className="text-xs px-3 py-1 bg-discord-blurple hover:bg-discord-blurple-hover rounded text-white"
                            >
                              Spara
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-xs px-3 py-1 hover:bg-discord-darker rounded text-gray-400"
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-discord-light break-words">
                            {message.content}
                          </p>
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((att) => (
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
                        </>
                      )}
                    </div>

                    {/* Message menu for compact messages */}
                    {isOwnMessage && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 absolute right-4">
                        <button
                          onClick={() =>
                            handleEditMessage(message.id, message.content)
                          }
                          className="p-1 hover:bg-discord-darker rounded text-gray-400 hover:text-white"
                          title="Redigera"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 hover:bg-discord-darker rounded text-gray-400 hover:text-red-500"
                          title="Ta bort"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
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

      {/* Input */}
      <div className="px-4 pb-6">
        <div className="bg-discord-darker rounded-lg flex items-center">
          <FileUpload onFileSelect={handleFileSelect} disabled={uploading} />
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Meddelande @${otherUser.firstName ?? otherUser.email}`}
            className="flex-1 bg-transparent text-discord-light placeholder-gray-500 resize-none outline-none p-3 max-h-48"
            rows={1}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteMessageId}
        onClose={handleCancelDelete}
        onConfirm={confirmDelete}
        title="Ta bort meddelande"
        description="Är du säker på att du vill ta bort det här meddelandet? Det går inte att ångra."
      />
    </div>
  );
}
