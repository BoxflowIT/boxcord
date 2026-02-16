// Message Service - Application Layer
import type { PrismaClient } from '@prisma/client';
import type { PaginationParams, PaginatedResult } from '../../00-core/types.js';
import type {
  Message,
  CreateMessageInput,
  UpdateMessageInput
} from '../../01-domain/entities/message.js';
import { validateMessageContent } from '../../01-domain/entities/message.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../../00-core/errors.js';
import { PAGINATION } from '../../00-core/constants.js';

export interface MessageWithExtras extends Message {
  author?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
  _count?: {
    replies: number;
  };
}

export class MessageService {
  constructor(private readonly prisma: PrismaClient) {}

  async getChannelMessages(
    channelId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<MessageWithExtras>> {
    const limit = Math.min(
      params.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1
      }),
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        attachments: true,
        reactions: true,
        _count: { select: { replies: true } }
      }
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined
    };
  }

  async createMessage(input: CreateMessageInput): Promise<MessageWithExtras> {
    if (!validateMessageContent(input.content)) {
      throw new ValidationError('Message content is invalid');
    }

    return this.prisma.message.create({
      data: {
        channelId: input.channelId,
        authorId: input.authorId,
        content: input.content.trim(),
        parentId: input.parentId ?? null
      }
    });
  }

  async updateMessage(
    messageId: string,
    userId: string,
    input: UpdateMessageInput
  ): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    if (!validateMessageContent(input.content)) {
      throw new ValidationError('Message content is invalid');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: input.content.trim(),
        edited: true
      }
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId }
    });
  }
}
