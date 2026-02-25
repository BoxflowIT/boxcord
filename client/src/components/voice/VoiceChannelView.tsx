import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVoiceStore, useVoiceControls } from '../../store/voiceStore';
import { voiceService } from '../../services/voice.service';
import { usePushToTalk } from '../../hooks/usePushToTalk';
import { logger } from '../../utils/logger';
import { VoiceUserList } from './VoiceUserList';
import { VoiceControls } from './EnhancedVoiceControls';
import { VideoGrid } from './VideoGrid';
import { MinimizedVideoIndicatorNew } from './MinimizedVideoIndicatorNew';
import { FloatingVideoWindowNew } from './FloatingVideoWindowNew';
import { useMessages, queryKeys } from '../../hooks/useQuery';
import { useAuthStore } from '../../store/auth';
import { useChatStore } from '../../store/chat';
import { useProcessedMessages } from '../../hooks/useProcessedMessages';
import { useMessageScroll } from '../../hooks/useMessageScroll';
import { useMarkAsRead } from '../../hooks/useMarkAsRead';
import { useSocketRoom } from '../../hooks/useSocketRoom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useChannelInput } from '../../hooks/useChannelInput';
import { socketService } from '../../services/socket';
import MessageListDisplay from '../channel/MessageListDisplay';
import ChannelInputSection from '../channel/ChannelInputSection';
import type { PaginatedMessages } from '../../types';
import {
  VoiceChannelIcon,
  VoiceConnectIcon,
  VoiceDisconnectIcon
} from '../ui/Icons';
import { VoiceLoader } from '../ui/VoiceLoader';

interface VoiceChannelViewProps {
  channelId: string;
  channelName: string;
}

export function VoiceChannelView({
  channelId,
  channelName
}: VoiceChannelViewProps) {
  const queryClient = useQueryClient();
  const { isConnected, isConnecting, currentChannelId } = useVoiceStore();
  const {
    isMuted,
    isDeafened,
    isVideoEnabled,
    isScreenSharing,
    isPushToTalk,
    setPushToTalk
  } = useVoiceControls();
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { currentWorkspace } = useChatStore();

  // Read appearance settings
  const [compactMode] = useLocalStorage('compactMode', false);
  const [messageGrouping] = useLocalStorage('messageGrouping', true);

  // Fetch messages for this voice channel
  const { data: messagesData, isLoading: loadingMessages } =
    useMessages(channelId);

  // Pre-process messages
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

  // Message input handling
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // Shared hooks
  const messagesEndRef = useMessageScroll(channelMessages);
  useMarkAsRead({
    channelId,
    workspaceId: currentWorkspace?.id,
    isDM: false
  });
  useSocketRoom(channelId, 'channel');

  // Message actions
  const handleDeleteChannelMessage = useCallback(
    async (messageId: string) => {
      const cacheKey = queryKeys.messages(channelId, undefined);
      queryClient.setQueryData<PaginatedMessages>(cacheKey, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.filter((m) => m.id !== messageId)
        };
      });
      socketService.deleteMessage(messageId);
    },
    [channelId, queryClient]
  );

  const handleSendMessage = () => {
    if (inputValue.trim() && channelId) {
      socketService.sendMessage(channelId, inputValue);
      clearInput();
    }
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
      handleSendMessage();
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!channelId) return;

    setUploading(true);
    try {
      // Upload file to server
      const api = await import('../../services/api').then((m) => m.api);
      const result = await api.uploadFile(file);
      const fileUrl = 'url' in result ? result.url : result.fileUrl;

      // Determine message format based on file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      let messageContent: string;
      if (isImage) {
        messageContent = `![${file.name}](${fileUrl})`;
      } else if (isVideo) {
        messageContent = `🎬 [${file.name}](${fileUrl})`;
      } else {
        messageContent = `📎 [${file.name}](${fileUrl})`;
      }

      socketService.sendMessage(channelId, messageContent);
    } catch (err) {
      logger.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    if (!channelId) return;
    socketService.sendMessage(channelId, gifUrl);
  };

  const isInThisChannel = isConnected && currentChannelId === channelId;

  // Push-to-Talk with 'V' key (like Discord)
  usePushToTalk({ enabled: isInThisChannel, key: 'v' });

  const handleJoin = async () => {
    try {
      setError(null);
      await voiceService.joinChannel(channelId);
    } catch (err) {
      logger.error('Failed to join voice channel:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to join voice channel. Please check your microphone permissions.'
      );
    }
  };

  const handleLeave = async () => {
    try {
      setError(null);
      await voiceService.leaveChannel();
    } catch (err) {
      logger.error('Failed to leave voice channel:', err);
      setError('Failed to leave voice channel');
    }
  };

  const handleToggleVideo = async () => {
    try {
      setError(null);
      await voiceService.toggleVideo();
    } catch (err) {
      logger.error('Failed to toggle video:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle video');
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      setError(null);
      await voiceService.toggleScreenShare();
    } catch (err) {
      logger.error('Failed to toggle screen share:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to toggle screen share'
      );
    }
  };

  const handleTogglePTT = () => {
    setPushToTalk(!isPushToTalk);
    // PTT mode will be implemented separately with keyboard listeners
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
            <VoiceChannelIcon size="lg" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              {channelName}
            </h2>
            <p className="text-sm text-gray-400">Voice Channel</p>
          </div>
        </div>
      </div>

      {/* Voice Channel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Not connected state */}
        {!isInThisChannel && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-500">
              <VoiceChannelIcon size="lg" className="w-12 h-12" />
            </div>

            <h3 className="text-2xl font-semibold text-gray-100 mb-2">
              {channelName}
            </h3>

            <p className="text-gray-400 mb-8 max-w-md">
              Click the button below to join the voice channel. Make sure your
              microphone is connected and browser permissions are granted.
            </p>

            <button
              onClick={handleJoin}
              disabled={isConnecting}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center gap-3 min-w-[200px] justify-center"
            >
              {isConnecting ? (
                <VoiceLoader />
              ) : (
                <>
                  <VoiceConnectIcon size="md" />
                  Join Voice Channel
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4">
              WebRTC peer-to-peer voice chat
            </p>
          </div>
        )}

        {/* Connected state */}
        {isInThisChannel && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left section: Voice users and controls */}
            <div className="w-80 flex flex-col border-r border-gray-700">
              {/* Connected banner */}
              <div className="p-3 bg-green-500/10 border-b border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-green-400 font-medium">
                      Connected to voice
                    </p>
                  </div>

                  <button
                    onClick={handleLeave}
                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                  >
                    <VoiceDisconnectIcon size="sm" />
                    Leave
                  </button>
                </div>
              </div>

              {/* Voice users list */}
              <div className="flex-1 overflow-y-auto">
                {/* Video grid (if video/screen share is active) */}
                <VideoGrid />

                {/* Minimized video indicator (floating) */}
                <MinimizedVideoIndicatorNew />

                {/* Floating video window (draggable + resizable) */}
                <FloatingVideoWindowNew />

                {/* Voice users list */}
                <VoiceUserList />
              </div>

              {/* Voice controls */}
              <VoiceControls
                isMuted={isMuted}
                isDeafened={isDeafened}
                isVideoEnabled={isVideoEnabled}
                isScreenSharing={isScreenSharing}
                isPushToTalk={isPushToTalk}
                onToggleMute={() => voiceService.toggleMute()}
                onToggleDeafen={() => voiceService.toggleDeafen()}
                onToggleVideo={handleToggleVideo}
                onToggleScreenShare={handleToggleScreenShare}
                onTogglePTT={handleTogglePTT}
                onLeave={handleLeave}
              />
            </div>

            {/* Right section: Text chat */}
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="p-3 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-200">
                  Text Chat
                </h3>
                <p className="text-xs text-gray-400">
                  Chat with others in this voice channel
                </p>
              </div>

              {/* Messages */}
              <MessageListDisplay
                messages={channelMessages}
                loading={loadingMessages}
                channelName={channelName}
                currentUserId={user?.id}
                currentUserAvatar={user?.avatarUrl}
                editingMessageId={null}
                editContent=""
                editTextareaRef={{ current: null }}
                compactMode={compactMode}
                onEditContentChange={() => {}}
                onSaveEdit={() => {}}
                onCancelEdit={() => {}}
                onEdit={(msgId) => logger.info('Edit message:', msgId)}
                onDelete={handleDeleteChannelMessage}
                onPin={async () => {}}
                messagesEndRef={messagesEndRef}
              />

              {/* Input */}
              <ChannelInputSection
                channelName={channelName}
                inputValue={inputValue}
                textareaRef={textareaRef}
                onInputChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFileSelect={handleFileSelect}
                onEmojiSelect={handleEmojiSelect}
                onGifSelect={handleGifSelect}
                showMentions={showMentions}
                showSlashCommands={showSlashCommands}
                onMentionSelect={handleMentionSelect}
                onSlashCommandSelect={handleSlashCommandSelect}
                onCloseMentions={() => setShowMentions(false)}
                onCloseSlashCommands={() => setShowSlashCommands(false)}
                cursorPosition={cursorPosition}
                uploading={uploading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
