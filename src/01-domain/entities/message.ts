// Domain entity: Message

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  edited: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageInput {
  channelId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

export interface UpdateMessageInput {
  content: string;
}

// Domain rules
export const MESSAGE_RULES = {
  MIN_CONTENT_LENGTH: 1,
  MAX_CONTENT_LENGTH: 4000
} as const;

export function validateMessageContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.length >= MESSAGE_RULES.MIN_CONTENT_LENGTH &&
    trimmed.length <= MESSAGE_RULES.MAX_CONTENT_LENGTH
  );
}
