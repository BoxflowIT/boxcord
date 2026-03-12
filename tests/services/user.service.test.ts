// User Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../src/02-application/services/user.service.js';
import { createMockPrisma } from '../mocks/prisma.mock.js';
import { NotFoundError, ValidationError } from '../../src/00-core/errors.js';

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    userService = new UserService(mockPrisma);
  });

  describe('upsertUser', () => {
    it('should create a new user with minimal data', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@example.com'
      };

      const expectedUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        bio: null,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockPrisma.user.upsert).mockResolvedValue(expectedUser);

      const result = await userService.upsertUser(userData);

      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        create: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: null,
          lastName: null,
          role: 'MEMBER'
        },
        update: {
          email: 'test@example.com',
          firstName: undefined,
          lastName: undefined
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          status: true,
          statusEmoji: true,
          dndMode: true,
          dndUntil: true,
          createdAt: true,
          updatedAt: true,
          presence: true
        }
      });
      expect(result).toEqual(expectedUser);
    });

    it('should create user with full profile data', async () => {
      const userData = {
        id: 'user-2',
        email: 'full@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN'
      };

      const expectedUser = {
        id: 'user-2',
        email: 'full@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: null,
        bio: null,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockPrisma.user.upsert).mockResolvedValue(expectedUser);

      const result = await userService.upsertUser(userData);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.role).toBe('ADMIN');
    });
  });

  describe('getUser', () => {
    it('should return user with presence', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        bio: null,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
        presence: {
          status: 'ONLINE',
          customStatus: null,
          lastSeen: new Date()
        }
      };

      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(user as any);

      const result = await userService.getUser('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          status: true,
          statusEmoji: true,
          dndMode: true,
          dndUntil: true,
          createdAt: true,
          updatedAt: true,
          presence: true
        }
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(null);

      await expect(userService.getUser('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getUsersByIds', () => {
    it('should return multiple users', async () => {
      const users = [
        { id: 'user-1', email: 'a@example.com' },
        { id: 'user-2', email: 'b@example.com' }
      ];

      vi.mocked(mockPrisma.user.findMany).mockResolvedValue(users as any);

      const result = await userService.getUsersByIds(['user-1', 'user-2']);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          presence: true
        }
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty input', async () => {
      vi.mocked(mockPrisma.user.findMany).mockResolvedValue([]);

      const result = await userService.getUsersByIds([]);

      expect(result).toEqual([]);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'New bio',
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockPrisma.user.update).mockResolvedValue(updatedUser);

      const result = await userService.updateProfile('user-1', {
        firstName: 'Updated',
        lastName: 'Name',
        avatarUrl: 'https://example.com/avatar.png',
        bio: 'New bio'
      });

      expect(result.firstName).toBe('Updated');
      expect(result.bio).toBe('New bio');
    });

    it('should throw ValidationError for bio exceeding 500 characters', async () => {
      const longBio = 'a'.repeat(501);

      await expect(
        userService.updateProfile('user-1', { bio: longBio })
      ).rejects.toThrow(ValidationError);
    });

    it('should accept bio with exactly 500 characters', async () => {
      const exactBio = 'a'.repeat(500);
      const updatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        bio: exactBio,
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockPrisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await userService.updateProfile('user-1', {
        bio: exactBio
      });

      expect(result.bio).toBe(exactBio);
    });
  });
});
