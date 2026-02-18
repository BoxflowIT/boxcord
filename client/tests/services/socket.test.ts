// Socket Service Cache Update Tests
// Tests for React Query cache updates triggered by socket events
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../src/hooks/useQuery';
import type {
  PaginatedMessages,
  DMChannel,
  Message,
  Channel
} from '../../src/types';

// Test helpers for simulating socket cache updates
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity
      }
    }
  });
}

function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    content: 'Test message',
    channelId: 'channel-1',
    authorId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    edited: false,
    author: {
      id: 'user-1',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User'
    },
    ...overrides
  };
}

function createMockDMChannel(overrides: Partial<DMChannel> = {}): DMChannel {
  return {
    id: 'dm-1',
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    participants: [
      {
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User'
        }
      }
    ],
    ...overrides
  };
}

describe('DM Cache Updates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe('dm:new event', () => {
    it('adds new message to cache when viewing DM', () => {
      const channelId = 'dm-channel-1';
      const dmKey = queryKeys.dmMessages(channelId, undefined);

      // Setup: existing messages in cache
      queryClient.setQueryData<PaginatedMessages>(dmKey, {
        items: [],
        hasMore: false
      });

      const newMessage = createMockMessage({ channelId });

      // Simulate socket handler logic
      queryClient.setQueryData<PaginatedMessages>(dmKey, (old) => {
        if (!old) return { items: [newMessage], hasMore: false };
        if (!old.items) return { ...old, items: [newMessage] };
        if (old.items.some((m) => m.id === newMessage.id)) return old;
        return { ...old, items: [...old.items, newMessage] };
      });

      // Verify
      const cached = queryClient.getQueryData<PaginatedMessages>(dmKey);
      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0].id).toBe(newMessage.id);
    });

    it('does not add duplicate messages', () => {
      const channelId = 'dm-channel-1';
      const dmKey = queryKeys.dmMessages(channelId, undefined);
      const existingMessage = createMockMessage({ channelId, id: 'msg-1' });

      // Setup: message already in cache
      queryClient.setQueryData<PaginatedMessages>(dmKey, {
        items: [existingMessage],
        hasMore: false
      });

      // Simulate receiving same message again
      queryClient.setQueryData<PaginatedMessages>(dmKey, (old) => {
        if (!old) return { items: [existingMessage], hasMore: false };
        if (!old.items) return { ...old, items: [existingMessage] };
        if (old.items.some((m) => m.id === existingMessage.id)) return old;
        return { ...old, items: [...old.items, existingMessage] };
      });

      // Verify: still only one message
      const cached = queryClient.getQueryData<PaginatedMessages>(dmKey);
      expect(cached?.items).toHaveLength(1);
    });

    it('increments unreadCount when not viewing DM', () => {
      const channelId = 'dm-channel-1';
      const dmChannel = createMockDMChannel({ id: channelId, unreadCount: 0 });

      // Setup: DM channels list in cache
      queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, [dmChannel]);

      // Simulate socket handler incrementing unread
      queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
        if (!old) return old;
        return old.map((ch) =>
          ch.id === channelId
            ? { ...ch, unreadCount: (ch.unreadCount ?? 0) + 1 }
            : ch
        );
      });

      // Verify
      const cached = queryClient.getQueryData<DMChannel[]>(
        queryKeys.dmChannels
      );
      expect(cached?.[0].unreadCount).toBe(1);
    });

    it('resets unreadCount to 0 when viewing DM', () => {
      const channelId = 'dm-channel-1';
      const dmChannel = createMockDMChannel({ id: channelId, unreadCount: 5 });

      // Setup: DM channels list with unread
      queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, [dmChannel]);

      // Simulate auto-mark as read (sets unreadCount to 0)
      queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
        if (!old) return old;
        return old.map((ch) =>
          ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
        );
      });

      // Verify
      const cached = queryClient.getQueryData<DMChannel[]>(
        queryKeys.dmChannels
      );
      expect(cached?.[0].unreadCount).toBe(0);
    });

    it('updates lastMessage in cache', () => {
      const channelId = 'dm-channel-1';
      const dmChannel = createMockDMChannel({ id: channelId });
      const newMessage = createMockMessage({ channelId, content: 'Hello!' });

      // Setup: DM channels list
      queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, [dmChannel]);

      // Simulate socket handler updating lastMessage with full message
      queryClient.setQueryData<DMChannel[]>(queryKeys.dmChannels, (old) => {
        if (!old) return old;
        return old.map((ch) =>
          ch.id === channelId ? { ...ch, lastMessage: newMessage } : ch
        );
      });

      // Verify
      const cached = queryClient.getQueryData<DMChannel[]>(
        queryKeys.dmChannels
      );
      expect(cached?.[0].lastMessage?.content).toBe('Hello!');
    });
  });

  describe('dm:edit event', () => {
    it('updates existing message in cache', () => {
      const channelId = 'dm-channel-1';
      const dmKey = queryKeys.dmMessages(channelId, undefined);
      const originalMessage = createMockMessage({
        channelId,
        content: 'Original'
      });

      // Setup: message in cache
      queryClient.setQueryData<PaginatedMessages>(dmKey, {
        items: [originalMessage],
        hasMore: false
      });

      // Simulate edit
      const editedMessage = { ...originalMessage, content: 'Edited' };
      queryClient.setQueryData<PaginatedMessages>(dmKey, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((m) =>
            m.id === editedMessage.id ? editedMessage : m
          )
        };
      });

      // Verify
      const cached = queryClient.getQueryData<PaginatedMessages>(dmKey);
      expect(cached?.items[0].content).toBe('Edited');
    });
  });

  describe('dm:delete event', () => {
    it('removes message from cache', () => {
      const channelId = 'dm-channel-1';
      const dmKey = queryKeys.dmMessages(channelId, undefined);
      const message = createMockMessage({ channelId });

      // Setup: message in cache
      queryClient.setQueryData<PaginatedMessages>(dmKey, {
        items: [message],
        hasMore: false
      });

      // Simulate delete
      const messageId = message.id;
      queryClient.setQueryData<PaginatedMessages>(dmKey, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.filter((m) => m.id !== messageId)
        };
      });

      // Verify
      const cached = queryClient.getQueryData<PaginatedMessages>(dmKey);
      expect(cached?.items).toHaveLength(0);
    });
  });
});

describe('Channel Cache Updates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  describe('message:new event', () => {
    it('adds message when viewing channel', () => {
      const channelId = 'channel-1';
      const messageKey = queryKeys.messages(channelId, undefined);

      queryClient.setQueryData<PaginatedMessages>(messageKey, {
        items: [],
        hasMore: false
      });

      const newMessage = createMockMessage({ channelId });

      queryClient.setQueryData<PaginatedMessages>(messageKey, (old) => {
        if (!old) return { items: [newMessage], hasMore: false };
        if (!old.items) return { ...old, items: [newMessage] };
        if (old.items.some((m) => m.id === newMessage.id)) return old;
        return { ...old, items: [...old.items, newMessage] };
      });

      const cached = queryClient.getQueryData<PaginatedMessages>(messageKey);
      expect(cached?.items).toHaveLength(1);
    });

    it('increments channel unreadCount when not viewing', () => {
      const workspaceId = 'workspace-1';
      const channelId = 'channel-1';
      const channelsKey = queryKeys.channels(workspaceId);

      // Setup: channels in cache
      const channel: Channel = {
        id: channelId,
        name: 'general',
        workspaceId,
        unreadCount: 0,
        type: 'TEXT',
        isPrivate: false
      };
      queryClient.setQueryData<Channel[]>(channelsKey, [channel]);

      // Simulate unread increment
      queryClient.setQueryData<Channel[]>(channelsKey, (old) => {
        if (!old) return old;
        return old.map((ch) =>
          ch.id === channelId
            ? { ...ch, unreadCount: (ch.unreadCount ?? 0) + 1 }
            : ch
        );
      });

      const cached = queryClient.getQueryData<Channel[]>(channelsKey);
      expect(cached?.[0].unreadCount).toBe(1);
    });
  });

  describe('message:edit event', () => {
    it('updates message content and sets edited flag', () => {
      const channelId = 'channel-1';
      const messageKey = queryKeys.messages(channelId, undefined);
      const originalMessage = createMockMessage({
        channelId,
        content: 'Original'
      });

      queryClient.setQueryData<PaginatedMessages>(messageKey, {
        items: [originalMessage],
        hasMore: false
      });

      const editedMessage = { ...originalMessage, content: 'Edited' };
      queryClient.setQueryData<PaginatedMessages>(messageKey, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((m) =>
            m.id === editedMessage.id
              ? { ...m, ...editedMessage, edited: true }
              : m
          )
        };
      });

      const cached = queryClient.getQueryData<PaginatedMessages>(messageKey);
      expect(cached?.items[0].content).toBe('Edited');
      expect(cached?.items[0].edited).toBe(true);
    });
  });

  describe('message:delete event', () => {
    it('removes message from cache', () => {
      const channelId = 'channel-1';
      const messageKey = queryKeys.messages(channelId, undefined);
      const message = createMockMessage({ channelId });

      queryClient.setQueryData<PaginatedMessages>(messageKey, {
        items: [message],
        hasMore: false
      });

      queryClient.setQueryData<PaginatedMessages>(messageKey, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.filter((m) => m.id !== message.id)
        };
      });

      const cached = queryClient.getQueryData<PaginatedMessages>(messageKey);
      expect(cached?.items).toHaveLength(0);
    });
  });
});

describe('queryKeys', () => {
  it('generates correct keys for workspaces', () => {
    expect(queryKeys.workspaces).toEqual(['workspaces']);
  });

  it('generates correct keys for channels', () => {
    expect(queryKeys.channels('ws-1')).toEqual(['channels', 'ws-1']);
  });

  it('generates correct keys for messages with cursor', () => {
    expect(queryKeys.messages('ch-1', 'cursor-123')).toEqual([
      'messages',
      'ch-1',
      'cursor-123'
    ]);
  });

  it('generates correct keys for messages without cursor', () => {
    expect(queryKeys.messages('ch-1', undefined)).toEqual([
      'messages',
      'ch-1',
      undefined
    ]);
  });

  it('generates correct keys for DM channels', () => {
    expect(queryKeys.dmChannels).toEqual(['dmChannels']);
  });

  it('generates correct keys for DM messages', () => {
    expect(queryKeys.dmMessages('dm-1', undefined)).toEqual([
      'dmMessages',
      'dm-1',
      undefined
    ]);
  });
});
