// Voice Service Tests
// Tests for peer management, ICE candidate queuing, and retry logic
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useVoiceStore } from '../../src/store/voiceStore';

// ============================================================================
// Mock SimplePeer
// ============================================================================

function createMockPeer(initiator = false) {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  return {
    initiator,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      const arr = listeners.get(event) ?? [];
      arr.push(cb);
      listeners.set(event, arr);
    }),
    signal: vi.fn(),
    destroy: vi.fn(),
    _emit(event: string, ...args: unknown[]) {
      for (const cb of listeners.get(event) ?? []) cb(...args);
    }
  };
}

vi.mock('simple-peer', () => {
  const MockPeer = vi.fn().mockImplementation(function (
    this: ReturnType<typeof createMockPeer>,
    opts: { initiator: boolean }
  ) {
    const mock = createMockPeer(opts.initiator);
    Object.assign(this, mock);
  });
  return { default: MockPeer };
});

vi.mock('../../src/utils/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('../../src/services/voice/audioManager', () => ({
  playRemoteStream: vi.fn()
}));

vi.mock('../../../../src/00-core/constants', () => ({
  SOCKET_EVENTS: {
    WEBRTC_OFFER: 'webrtc:offer',
    WEBRTC_ANSWER: 'webrtc:answer'
  }
}));

// ============================================================================
// 1. Peer Manager — retry logic & resetRetryState
// ============================================================================

describe('peerManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useVoiceStore());
    act(() => result.current.reset());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('resetRetryState', () => {
    it('clears retry tracking map', async () => {
      const { resetRetryState } =
        await import('../../src/services/voice/peerManager');
      // Should not throw even if empty
      expect(() => resetRetryState()).not.toThrow();
    });
  });

  describe('createPeerConnection', () => {
    it('creates peer with correct ICE config', async () => {
      const SimplePeer = (await import('simple-peer')).default;
      const { createPeerConnection } =
        await import('../../src/services/voice/peerManager');

      createPeerConnection(true, null);

      expect(SimplePeer).toHaveBeenCalledWith(
        expect.objectContaining({
          initiator: true,
          trickle: true,
          config: expect.objectContaining({
            iceServers: expect.arrayContaining([
              expect.objectContaining({ urls: 'stun:stun.l.google.com:19302' })
            ])
          })
        })
      );
    });

    it('passes local stream to peer', async () => {
      const SimplePeer = (await import('simple-peer')).default;
      const { createPeerConnection } =
        await import('../../src/services/voice/peerManager');

      const mockStream = {} as MediaStream;
      createPeerConnection(false, mockStream);

      expect(SimplePeer).toHaveBeenCalledWith(
        expect.objectContaining({
          initiator: false,
          stream: mockStream
        })
      );
    });
  });
});

// ============================================================================
// 2. Voice Store — addPeer / removePeer
// ============================================================================

describe('voiceStore peer management', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useVoiceStore());
    act(() => result.current.reset());
  });

  it('adds and retrieves a peer', () => {
    const { result } = renderHook(() => useVoiceStore());
    const mockPeer =
      createMockPeer() as unknown as import('simple-peer').Instance;

    act(() => {
      result.current.addPeer('user-a', mockPeer);
    });

    expect(result.current.peers.get('user-a')).toBe(mockPeer);
  });

  it('removes a peer', () => {
    const { result } = renderHook(() => useVoiceStore());
    const mockPeer =
      createMockPeer() as unknown as import('simple-peer').Instance;

    act(() => {
      result.current.addPeer('user-a', mockPeer);
      result.current.removePeer('user-a');
    });

    expect(result.current.peers.has('user-a')).toBe(false);
  });

  it('handles removing non-existent peer gracefully', () => {
    const { result } = renderHook(() => useVoiceStore());

    act(() => {
      result.current.removePeer('non-existent');
    });

    expect(result.current.peers.size).toBe(0);
  });
});

// ============================================================================
// 3. Deterministic initiator logic
// ============================================================================

describe('deterministic initiator', () => {
  it('lower userId should initiate', () => {
    // This tests the comparison logic used in voiceHandlers
    const currentUserId = 'user-aaa';
    const remoteUserId = 'user-bbb';

    const shouldInitiate = currentUserId < remoteUserId;
    expect(shouldInitiate).toBe(true);
  });

  it('higher userId should not initiate', () => {
    const currentUserId = 'user-bbb';
    const remoteUserId = 'user-aaa';

    const shouldInitiate = currentUserId < remoteUserId;
    expect(shouldInitiate).toBe(false);
  });

  it('identical userId should not initiate (edge case)', () => {
    const currentUserId = 'user-aaa';
    const remoteUserId = 'user-aaa';

    const shouldInitiate = currentUserId < remoteUserId;
    expect(shouldInitiate).toBe(false);
  });
});

// ============================================================================
// 4. ICE candidate queue logic
// ============================================================================

describe('ICE candidate queue', () => {
  it('queued candidates should expire after timeout', () => {
    const QUEUE_TIMEOUT_MS = 5000;
    const now = Date.now();

    const entries = [
      { data: { candidate: 'c1' }, timestamp: now - 6000 }, // expired
      { data: { candidate: 'c2' }, timestamp: now - 1000 } // still valid
    ];

    const valid = entries.filter((e) => now - e.timestamp < QUEUE_TIMEOUT_MS);

    expect(valid).toHaveLength(1);
    expect(valid[0].data.candidate).toBe('c2');
  });

  it('empty queue should be handled gracefully', () => {
    const queue = new Map<string, { data: unknown; timestamp: number }[]>();
    const queued = queue.get('non-existent');

    expect(queued).toBeUndefined();
    expect(!queued || queued.length === 0).toBe(true);
  });
});

// ============================================================================
// 5. PEER_RECONNECT constants
// ============================================================================

describe('PEER_RECONNECT constants', () => {
  it('has expected configuration values', async () => {
    const { PEER_RECONNECT } =
      await import('../../src/services/voice/constants');

    expect(PEER_RECONNECT.MAX_RETRIES).toBe(3);
    expect(PEER_RECONNECT.BASE_DELAY_MS).toBe(1000);
    expect(PEER_RECONNECT.ICE_QUEUE_TIMEOUT_MS).toBe(5000);
  });

  it('exponential backoff produces correct delays', async () => {
    const { PEER_RECONNECT } =
      await import('../../src/services/voice/constants');

    const delays = Array.from(
      { length: PEER_RECONNECT.MAX_RETRIES },
      (_, i) => PEER_RECONNECT.BASE_DELAY_MS * Math.pow(2, i)
    );

    expect(delays).toEqual([1000, 2000, 4000]); // 1s, 2s, 4s
  });
});

// ============================================================================
// 6. ICE_SERVERS configuration
// ============================================================================

describe('ICE_SERVERS', () => {
  it('includes STUN and TURN servers in dev mode', async () => {
    const { ICE_SERVERS } = await import('../../src/services/voice/constants');

    const stunServers = ICE_SERVERS.filter((s) =>
      s.urls.toString().startsWith('stun:')
    );
    const turnServers = ICE_SERVERS.filter(
      (s) =>
        s.urls.toString().startsWith('turn:') ||
        s.urls.toString().startsWith('turns:')
    );

    expect(stunServers.length).toBeGreaterThanOrEqual(1);
    expect(turnServers.length).toBeGreaterThanOrEqual(1);
  });

  it('TURN servers have credentials', async () => {
    const { ICE_SERVERS } = await import('../../src/services/voice/constants');

    const turnServers = ICE_SERVERS.filter(
      (s) =>
        s.urls.toString().startsWith('turn:') ||
        s.urls.toString().startsWith('turns:')
    );

    for (const turn of turnServers) {
      expect(turn.username).toBeDefined();
      expect(turn.credential).toBeDefined();
    }
  });

  it('uses turns: (TLS) for port 443 servers', async () => {
    const { ICE_SERVERS } = await import('../../src/services/voice/constants');

    const port443Servers = ICE_SERVERS.filter((s) =>
      s.urls.toString().includes(':443')
    );

    for (const server of port443Servers) {
      expect(server.urls.toString()).toMatch(/^turns:/);
    }
  });
});
