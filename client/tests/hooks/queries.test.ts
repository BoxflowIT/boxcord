// Query Hooks Tests
import { describe, it, expect } from 'vitest';
import { queryKeys, CACHE_TIMES } from '../../src/hooks/queries/constants';

describe('Query Constants', () => {
  describe('queryKeys', () => {
    it('should generate correct workspace query keys', () => {
      expect(queryKeys.workspaces).toEqual(['workspaces']);
      expect(queryKeys.workspace('123')).toEqual(['workspace', '123']);
      expect(queryKeys.workspaceMembers('456')).toEqual([
        'workspaceMembers',
        '456'
      ]);
    });

    it('should generate correct channel query keys', () => {
      expect(queryKeys.channels('workspace-1')).toEqual([
        'channels',
        'workspace-1'
      ]);
      expect(queryKeys.voiceChannelUsers('channel-1')).toEqual([
        'voiceChannelUsers',
        'channel-1'
      ]);
    });

    it('should generate correct message query keys', () => {
      expect(queryKeys.messages('channel-1')).toEqual([
        'messages',
        'channel-1',
        undefined
      ]);
      expect(queryKeys.messages('channel-1', 'cursor-123')).toEqual([
        'messages',
        'channel-1',
        'cursor-123'
      ]);
    });

    it('should generate correct DM query keys', () => {
      expect(queryKeys.dmChannels).toEqual(['dmChannels']);
      expect(queryKeys.dmMessages('dm-1')).toEqual([
        'dmMessages',
        'dm-1',
        undefined
      ]);
      expect(queryKeys.dmMessages('dm-1', 'cursor-abc')).toEqual([
        'dmMessages',
        'dm-1',
        'cursor-abc'
      ]);
    });

    it('should generate correct user query keys', () => {
      expect(queryKeys.onlineUsers).toEqual(['onlineUsers']);
      expect(queryKeys.currentUser).toEqual(['currentUser']);
      expect(queryKeys.user('user-1')).toEqual(['user', 'user-1']);
    });

    it('should generate correct reaction query keys', () => {
      expect(queryKeys.reactions('msg-1')).toEqual(['reactions', 'msg-1']);
    });
  });

  describe('CACHE_TIMES', () => {
    it('should have appropriate stale times for socket-updated data', () => {
      // Workspaces use a short stale time as safety net (socket keeps fresh)
      expect(CACHE_TIMES.WORKSPACES.stale).toBe(30 * 1000);
      expect(CACHE_TIMES.CHANNELS.stale).toBe(Infinity);
      expect(CACHE_TIMES.MESSAGES.stale).toBe(Infinity);
      expect(CACHE_TIMES.USERS.stale).toBe(Infinity);
      expect(CACHE_TIMES.CURRENT_USER.stale).toBe(Infinity);
    });

    it('should have reasonable garbage collection times', () => {
      expect(CACHE_TIMES.WORKSPACES.gc).toBeGreaterThan(0);
      expect(CACHE_TIMES.CHANNELS.gc).toBeGreaterThan(0);
      expect(CACHE_TIMES.MESSAGES.gc).toBeGreaterThan(0);
      expect(CACHE_TIMES.USERS.gc).toBeGreaterThan(0);
      expect(CACHE_TIMES.CURRENT_USER.gc).toBeGreaterThan(0);
    });

    it('should prioritize message cleanup (shortest gc time)', () => {
      expect(CACHE_TIMES.MESSAGES.gc).toBeLessThan(CACHE_TIMES.CHANNELS.gc);
      expect(CACHE_TIMES.MESSAGES.gc).toBeLessThan(CACHE_TIMES.WORKSPACES.gc);
    });
  });
});
