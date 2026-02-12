// Channel Service - Application Layer
import type { PrismaClient } from '@prisma/client';
import type {
  Channel,
  CreateChannelInput
} from '../../01-domain/entities/channel.js';
import {
  validateChannelName,
  normalizeChannelName
} from '../../01-domain/entities/channel.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError
} from '../../00-core/errors.js';

export class ChannelService {
  constructor(private readonly prisma: PrismaClient) {}

  async getWorkspaceChannels(
    workspaceId: string,
    userId: string
  ): Promise<Channel[]> {
    // Get public channels + private channels user is member of
    return this.prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: { some: { userId } }
          }
        ]
      },
      orderBy: { name: 'asc' }
    });
  }

  async getChannel(channelId: string): Promise<Channel> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundError('Channel', channelId);
    }

    return channel;
  }

  async createChannel(input: CreateChannelInput): Promise<Channel> {
    const normalizedName = normalizeChannelName(input.name);

    if (!validateChannelName(normalizedName)) {
      throw new ValidationError('Invalid channel name');
    }

    // Check for duplicate name in workspace
    const existing = await this.prisma.channel.findFirst({
      where: {
        workspaceId: input.workspaceId,
        name: normalizedName
      }
    });

    if (existing) {
      throw new ConflictError(`Channel "${normalizedName}" already exists`);
    }

    return this.prisma.channel.create({
      data: {
        workspaceId: input.workspaceId,
        name: normalizedName,
        description: input.description ?? null,
        type: input.type ?? 'TEXT',
        isPrivate: input.isPrivate ?? false
      }
    });
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundError('Channel', channelId);
    }

    await this.prisma.channel.delete({
      where: { id: channelId }
    });
  }

  async updateChannel(
    channelId: string,
    input: { name?: string; description?: string }
  ): Promise<Channel> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundError('Channel', channelId);
    }

    const data: { name?: string; description?: string } = {};

    if (input.name) {
      const normalizedName = normalizeChannelName(input.name);
      if (!validateChannelName(normalizedName)) {
        throw new ValidationError('Invalid channel name');
      }
      // Check for duplicate
      const existing = await this.prisma.channel.findFirst({
        where: {
          workspaceId: channel.workspaceId,
          name: normalizedName,
          id: { not: channelId }
        }
      });
      if (existing) {
        throw new ConflictError(`Channel "${normalizedName}" already exists`);
      }
      data.name = normalizedName;
    }

    if (input.description !== undefined) {
      data.description = input.description || null;
    }

    return this.prisma.channel.update({
      where: { id: channelId },
      data
    });
  }

  async joinChannel(channelId: string, userId: string): Promise<void> {
    await this.prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId, userId }
      },
      create: { channelId, userId },
      update: {}
    });
  }

  async leaveChannel(channelId: string, userId: string): Promise<void> {
    await this.prisma.channelMember.deleteMany({
      where: { channelId, userId }
    });
  }
}
