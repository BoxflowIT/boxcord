// Workspace Service - Application Layer
import type { PrismaClient } from '@prisma/client';
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceInput
} from '../../01-domain/entities/workspace.js';
import { NotFoundError, ForbiddenError } from '../../00-core/errors.js';

export class WorkspaceService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true }
    });

    return memberships.map((m) => m.workspace);
  }

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      throw new NotFoundError('Workspace', workspaceId);
    }

    return workspace;
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    return this.prisma.workspace.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        members: {
          create: {
            userId: input.ownerId,
            role: 'OWNER'
          }
        },
        // Create default channel
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
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId }
    });
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER'
  ): Promise<WorkspaceMember> {
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role
      }
    });
  }

  async removeMember(
    workspaceId: string,
    userId: string,
    requesterId: string
  ): Promise<void> {
    // Check requester has permission
    const requesterMembership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: requesterId } }
    });

    if (
      !requesterMembership ||
      !['OWNER', 'ADMIN'].includes(requesterMembership.role)
    ) {
      throw new ForbiddenError('Only owners and admins can remove members');
    }

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
  }

  async checkMembership(workspaceId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    return !!membership;
  }
}
