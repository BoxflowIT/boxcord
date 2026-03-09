// Channel Webhook Service - Bot Integration
import { randomBytes } from 'crypto';
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { Server as SocketServer } from 'socket.io';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../../00-core/errors.js';

export interface ChannelWebhook {
  id: string;
  channelId: string;
  name: string;
  avatarUrl: string | null;
  token: string;
  createdBy: string;
  isActive: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookInput {
  channelId: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  createdBy: string;
}

export interface UpdateWebhookInput {
  name?: string;
  avatarUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface ExecuteWebhookInput {
  content: string;
  username?: string;
  avatarUrl?: string;
}

const MAX_WEBHOOKS_PER_CHANNEL = 15;
const MAX_NAME_LENGTH = 80;
const MAX_CONTENT_LENGTH = 4000;
const TOKEN_LENGTH = 48;

export class ChannelWebhookService {
  constructor(
    private readonly prisma: ExtendedPrismaClient,
    private io?: SocketServer
  ) {}

  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  // Generate a secure webhook token
  private generateToken(): string {
    return randomBytes(TOKEN_LENGTH).toString('hex');
  }

  // List all webhooks for a channel
  async getWebhooks(channelId: string): Promise<ChannelWebhook[]> {
    return this.prisma.channelWebhook.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get a single webhook
  async getWebhook(
    webhookId: string,
    _userId: string
  ): Promise<ChannelWebhook> {
    const webhook = await this.prisma.channelWebhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      throw new NotFoundError('ChannelWebhook', webhookId);
    }

    return webhook;
  }

  // Create a new webhook for a channel
  async createWebhook(input: CreateWebhookInput): Promise<ChannelWebhook> {
    const name = input.name.trim();

    if (!name || name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Webhook name must be 1-${MAX_NAME_LENGTH} characters`
      );
    }

    // Verify channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: input.channelId }
    });

    if (!channel) {
      throw new NotFoundError('Channel', input.channelId);
    }

    // Check webhook limit per channel
    const count = await this.prisma.channelWebhook.count({
      where: { channelId: input.channelId }
    });

    if (count >= MAX_WEBHOOKS_PER_CHANNEL) {
      throw new ValidationError(
        `Maximum ${MAX_WEBHOOKS_PER_CHANNEL} webhooks allowed per channel`
      );
    }

    const token = this.generateToken();

    return this.prisma.channelWebhook.create({
      data: {
        channelId: input.channelId,
        name,
        avatarUrl: input.avatarUrl ?? null,
        description: input.description?.trim() ?? null,
        token,
        createdBy: input.createdBy
      }
    });
  }

  // Update a webhook
  async updateWebhook(
    webhookId: string,
    userId: string,
    input: UpdateWebhookInput
  ): Promise<ChannelWebhook> {
    const webhook = await this.prisma.channelWebhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      throw new NotFoundError('ChannelWebhook', webhookId);
    }

    if (webhook.createdBy !== userId) {
      throw new ForbiddenError('You can only edit your own webhooks');
    }

    const data: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name || name.length > MAX_NAME_LENGTH) {
        throw new ValidationError(
          `Webhook name must be 1-${MAX_NAME_LENGTH} characters`
        );
      }
      data.name = name;
    }

    if (input.avatarUrl !== undefined) {
      data.avatarUrl = input.avatarUrl;
    }

    if (input.description !== undefined) {
      data.description = input.description?.trim() ?? null;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    return this.prisma.channelWebhook.update({
      where: { id: webhookId },
      data
    });
  }

  // Delete a webhook
  async deleteWebhook(webhookId: string, userId: string): Promise<void> {
    const webhook = await this.prisma.channelWebhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      throw new NotFoundError('ChannelWebhook', webhookId);
    }

    if (webhook.createdBy !== userId) {
      throw new ForbiddenError('You can only delete your own webhooks');
    }

    await this.prisma.channelWebhook.delete({
      where: { id: webhookId }
    });
  }

  // Regenerate token for a webhook
  async regenerateToken(
    webhookId: string,
    userId: string
  ): Promise<ChannelWebhook> {
    const webhook = await this.prisma.channelWebhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      throw new NotFoundError('ChannelWebhook', webhookId);
    }

    if (webhook.createdBy !== userId) {
      throw new ForbiddenError(
        'You can only regenerate your own webhook tokens'
      );
    }

    const newToken = this.generateToken();

    return this.prisma.channelWebhook.update({
      where: { id: webhookId },
      data: { token: newToken }
    });
  }

  // Execute a webhook - send a message via token (no auth required)
  async executeWebhook(
    token: string,
    input: ExecuteWebhookInput
  ): Promise<{ messageId: string }> {
    const webhook = await this.prisma.channelWebhook.findUnique({
      where: { token }
    });

    if (!webhook) {
      throw new NotFoundError('ChannelWebhook', 'token');
    }

    if (!webhook.isActive) {
      throw new ForbiddenError('This webhook is currently disabled');
    }

    const content = input.content.trim();
    if (!content || content.length > MAX_CONTENT_LENGTH) {
      throw new ValidationError(
        `Message content must be 1-${MAX_CONTENT_LENGTH} characters`
      );
    }

    // Use webhook creator as author (satisfies FK), link webhook for bot detection
    const displayName = input.username?.trim() || webhook.name;
    const avatarUrl = input.avatarUrl || webhook.avatarUrl;

    const message = await this.prisma.message.create({
      data: {
        channelId: webhook.channelId,
        authorId: webhook.createdBy,
        webhookId: webhook.id,
        content
      }
    });

    // Emit via Socket.IO
    if (this.io) {
      this.io.to(`channel:${webhook.channelId}`).emit('message:new', {
        id: message.id,
        content: message.content,
        authorId: message.authorId,
        channelId: message.channelId,
        createdAt: message.createdAt.toISOString(),
        edited: false,
        webhookId: webhook.id,
        webhook: {
          id: webhook.id,
          name: displayName,
          avatarUrl: avatarUrl ?? null
        }
      });
    }

    return { messageId: message.id };
  }
}
