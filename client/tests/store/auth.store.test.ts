// Auth Store Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/store/auth';
import { act, renderHook } from '@testing-library/react';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should start with null token and user', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should set auth correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'MEMBER'
    };

    act(() => {
      result.current.setAuth('mock-token', mockUser);
    });

    expect(result.current.token).toBe('mock-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('should logout correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    // First set auth
    act(() => {
      result.current.setAuth('mock-token', {
        id: 'user-1',
        email: 'test@example.com',
        role: 'MEMBER'
      });
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
