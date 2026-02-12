// Chatbot Service Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatbotService } from '../../src/02-application/services/chatbot.service';

describe('ChatbotService', () => {
  let chatbotService: ChatbotService;
  let mockPrisma: {
    userPresence: {
      findUnique: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    channelMember: {
      findMany: ReturnType<typeof vi.fn>;
    };
    user: {
      findMany: ReturnType<typeof vi.fn>;
    };
    channel: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    message: {
      deleteMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      userPresence: {
        findUnique: vi.fn(),
        upsert: vi.fn()
      },
      channelMember: {
        findMany: vi.fn()
      },
      user: {
        findMany: vi.fn()
      },
      channel: {
        findUnique: vi.fn()
      },
      message: {
        deleteMany: vi.fn(),
        create: vi.fn()
      }
    };
    chatbotService = new ChatbotService(mockPrisma as never);
  });

  const context = {
    userId: 'user-123',
    channelId: 'channel-123',
    workspaceId: 'ws-123'
  };

  describe('processMessage', () => {
    it('should return null for non-command messages', async () => {
      const result = await chatbotService.processMessage(
        'Hello world',
        context
      );
      expect(result).toBeNull();
    });

    it('should return error for unknown command', async () => {
      const result = await chatbotService.processMessage(
        '/unknowncommand',
        context
      );
      expect(result?.content).toContain('Okänt kommando');
    });
  });

  describe('/help command', () => {
    it('should list available commands', async () => {
      const result = await chatbotService.processMessage('/help', context);
      expect(result?.content).toContain('Tillgängliga kommandon');
      expect(result?.isPrivate).toBe(true);
    });

    it('should show help for specific command', async () => {
      const result = await chatbotService.processMessage(
        '/help status',
        context
      );
      expect(result?.content).toContain('/status');
      expect(result?.content).toContain('Användning');
    });
  });

  describe('/status command', () => {
    it('should show current status when no args', async () => {
      mockPrisma.userPresence.findUnique.mockResolvedValue({
        status: 'ONLINE'
      });

      const result = await chatbotService.processMessage('/status', context);
      expect(result?.content).toContain('ONLINE');
      expect(result?.isPrivate).toBe(true);
    });

    it('should update status with valid arg', async () => {
      mockPrisma.userPresence.upsert.mockResolvedValue({});

      const result = await chatbotService.processMessage(
        '/status away',
        context
      );
      expect(result?.content).toContain('away');
      expect(mockPrisma.userPresence.upsert).toHaveBeenCalled();
    });

    it('should reject invalid status', async () => {
      const result = await chatbotService.processMessage(
        '/status invalid',
        context
      );
      expect(result?.content).toContain('Ogiltig status');
    });
  });

  describe('/who command', () => {
    it('should list channel members', async () => {
      mockPrisma.channelMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' }
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'a@test.com', firstName: 'Anna' },
        { id: 'user-2', email: 'b@test.com', firstName: 'Björn' }
      ]);

      const result = await chatbotService.processMessage('/who', context);
      expect(result?.content).toContain('Kanalmedlemmar');
      expect(result?.isPrivate).toBe(true);
    });

    it('should handle empty channel', async () => {
      mockPrisma.channelMember.findMany.mockResolvedValue([]);

      const result = await chatbotService.processMessage('/who', context);
      expect(result?.content).toContain('Inga medlemmar');
    });
  });

  describe('/poll command', () => {
    it('should create a poll with options', async () => {
      const result = await chatbotService.processMessage(
        '/poll "Vad ska vi äta?" "Pizza" "Sushi" "Tacos"',
        context
      );
      expect(result?.content).toContain('Omröstning');
      expect(result?.content).toContain('Pizza');
      expect(result?.content).toContain('Sushi');
      expect(result?.content).toContain('Tacos');
      expect(result?.isPrivate).toBe(false);
    });

    it('should require at least 3 args', async () => {
      const result = await chatbotService.processMessage(
        '/poll "Question"',
        context
      );
      expect(result?.content).toContain('minst');
    });
  });

  describe('/info command', () => {
    it('should show channel info', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: 'channel-123',
        name: 'general',
        description: 'Main channel',
        createdAt: new Date(),
        _count: { messages: 42, members: 5 }
      });

      const result = await chatbotService.processMessage('/info', context);
      expect(result?.content).toContain('#general');
      expect(result?.content).toContain('42 meddelanden');
      expect(result?.content).toContain('5 medlemmar');
    });
  });

  describe('/remind command', () => {
    it('should set a reminder', async () => {
      vi.useFakeTimers();

      const result = await chatbotService.processMessage(
        '/remind 5 Dags för mötet!',
        context
      );
      expect(result?.content).toContain('Påminnelse satt');
      expect(result?.content).toContain('5 minut');

      vi.useRealTimers();
    });

    it('should reject invalid minutes', async () => {
      const result = await chatbotService.processMessage(
        '/remind 0 Test',
        context
      );
      expect(result?.content).toContain('1-1440');
    });
  });

  describe('getCommands', () => {
    it('should return all registered commands', () => {
      const commands = chatbotService.getCommands();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.find((c) => c.name === 'help')).toBeDefined();
      expect(commands.find((c) => c.name === 'status')).toBeDefined();
      expect(commands.find((c) => c.name === 'poll')).toBeDefined();
    });
  });
});
