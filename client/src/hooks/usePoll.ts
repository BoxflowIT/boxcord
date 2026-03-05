// Poll Hook - Manages poll state and voting
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction
} from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import type { Poll } from '../types';

/** Translate common server error messages to Swedish */
function translateError(msg: string): string {
  if (msg.includes('poll has ended') || msg.includes('has ended'))
    return 'Omröstningen har avslutats';
  if (msg.includes('not found') || msg.includes('Not found'))
    return 'Omröstningen hittades inte';
  if (msg.includes('Forbidden')) return 'Du har inte behörighet';
  return msg;
}

interface UsePollOptions {
  messageId: string;
  initialPoll?: Poll | null;
}

interface UsePollReturn {
  poll: Poll | null;
  loading: boolean;
  voting: boolean;
  voteError: string | null;
  handleVote: (optionId: string) => Promise<void>;
  handleEndPoll: () => Promise<void>;
  refreshPoll: () => Promise<void>;
  setPoll: Dispatch<SetStateAction<Poll | null>>;
}

export function usePoll({
  messageId,
  initialPoll
}: UsePollOptions): UsePollReturn {
  const [poll, setPoll] = useState<Poll | null>(initialPoll ?? null);
  const [loading, setLoading] = useState(!initialPoll);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const messageIdRef = useRef(messageId);
  messageIdRef.current = messageId;

  // Fetch poll data from server
  const fetchPollData = useCallback(async (): Promise<Poll | null> => {
    try {
      const data = await api.getPollByMessage(messageIdRef.current);
      return data;
    } catch {
      return null;
    }
  }, []);

  // Fetch poll data on mount if not provided
  useEffect(() => {
    if (initialPoll) return;

    let cancelled = false;
    const fetchPoll = async () => {
      try {
        const data = await fetchPollData();
        if (!cancelled && data) {
          setPoll(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPoll();
    return () => {
      cancelled = true;
    };
  }, [messageId, initialPoll, fetchPollData]);

  // Refresh poll data when the page regains focus (handles hard-refresh stale data)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchPollData().then((data) => {
          if (data) setPoll(data);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchPollData]);

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!poll || voting) return;

      // Check client-side if the poll has ended
      if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
        setVoteError('Omröstningen har avslutats');
        setTimeout(() => setVoteError(null), 4000);
        return;
      }

      // Optimistic update
      const isRemovingVote = poll.options.find(
        (o) => o.id === optionId
      )?.hasVoted;

      setPoll((prev) => {
        if (!prev) return prev;

        const updated = { ...prev };
        let newOptions = prev.options.map((opt) => ({ ...opt }));

        if (isRemovingVote) {
          // Remove vote from this option
          newOptions = newOptions.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  hasVoted: false,
                  voteCount: Math.max(0, opt.voteCount - 1)
                }
              : opt
          );
          updated.totalVotes = Math.max(0, updated.totalVotes - 1);
        } else {
          // For single-choice, remove vote from other options first
          if (!prev.isMultiple) {
            newOptions = newOptions.map((opt) =>
              opt.hasVoted
                ? {
                    ...opt,
                    hasVoted: false,
                    voteCount: Math.max(0, opt.voteCount - 1)
                  }
                : opt
            );
            updated.totalVotes = newOptions.reduce(
              (sum, o) => sum + o.voteCount,
              0
            );
          }

          // Add vote to selected option
          newOptions = newOptions.map((opt) =>
            opt.id === optionId
              ? { ...opt, hasVoted: true, voteCount: opt.voteCount + 1 }
              : opt
          );
          updated.totalVotes = newOptions.reduce(
            (sum, o) => sum + o.voteCount,
            0
          );
        }

        // Recalculate percentages
        newOptions = newOptions.map((opt) => ({
          ...opt,
          percentage:
            updated.totalVotes > 0
              ? Math.round((opt.voteCount / updated.totalVotes) * 100)
              : 0
        }));

        updated.options = newOptions;
        updated.hasVoted = newOptions.some((o) => o.hasVoted);
        return updated;
      });

      // Server call
      setVoting(true);
      setVoteError(null);
      try {
        const updatedPoll = await api.votePoll(poll.id, optionId);
        setPoll(updatedPoll);
      } catch (err) {
        logger.error('[usePoll] vote failed:', err);
        // Instead of rolling back to stale prevPoll, fetch fresh data from server.
        // This ensures the UI shows the actual current state (e.g. ended polls,
        // votes from other users) instead of the pre-vote snapshot.
        const freshPoll = await fetchPollData();
        if (freshPoll) {
          setPoll(freshPoll);
        }
        const message = err instanceof Error ? err.message : 'Kunde inte rösta';
        setVoteError(translateError(message));
        // Auto-clear error after 4 seconds
        setTimeout(() => setVoteError(null), 4000);
      } finally {
        setVoting(false);
      }
    },
    [poll, voting, fetchPollData]
  );

  const handleEndPoll = useCallback(async () => {
    if (!poll) return;

    try {
      const updatedPoll = await api.endPoll(poll.id);
      setPoll(updatedPoll);
    } catch (err) {
      logger.error('Failed to end poll:', err);
    }
  }, [poll]);

  const refreshPoll = useCallback(async () => {
    const data = await fetchPollData();
    if (data) setPoll(data);
  }, [fetchPollData]);

  return {
    poll,
    loading,
    voting,
    voteError,
    handleVote,
    handleEndPoll,
    refreshPoll,
    setPoll
  };
}
