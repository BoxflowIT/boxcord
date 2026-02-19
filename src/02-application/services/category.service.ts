// Category Service - Channel category management
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../00-core/errors.js';

export interface CategoryWithChannels {
  id: string;
  name: string;
  position: number;
  collapsed: boolean;
  workspaceId: string;
  channels: Array<{
    id: string;
    name: string;
    type: string;
    position: number;
  }>;
}

export class CategoryService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  async getWorkspaceCategories(workspaceId: string): Promise<CategoryWithChannels[]> {
    const categories = await this.prisma.channelCategory.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: {
        channels: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            type: true,
            position: true
          }
        }
      }
    });

    return categories;
  }

  async createCategory(
    workspaceId: string,
    userId: string,
    name: string
  ): Promise<CategoryWithChannels> {
    // Verify user is admin
    await this.verifyAdmin(workspaceId, userId);

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Category name is required');
    }

    // Get next position
    const lastCategory = await this.prisma.channelCategory.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' }
    });

    const position = lastCategory ? lastCategory.position + 1 : 0;

    const category = await this.prisma.channelCategory.create({
      data: {
        workspaceId,
        name: name.trim(),
        position,
        collapsed: false
      },
      include: {
        channels: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            type: true,
            position: true
          }
        }
      }
    });

    return category;
  }

  async updateCategory(
    categoryId: string,
    userId: string,
    data: { name?: string; collapsed?: boolean }
  ): Promise<CategoryWithChannels> {
    const category = await this.prisma.channelCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await this.verifyAdmin(category.workspaceId, userId);

    const updated = await this.prisma.channelCategory.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(typeof data.collapsed === 'boolean' && { collapsed: data.collapsed })
      },
      include: {
        channels: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            type: true,
            position: true
          }
        }
      }
    });

    return updated;
  }

  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    const category = await this.prisma.channelCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await this.verifyAdmin(category.workspaceId, userId);

    // Remove category from channels (set to null)
    await this.prisma.channel.updateMany({
      where: { categoryId },
      data: { categoryId: null }
    });

    await this.prisma.channelCategory.delete({
      where: { id: categoryId }
    });
  }

  async moveChannelToCategory(
    channelId: string,
    categoryId: string | null,
    userId: string
  ): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { workspaceId: true }
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    await this.verifyAdmin(channel.workspaceId, userId);

    if (categoryId) {
      const category = await this.prisma.channelCategory.findUnique({
        where: { id: categoryId }
      });

      if (!category || category.workspaceId !== channel.workspaceId) {
        throw new ValidationError('Invalid category');
      }
    }

    await this.prisma.channel.update({
      where: { id: channelId },
      data: { categoryId }
    });
  }

  private async verifyAdmin(workspaceId: string, userId: string): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });

    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required');
    }
  }
}
