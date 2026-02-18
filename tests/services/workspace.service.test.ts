// Workspace Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from '../../src/02-application/services/workspace.service.js';
import { createMockPrisma } from '../mocks/prisma.mock.js';
import { NotFoundError, ForbiddenError } from '../../src/00-core/errors.js';

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    workspaceService = new WorkspaceService(mockPrisma);
  });

  describe('getUserWorkspaces', () => {
    it('should return workspaces for a user', async () => {
      const memberships = [
        {
          id: 'member-1',
          userId: 'user-1',
          workspaceId: 'ws-1',
          workspace: { id: 'ws-1', name: 'Workspace 1' }
        },
        {
          id: 'member-2',
          userId: 'user-1',
          workspaceId: 'ws-2',
          workspace: { id: 'ws-2', name: 'Workspace 2' }
        }
      ];

      vi.mocked(mockPrisma.workspaceMember.findMany).mockResolvedValue(
        memberships as any
      );

      const result = await workspaceService.getUserWorkspaces('user-1');

      expect(mockPrisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { workspace: true }
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Workspace 1');
    });

    it('should return empty array for user with no workspaces', async () => {
      vi.mocked(mockPrisma.workspaceMember.findMany).mockResolvedValue([]);

      const result = await workspaceService.getUserWorkspaces('user-no-ws');

      expect(result).toEqual([]);
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace by ID', async () => {
      const workspace = {
        id: 'ws-1',
        name: 'Test Workspace',
        description: 'A test workspace',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockPrisma.workspace.findUnique).mockResolvedValue(
        workspace as any
      );

      const result = await workspaceService.getWorkspace('ws-1');

      expect(result.name).toBe('Test Workspace');
    });

    it('should throw NotFoundError for non-existent workspace', async () => {
      vi.mocked(mockPrisma.workspace.findUnique).mockResolvedValue(null);

      await expect(
        workspaceService.getWorkspace('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createWorkspace', () => {
    it('should create workspace with owner membership and default channel', async () => {
      const workspace = {
        id: 'ws-new',
        name: 'New Workspace',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockPrisma.workspace.create).mockResolvedValue(
        workspace as any
      );

      const result = await workspaceService.createWorkspace({
        name: 'New Workspace',
        description: 'Description',
        ownerId: 'user-1'
      });

      expect(mockPrisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'New Workspace',
          description: 'Description',
          members: {
            create: {
              userId: 'user-1',
              role: 'OWNER'
            }
          },
          channels: {
            create: {
              name: 'allmänt',
              description: 'Allmän kanal för alla',
              type: 'TEXT',
              isPrivate: false
            }
          }
        }
      });
      expect(result.name).toBe('New Workspace');
    });
  });

  describe('getWorkspaceMembers', () => {
    it('should return members for a workspace', async () => {
      const membersWithUsers = [
        {
          id: 'm1',
          userId: 'user-1',
          workspaceId: 'ws-1',
          role: 'OWNER' as const,
          joinedAt: new Date(),
          user: {
            id: 'user-1',
            email: 'user1@test.com',
            firstName: 'User',
            lastName: 'One',
            role: 'STAFF',
            presence: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        {
          id: 'm2',
          userId: 'user-2',
          workspaceId: 'ws-1',
          role: 'MEMBER' as const,
          joinedAt: new Date(),
          user: {
            id: 'user-2',
            email: 'user2@test.com',
            firstName: 'User',
            lastName: 'Two',
            role: 'STAFF',
            presence: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      ];

      vi.mocked(mockPrisma.workspaceMember.findMany).mockResolvedValue(
        membersWithUsers as any
      );

      const result = await workspaceService.getWorkspaceMembers('ws-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('workspaceRole');
      expect(mockPrisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        include: {
          user: {
            include: { presence: true }
          }
        },
        orderBy: {
          user: {
            firstName: 'asc'
          }
        }
      });
    });
  });

  describe('addMember', () => {
    it('should add member with default MEMBER role', async () => {
      const member = {
        id: 'm-new',
        workspaceId: 'ws-1',
        userId: 'user-new',
        role: 'MEMBER',
        joinedAt: new Date()
      };

      vi.mocked(mockPrisma.workspaceMember.create).mockResolvedValue(
        member as any
      );

      const result = await workspaceService.addMember('ws-1', 'user-new');

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws-1',
          userId: 'user-new',
          role: 'MEMBER'
        }
      });
      expect(result.role).toBe('MEMBER');
    });

    it('should add member with ADMIN role', async () => {
      const member = {
        id: 'm-new',
        workspaceId: 'ws-1',
        userId: 'user-new',
        role: 'ADMIN',
        joinedAt: new Date()
      };

      vi.mocked(mockPrisma.workspaceMember.create).mockResolvedValue(
        member as any
      );

      const result = await workspaceService.addMember(
        'ws-1',
        'user-new',
        'ADMIN'
      );

      expect(result.role).toBe('ADMIN');
    });
  });

  describe('removeMember', () => {
    it('should allow owner to remove member', async () => {
      vi.mocked(mockPrisma.workspaceMember.findUnique).mockResolvedValue({
        id: 'm-owner',
        userId: 'owner-id',
        role: 'OWNER'
      } as any);

      vi.mocked(mockPrisma.workspaceMember.delete).mockResolvedValue({} as any);

      await workspaceService.removeMember('ws-1', 'user-to-remove', 'owner-id');

      expect(mockPrisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          workspaceId_userId: { workspaceId: 'ws-1', userId: 'user-to-remove' }
        }
      });
    });

    it('should allow admin to remove member', async () => {
      vi.mocked(mockPrisma.workspaceMember.findUnique).mockResolvedValue({
        id: 'm-admin',
        userId: 'admin-id',
        role: 'ADMIN'
      } as any);

      vi.mocked(mockPrisma.workspaceMember.delete).mockResolvedValue({} as any);

      await workspaceService.removeMember('ws-1', 'user-to-remove', 'admin-id');

      expect(mockPrisma.workspaceMember.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when regular member tries to remove', async () => {
      vi.mocked(mockPrisma.workspaceMember.findUnique).mockResolvedValue({
        id: 'm-member',
        userId: 'member-id',
        role: 'MEMBER'
      } as any);

      await expect(
        workspaceService.removeMember('ws-1', 'user-to-remove', 'member-id')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when requester is not a member', async () => {
      vi.mocked(mockPrisma.workspaceMember.findUnique).mockResolvedValue(null);

      await expect(
        workspaceService.removeMember('ws-1', 'user-to-remove', 'non-member-id')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
