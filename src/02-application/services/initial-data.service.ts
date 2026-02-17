// User Service optimization - batch fetch initial data
import type { PrismaClient } from '@prisma/client';

export interface InitialData {
  workspaces: Array<{
    id: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    role: string;
  }>;
  currentUser: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    role: string;
  };
  onlineUsers: Array<{
    userId: string;
    status: string;
  }>;
}

/**
 * Fetch all initial data needed for app in one query
 * Reduces API calls from 3+ to 1 on initial load
 */
export async function getInitialData(
  prisma: PrismaClient,
  userId: string
): Promise<InitialData> {
  const [workspacesData, currentUser, onlineUsers] = await Promise.all([
    // Fetch user's workspaces with role
    prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            iconUrl: true
          }
        }
      }
    }),

    // Fetch current user
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true
      }
    }),

    // Fetch online users
    prisma.userPresence.findMany({
      where: {
        status: { in: ['ONLINE', 'AWAY', 'BUSY'] }
      },
      select: {
        userId: true,
        status: true
      }
    })
  ]);

  if (!currentUser) {
    throw new Error('User not found');
  }

  const workspaces = workspacesData.map((m) => ({
    ...m.workspace,
    role: m.role
  }));

  return {
    workspaces,
    currentUser,
    onlineUsers
  };
}
