// Message Template Service - Application Layer
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../../00-core/errors.js';

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  userId: string;
  name: string;
  content: string;
}

export interface UpdateTemplateInput {
  name?: string;
  content?: string;
}

const MAX_TEMPLATES_PER_USER = 50;
const MAX_NAME_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;

export class TemplateService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  async getTemplates(userId: string): Promise<MessageTemplate[]> {
    return this.prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTemplate(
    templateId: string,
    userId: string
  ): Promise<MessageTemplate> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundError('MessageTemplate', templateId);
    }

    if (template.userId !== userId) {
      throw new ForbiddenError('You can only access your own templates');
    }

    return template;
  }

  async createTemplate(input: CreateTemplateInput): Promise<MessageTemplate> {
    const name = input.name.trim();
    const content = input.content.trim();

    if (!name || name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Template name must be 1-${MAX_NAME_LENGTH} characters`
      );
    }

    if (!content || content.length > MAX_CONTENT_LENGTH) {
      throw new ValidationError(
        `Template content must be 1-${MAX_CONTENT_LENGTH} characters`
      );
    }

    // Check user template limit
    const count = await this.prisma.messageTemplate.count({
      where: { userId: input.userId }
    });

    if (count >= MAX_TEMPLATES_PER_USER) {
      throw new ValidationError(
        `Maximum ${MAX_TEMPLATES_PER_USER} templates allowed per user`
      );
    }

    // Check for duplicate name
    const existing = await this.prisma.messageTemplate.findFirst({
      where: {
        userId: input.userId,
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existing) {
      throw new ValidationError('A template with this name already exists');
    }

    return this.prisma.messageTemplate.create({
      data: {
        userId: input.userId,
        name,
        content
      }
    });
  }

  async updateTemplate(
    templateId: string,
    userId: string,
    input: UpdateTemplateInput
  ): Promise<MessageTemplate> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundError('MessageTemplate', templateId);
    }

    if (template.userId !== userId) {
      throw new ForbiddenError('You can only edit your own templates');
    }

    const data: Record<string, string> = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name || name.length > MAX_NAME_LENGTH) {
        throw new ValidationError(
          `Template name must be 1-${MAX_NAME_LENGTH} characters`
        );
      }
      // Check duplicate name (excluding self)
      const existing = await this.prisma.messageTemplate.findFirst({
        where: {
          userId,
          name: { equals: name, mode: 'insensitive' },
          id: { not: templateId }
        }
      });
      if (existing) {
        throw new ValidationError('A template with this name already exists');
      }
      data.name = name;
    }

    if (input.content !== undefined) {
      const content = input.content.trim();
      if (!content || content.length > MAX_CONTENT_LENGTH) {
        throw new ValidationError(
          `Template content must be 1-${MAX_CONTENT_LENGTH} characters`
        );
      }
      data.content = content;
    }

    return this.prisma.messageTemplate.update({
      where: { id: templateId },
      data
    });
  }

  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new NotFoundError('MessageTemplate', templateId);
    }

    if (template.userId !== userId) {
      throw new ForbiddenError('You can only delete your own templates');
    }

    await this.prisma.messageTemplate.delete({
      where: { id: templateId }
    });
  }
}
