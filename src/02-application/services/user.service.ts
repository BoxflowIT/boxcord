// User Service - Application Layer
// Manages local user profiles (synced from Boxtime)
import type { PrismaClient, UserStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../00-core/errors.js';

export interface LocalUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserWithPresence extends LocalUser {
  presence?: {
    status: UserStatus;
    customStatus?: string | null;
    lastSeen: Date;
  } | null;
}

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  // Get or create user (called on login/first interaction)
  // Note: Role is ONLY set on create, not updated on subsequent logins
  async upsertUser(data: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<LocalUser> {
    return this.prisma.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        role: data.role ?? 'STAFF'
      },
      update: {
        // Only update email and name, NOT role (role is admin-managed)
        email: data.email,
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined
      }
    });
  }

  async getUser(userId: string): Promise<UserWithPresence> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { presence: true }
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  async getUsersByIds(userIds: string[]): Promise<UserWithPresence[]> {
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { presence: true }
    });
  }

  async updateProfile(
    userId: string,
    input: UpdateUserInput
  ): Promise<LocalUser> {
    // Validate bio length
    if (input.bio && input.bio.length > 500) {
      throw new ValidationError('Bio cannot exceed 500 characters');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        avatarUrl: input.avatarUrl,
        bio: input.bio
      }
    });
  }

  async searchUsers(query: string, limit = 20): Promise<LocalUser[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { firstName: 'asc' }
    });
  }

  async updatePresence(
    userId: string,
    status: UserStatus,
    customStatus?: string
  ): Promise<void> {
    await this.prisma.userPresence.upsert({
      where: { userId },
      create: { userId, status, customStatus },
      update: { status, customStatus, lastSeen: new Date() }
    });
  }

  async setOffline(userId: string): Promise<void> {
    await this.prisma.userPresence.upsert({
      where: { userId },
      create: { userId, status: 'OFFLINE' },
      update: { status: 'OFFLINE', lastSeen: new Date() }
    });
  }

  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    const presences = await this.prisma.userPresence.findMany({
      where: {
        userId: { in: userIds },
        status: { not: 'OFFLINE' }
      },
      select: { userId: true }
    });
    return presences.map((p) => p.userId);
  }

  async getAllOnlineUsers(): Promise<UserWithPresence[]> {
    return this.prisma.user.findMany({
      where: {
        presence: {
          status: { not: 'OFFLINE' }
        }
      },
      include: { presence: true },
      orderBy: { firstName: 'asc' }
    });
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user and all related data (cascades)
    await this.prisma.user.delete({
      where: { id: userId }
    });
  }
}
