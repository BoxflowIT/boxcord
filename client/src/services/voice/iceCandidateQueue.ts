// ICE Candidate Queue — shared module that breaks the circular dependency
// between voiceHandlers (socket layer) and VoiceService (voice layer).
// Imports only store, logger, and voice constants — never voice.service or voiceHandlers.
import type SimplePeer from 'simple-peer';
import { useVoiceStore } from '../../store/voiceStore';
import { logger } from '../../utils/logger';
import { PEER_RECONNECT } from './constants';

// Queue for ICE candidates that arrive before peer is created
const candidateQueue = new Map<
  string,
  { data: SimplePeer.SignalData; timestamp: number }[]
>();

export function flushCandidateQueue(userId: string): void {
  const queued = candidateQueue.get(userId);
  if (!queued || queued.length === 0) return;

  const store = useVoiceStore.getState();
  const peer = store.peers.get(userId);
  if (!peer) return;

  const now = Date.now();
  let applied = 0;
  for (const entry of queued) {
    if (now - entry.timestamp < PEER_RECONNECT.ICE_QUEUE_TIMEOUT_MS) {
      peer.signal(entry.data);
      applied++;
    }
  }
  candidateQueue.delete(userId);
  if (applied > 0) {
    logger.log(`[WEBRTC] Flushed ${applied} queued candidates for ${userId}`);
  }
}

export function queueCandidate(
  fromUserId: string,
  signalData: SimplePeer.SignalData
): void {
  const MAX_QUEUED_PER_USER = 50;
  let queue = candidateQueue.get(fromUserId) ?? [];

  // Prune expired entries on enqueue
  const now = Date.now();
  queue = queue.filter(
    (e) => now - e.timestamp < PEER_RECONNECT.ICE_QUEUE_TIMEOUT_MS
  );

  // Drop oldest if at cap
  if (queue.length >= MAX_QUEUED_PER_USER) {
    queue.shift();
  }

  queue.push({ data: signalData, timestamp: now });
  candidateQueue.set(fromUserId, queue);
  logger.log(
    `[WEBRTC] Queued ICE candidate for ${fromUserId} (peer not ready, queue size: ${queue.length})`
  );
}

export function deleteCandidateQueue(userId: string): void {
  candidateQueue.delete(userId);
}

export function resetCandidateQueue(): void {
  candidateQueue.clear();
}
