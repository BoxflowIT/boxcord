// Domain entity: Workspace

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  code: string;
  createdBy: string;
  maxUses: number | null;
  uses: number;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  ownerId: string;
}

export interface CreateInviteInput {
  workspaceId: string;
  createdBy: string;
  maxUses?: number;
  expiresInDays?: number;
}
