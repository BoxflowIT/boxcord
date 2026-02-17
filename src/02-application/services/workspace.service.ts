// Workspace Service - Application Layer
import type { PrismaClient } from '@prisma/client';
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  CreateWorkspaceInput,
  CreateInviteInput
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

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!membership) {
      throw new NotFoundError('Membership', `${workspaceId}/${userId}`);
    }

    // Owners can't leave - must delete workspace or transfer ownership
    if (membership.role === 'OWNER') {
      throw new ForbiddenError(
        'Owners cannot leave the workspace. Delete it or transfer ownership first.'
      );
    }

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
  }

  async updateWorkspace(
    workspaceId: string,
    requesterId: string,
    input: { name?: string; description?: string; iconUrl?: string }
  ): Promise<Workspace> {
    // Check requester has permission
    const requesterMembership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: requesterId } }
    });

    if (
      !requesterMembership ||
      !['OWNER', 'ADMIN'].includes(requesterMembership.role)
    ) {
      throw new ForbiddenError('Only owners and admins can update workspace');
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description || null
        }),
        ...(input.iconUrl !== undefined && { iconUrl: input.iconUrl || null })
      }
    });
  }

  async deleteWorkspace(
    workspaceId: string,
    requesterId: string
  ): Promise<void> {
    // Check requester is owner
    const requesterMembership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: requesterId } }
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owner can delete workspace');
    }

    // Delete in order: messages, channels, members, then workspace
    await this.prisma.$transaction(async (tx) => {
      // Get all channels
      const channels = await tx.channel.findMany({
        where: { workspaceId },
        select: { id: true }
      });
      const channelIds = channels.map((c) => c.id);

      // Delete messages in channels
      await tx.message.deleteMany({
        where: { channelId: { in: channelIds } }
      });

      // Delete channels
      await tx.channel.deleteMany({
        where: { workspaceId }
      });

      // Delete memberships
      await tx.workspaceMember.deleteMany({
        where: { workspaceId }
      });

      // Delete workspace
      await tx.workspace.delete({
        where: { id: workspaceId }
      });
    });
  }

  // ============================================
  // INVITE METHODS
  // ============================================

  private generateInviteCode(): string {
    // Generate 8-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createInvite(input: CreateInviteInput): Promise<WorkspaceInvite> {
    // Check user has permission to create invites
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.createdBy
        }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenError('Only owners and admins can create invites');
    }

    // Generate unique code
    let code = this.generateInviteCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await this.prisma.workspaceInvite.findUnique({
        where: { code }
      });
      if (!existing) break;
      code = this.generateInviteCode();
      attempts++;
    }

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.workspaceInvite.create({
      data: {
        workspaceId: input.workspaceId,
        code,
        createdBy: input.createdBy,
        maxUses: input.maxUses ?? null,
        expiresAt
      }
    });
  }

  async getWorkspaceInvites(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceInvite[]> {
    // Check membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!membership) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    return this.prisma.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInviteByCode(
    code: string
  ): Promise<(WorkspaceInvite & { workspace: Workspace }) | null> {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { code },
      include: { workspace: true }
    });

    if (!invite) return null;

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return null;
    }

    // Check if max uses reached
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return null;
    }

    return invite;
  }

  async useInvite(
    code: string,
    userId: string
  ): Promise<{ workspace: Workspace; member: WorkspaceMember }> {
    const invite = await this.getInviteByCode(code);

    if (!invite) {
      throw new NotFoundError('Invite', code);
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId }
      }
    });

    if (existingMember) {
      // Already member, just return workspace
      return { workspace: invite.workspace, member: existingMember };
    }

    // Add as member and increment uses in transaction
    const [member] = await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: 'MEMBER'
        }
      }),
      this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } }
      })
    ]);

    return { workspace: invite.workspace, member };
  }

  async deleteInvite(
    inviteId: string,
    userId: string
  ): Promise<void> {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) {
      throw new NotFoundError('Invite', inviteId);
    }

    // Check permission
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId }
      }
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenError('Only owners and admins can delete invites');
    }

    await this.prisma.workspaceInvite.delete({
      where: { id: inviteId }
    });
  }
}
