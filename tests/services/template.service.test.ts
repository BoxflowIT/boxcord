// Template Service Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateService } from '../../src/02-application/services/template.service';
import { createMockPrisma } from '../mocks/prisma.mock';
import type { PrismaClient } from '@prisma/client';

describe('TemplateService', () => {
  let templateService: TemplateService;
  let mockPrisma: PrismaClient;

  const userId = 'user-1';
  const templateId = 'template-1';

  const mockTemplate = {
    id: templateId,
    userId,
    name: 'Welcome Message',
    content: 'Welcome to the team! 🎉',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    templateService = new TemplateService(mockPrisma as any);
  });

  describe('getTemplates', () => {
    it('should return all templates for a user', async () => {
      (mockPrisma.messageTemplate.findMany as any).mockResolvedValue([
        mockTemplate
      ]);

      const result = await templateService.getTemplates(userId);

      expect(result).toEqual([mockTemplate]);
      expect(mockPrisma.messageTemplate.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return empty array for user with no templates', async () => {
      (mockPrisma.messageTemplate.findMany as any).mockResolvedValue([]);

      const result = await templateService.getTemplates(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getTemplate', () => {
    it('should return a template by id', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(
        mockTemplate
      );

      const result = await templateService.getTemplate(templateId, userId);

      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundError for non-existent template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(null);

      await expect(
        templateService.getTemplate('nonexistent', userId)
      ).rejects.toThrow('not found');
    });

    it('should throw ForbiddenError when accessing another user template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue({
        ...mockTemplate,
        userId: 'other-user'
      });

      await expect(
        templateService.getTemplate(templateId, userId)
      ).rejects.toThrow('your own');
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      (mockPrisma.messageTemplate.count as any).mockResolvedValue(0);
      (mockPrisma.messageTemplate.findFirst as any).mockResolvedValue(null);
      (mockPrisma.messageTemplate.create as any).mockResolvedValue(
        mockTemplate
      );

      const result = await templateService.createTemplate({
        userId,
        name: 'Welcome Message',
        content: 'Welcome to the team! 🎉'
      });

      expect(result).toEqual(mockTemplate);
      expect(mockPrisma.messageTemplate.create).toHaveBeenCalledWith({
        data: {
          userId,
          name: 'Welcome Message',
          content: 'Welcome to the team! 🎉'
        }
      });
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(
        templateService.createTemplate({
          userId,
          name: '   ',
          content: 'Some content'
        })
      ).rejects.toThrow('characters');
    });

    it('should throw ValidationError for empty content', async () => {
      await expect(
        templateService.createTemplate({
          userId,
          name: 'Test',
          content: '   '
        })
      ).rejects.toThrow('characters');
    });

    it('should throw ValidationError when exceeding 50 templates', async () => {
      (mockPrisma.messageTemplate.count as any).mockResolvedValue(50);

      await expect(
        templateService.createTemplate({
          userId,
          name: 'New Template',
          content: 'Content'
        })
      ).rejects.toThrow('50 templates');
    });

    it('should throw ValidationError for duplicate name', async () => {
      (mockPrisma.messageTemplate.count as any).mockResolvedValue(1);
      (mockPrisma.messageTemplate.findFirst as any).mockResolvedValue(
        mockTemplate
      );

      await expect(
        templateService.createTemplate({
          userId,
          name: 'Welcome Message',
          content: 'Content'
        })
      ).rejects.toThrow('already exists');
    });
  });

  describe('updateTemplate', () => {
    it('should update template name', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(
        mockTemplate
      );
      (mockPrisma.messageTemplate.findFirst as any).mockResolvedValue(null);
      (mockPrisma.messageTemplate.update as any).mockResolvedValue({
        ...mockTemplate,
        name: 'Updated Name'
      });

      const result = await templateService.updateTemplate(templateId, userId, {
        name: 'Updated Name'
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update template content', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(
        mockTemplate
      );
      (mockPrisma.messageTemplate.update as any).mockResolvedValue({
        ...mockTemplate,
        content: 'New content'
      });

      const result = await templateService.updateTemplate(templateId, userId, {
        content: 'New content'
      });

      expect(result.content).toBe('New content');
    });

    it('should throw NotFoundError for non-existent template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(null);

      await expect(
        templateService.updateTemplate('nonexistent', userId, {
          name: 'Test'
        })
      ).rejects.toThrow('not found');
    });

    it('should throw ForbiddenError when updating another user template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue({
        ...mockTemplate,
        userId: 'other-user'
      });

      await expect(
        templateService.updateTemplate(templateId, userId, { name: 'Test' })
      ).rejects.toThrow('your own');
    });

    it('should throw ValidationError for duplicate name on update', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(
        mockTemplate
      );
      (mockPrisma.messageTemplate.findFirst as any).mockResolvedValue({
        ...mockTemplate,
        id: 'template-2',
        name: 'Existing Name'
      });

      await expect(
        templateService.updateTemplate(templateId, userId, {
          name: 'Existing Name'
        })
      ).rejects.toThrow('already exists');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(
        mockTemplate
      );
      (mockPrisma.messageTemplate.delete as any).mockResolvedValue(
        mockTemplate
      );

      await templateService.deleteTemplate(templateId, userId);

      expect(mockPrisma.messageTemplate.delete).toHaveBeenCalledWith({
        where: { id: templateId }
      });
    });

    it('should throw NotFoundError for non-existent template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue(null);

      await expect(
        templateService.deleteTemplate('nonexistent', userId)
      ).rejects.toThrow('not found');
    });

    it('should throw ForbiddenError when deleting another user template', async () => {
      (mockPrisma.messageTemplate.findUnique as any).mockResolvedValue({
        ...mockTemplate,
        userId: 'other-user'
      });

      await expect(
        templateService.deleteTemplate(templateId, userId)
      ).rejects.toThrow('your own');
    });
  });
});
