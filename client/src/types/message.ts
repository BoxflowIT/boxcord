// Shared Message types
export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  edited: boolean;
  createdAt: string;
  channelId?: string; // For channel messages
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}
