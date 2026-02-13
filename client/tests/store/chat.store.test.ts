// ============================================================================
// Chat Store Tests - UI State Only
// ============================================================================
// After Phase 1 refactoring:
// - Server data (messages, channels, workspaces) moved to React Query
// - Zustand now only holds transient UI state
// - Tests updated to reflect new architecture
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../src/store/chat';
import { act, renderHook } from '@testing-library/react';

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.setCurrentWorkspace(null);
      result.current.setCurrentChannel(null);
      // Clear all typing indicators by creating a new empty Map
      // (Zustand doesn't have a clear method so we work around it)
      const store = useChatStore.getState();
      (store as any).typingUsers = new Map();
    });
  });

  describe('UI state - currentWorkspace', () => {
    it('should set current workspace', () => {
      const { result } = renderHook(() => useChatStore());
      const workspace = { id: 'ws-1', name: 'Workspace 1' };

      act(() => {
        result.current.setCurrentWorkspace(workspace);
      });

      expect(result.current.currentWorkspace).toEqual(workspace);
    });

    it('should clear current workspace', () => {
      const { result } = renderHook(() => useChatStore());
      const workspace = { id: 'ws-1', name: 'Workspace 1' };

      act(() => {
        result.current.setCurrentWorkspace(workspace);
      });

      expect(result.current.currentWorkspace).toEqual(workspace);

      act(() => {
        result.current.setCurrentWorkspace(null);
      });

      expect(result.current.currentWorkspace).toBeNull();
    });
  });

  describe('UI state - currentChannel', () => {
    it('should set current channel', () => {
      const { result } = renderHook(() => useChatStore());
      const channel = {
        id: 'ch-1',
        workspaceId: 'ws-1',
        name: 'general',
        type: 'TEXT' as const,
        isPrivate: false
      };

      act(() => {
        result.current.setCurrentChannel(channel);
      });

      expect(result.current.currentChannel).toEqual(channel);
    });

    it('should clear current channel', () => {
      const { result } = renderHook(() => useChatStore());
      const channel = {
        id: 'ch-1',
        workspaceId: 'ws-1',
        name: 'general',
        type: 'TEXT' as const,
        isPrivate: false
      };

      act(() => {
        result.current.setCurrentChannel(channel);
      });

      expect(result.current.currentChannel).toEqual(channel);

      act(() => {
        result.current.setCurrentChannel(null);
      });

      expect(result.current.currentChannel).toBeNull();
    });
  });

  describe('Transient state - typing indicators', () => {
    it('should set typing indicator for user', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('ch-1', 'user-1');
      });

      expect(result.current.typingUsers.get('ch-1')?.has('user-1')).toBe(true);
    });

    it('should handle multiple users typing in same channel', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('ch-1', 'user-1');
        result.current.setTyping('ch-1', 'user-2');
      });

      const typingInChannel = result.current.typingUsers.get('ch-1');
      expect(typingInChannel?.has('user-1')).toBe(true);
      expect(typingInChannel?.has('user-2')).toBe(true);
      expect(typingInChannel?.size).toBe(2);
    });

    it('should clear typing indicator for user', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('ch-1', 'user-1');
      });

      expect(result.current.typingUsers.get('ch-1')?.has('user-1')).toBe(true);

      act(() => {
        result.current.clearTyping('ch-1', 'user-1');
      });

      expect(result.current.typingUsers.get('ch-1')?.has('user-1')).toBe(false);
    });

    it('should handle typing indicators across multiple channels', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('ch-1', 'user-1');
        result.current.setTyping('ch-2', 'user-2');
      });

      expect(result.current.typingUsers.get('ch-1')?.has('user-1')).toBe(true);
      expect(result.current.typingUsers.get('ch-2')?.has('user-2')).toBe(true);
      expect(result.current.typingUsers.get('ch-1')?.has('user-2')).toBe(false);
    });
  });
});
