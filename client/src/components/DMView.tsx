// Direct Message View Component
import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { useDMMessages, useDMChannels, useUser } from '../hooks/useQuery';
import { useMessageActions } from '../hooks/useMessageActions';
import { MessageItem } from './MessageItem';
import FileUpload from './FileUpload';
import EmojiPicker from './ui/EmojiPicker';
import DeleteConfirmModal from './DeleteConfirmModal';
import type { Message } from '../types/message';

export default function DMView() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuthStore();

  const { data: dmChannels } = useDMChannels();

  // Find other user's ID from channel participants
  const otherUserId = useMemo(() => {
    if (!channelId || !dmChannels || !user) return undefined;
    const channel = dmChannels.find((ch) => ch.id === channelId);
    if (!channel) return undefined;
    const otherParticipant = channel.participants.find(
      (p) => p.userId !== user.id
    );
    return otherParticipant?.userId;
  }, [channelId, dmChannels, user]);

  // Fetch other user's info with caching
  const { data: otherUser, isLoading: loadingUser } = useUser(otherUserId);

  // React Query hook for messages with auto caching
  const {
    data: messagesData,
    isLoading: loadingMessages,
    refetch
  } = useDMMessages(channelId);

  // Local state for WebSocket real-time updates
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // Join DM room and setup socket listeners
    socketService.joinDM(channelId);

    // Listen for DM events
    const onNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
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
    socketService.onDMEdit('dm-view', onEditMessage);
    socketService.onDMDelete('dm-view', onDeleteMessage);

    return () => {
      socketService.leaveDM(channelId);
      socketService.offDMMessage('dm-view');
      socketService.offDMEdit('dm-view');
      socketService.offDMDelete('dm-view');
    };
  }, [channelId]);

  // Load messages from cache when data changes
  useEffect(() => {
    // IMPORTANT: Copy before reverse() to avoid mutating cache!
    if (messagesData?.items) {
      setMessages([...messagesData.items].reverse());
    }
  }, [messagesData]); // Bara när messagesData ändras!

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !channelId || sending) return;

    const content = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      // Send message - WebSocket will handle adding it to the list
      await api.sendDM(channelId, content);
    } catch (err) {
      console.error('Failed to send DM:', err);
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
      // Reload messages from cache using React Query refetch
      const result = await refetch();
      if (result.data?.items) {
        setMessages([...result.data.items].reverse());
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 border-4 border-boxflow-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-boxflow-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-boxflow-muted text-sm">Laddar användare...</p>
        </div>
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
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-3">
                <div className="absolute inset-0 border-4 border-boxflow-border rounded-full"></div>
                <div className="absolute inset-0 border-4 border-boxflow-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-boxflow-muted text-sm">
                Laddar meddelanden...
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 rounded-full bg-discord-blurple flex items-center justify-center text-3xl mb-4">
              {otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0)}
            </div>
            <p className="text-xl mb-2">
              {otherUser.firstName ?? otherUser.email}
            </p>
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
                reactionCounts={reactionCounts}
                showHeader={showHeader}
                isEditing={editingMessageId === message.id}
                isOwnMessage={message.authorId === user?.id}
                authorName={getUserName(message.authorId)}
                authorInitial={authorInitial.toUpperCase()}
                editContent={editContent}
                editTextareaRef={editTextareaRef}
                onEditContentChange={setEditContent}
                onSaveEdit={saveEdit}
                onCancelEdit={handleCancelEdit}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
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
