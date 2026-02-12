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

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  ownerId: string;
}
