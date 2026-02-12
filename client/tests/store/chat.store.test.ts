// Chat Store Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../src/store/chat';
import { act, renderHook } from '@testing-library/react';

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.setWorkspaces([]);
      result.current.setChannels([]);
      result.current.setMessages([]);
      result.current.setCurrentWorkspace(null);
      result.current.setCurrentChannel(null);
    });
  });

  describe('workspaces', () => {
    it('should set workspaces', () => {
      const { result } = renderHook(() => useChatStore());

      const workspaces = [
        { id: 'ws-1', name: 'Workspace 1' },
        { id: 'ws-2', name: 'Workspace 2' },
      ];

      act(() => {
        result.current.setWorkspaces(workspaces);
      });

      expect(result.current.workspaces).toHaveLength(2);
    });

    it('should add workspace', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.addWorkspace({ id: 'ws-1', name: 'Workspace 1' });
      });

      expect(result.current.workspaces).toHaveLength(1);

      act(() => {
        result.current.addWorkspace({ id: 'ws-2', name: 'Workspace 2' });
      });

      expect(result.current.workspaces).toHaveLength(2);
    });

    it('should set current workspace', () => {
      const { result } = renderHook(() => useChatStore());
      const workspace = { id: 'ws-1', name: 'Workspace 1' };

      act(() => {
        result.current.setCurrentWorkspace(workspace);
      });

      expect(result.current.currentWorkspace).toEqual(workspace);
    });
  });

  describe('channels', () => {
    it('should set channels', () => {
      const { result } = renderHook(() => useChatStore());

      const channels = [
        { id: 'ch-1', workspaceId: 'ws-1', name: 'general', type: 'TEXT' as const, isPrivate: false },
        { id: 'ch-2', workspaceId: 'ws-1', name: 'random', type: 'TEXT' as const, isPrivate: false },
      ];

      act(() => {
        result.current.setChannels(channels);
      });

      expect(result.current.channels).toHaveLength(2);
    });

    it('should add channel', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.addChannel({
          id: 'ch-1',
          workspaceId: 'ws-1',
          name: 'general',
          type: 'TEXT',
          isPrivate: false,
        });
      });

      expect(result.current.channels).toHaveLength(1);
    });
  });

  describe('messages', () => {
    it('should set messages', () => {
      const { result } = renderHook(() => useChatStore());

      const messages = [
        { id: 'm-1', channelId: 'ch-1', authorId: 'u-1', content: 'Hello', edited: false, createdAt: '', updatedAt: '' },
        { id: 'm-2', channelId: 'ch-1', authorId: 'u-2', content: 'World', edited: false, createdAt: '', updatedAt: '' },
      ];

      act(() => {
        result.current.setMessages(messages);
      });

      expect(result.current.messages).toHaveLength(2);
    });

    it('should add message', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.addMessage({
          id: 'm-1',
          channelId: 'ch-1',
          authorId: 'u-1',
          content: 'Hello',
          edited: false,
          createdAt: '',
          updatedAt: '',
        });
      });

      expect(result.current.messages).toHaveLength(1);
    });

    it('should update message', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setMessages([
          { id: 'm-1', channelId: 'ch-1', authorId: 'u-1', content: 'Hello', edited: false, createdAt: '', updatedAt: '' },
        ]);
      });

      act(() => {
        result.current.updateMessage({
          id: 'm-1',
          channelId: 'ch-1',
          authorId: 'u-1',
          content: 'Updated content',
          edited: true,
          createdAt: '',
          updatedAt: '',
        });
      });

      expect(result.current.messages[0].content).toBe('Updated content');
      expect(result.current.messages[0].edited).toBe(true);
    });

    it('should remove message', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setMessages([
          { id: 'm-1', channelId: 'ch-1', authorId: 'u-1', content: 'Hello', edited: false, createdAt: '', updatedAt: '' },
          { id: 'm-2', channelId: 'ch-1', authorId: 'u-1', content: 'World', edited: false, createdAt: '', updatedAt: '' },
        ]);
      });

      act(() => {
        result.current.removeMessage('m-1');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('m-2');
    });
  });
});
