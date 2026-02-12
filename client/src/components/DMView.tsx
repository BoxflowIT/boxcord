// Direct Message View Component
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/auth';
import MessageReactions from './MessageReactions';
import FileUpload, { AttachmentPreview } from './FileUpload';

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

interface DMViewProps {
  channelId: string;
  otherUser: UserInfo;
}

export default function DMView({ channelId, otherUser }: DMViewProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Join DM room
    socketService.joinDM(channelId);

    // Load messages
    setLoading(true);
    api
      .getDMMessages(channelId)
      .then((result) => setMessages(result.items.reverse()))
      .catch(console.error)
      .finally(() => setLoading(false));

    return () => {
      socketService.leaveDM(channelId);
    };
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (authorId: string) => {
    if (authorId === user?.id) return 'Du';
    return otherUser.firstName ?? otherUser.email;
  };

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

            return (
              <div
                key={message.id}
                className="group hover:bg-discord-darker/30 -mx-4 px-4 py-0.5 rounded"
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
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 pl-14">
                    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 -ml-10 w-10 text-right">
                      {formatTime(message.createdAt)}
                    </span>
                    <div className="flex-1">
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
                    </div>
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
    </div>
  );
}
