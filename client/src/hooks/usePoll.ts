// Poll Hook - Manages poll state and voting
import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import type { Poll } from '../types';

interface UsePollOptions {
  messageId: string;
  initialPoll?: Poll | null;
}

interface UsePollReturn {
  poll: Poll | null;
  loading: boolean;
  voting: boolean;
  handleVote: (optionId: string) => Promise<void>;
  handleEndPoll: () => Promise<void>;
  refreshPoll: () => Promise<void>;
  setPoll: (poll: Poll) => void;
}

export function usePoll({
  messageId,
  initialPoll
}: UsePollOptions): UsePollReturn {
  const [poll, setPoll] = useState<Poll | null>(initialPoll ?? null);
  const [loading, setLoading] = useState(!initialPoll);
  const [voting, setVoting] = useState(false);

  // Fetch poll data on mount if not provided
  useEffect(() => {
    if (initialPoll) return;

    let cancelled = false;
    const fetchPoll = async () => {
      try {
        const data = await api.getPollByMessage(messageId);
        if (!cancelled && data) {
          setPoll(data);
        }
      } catch {
        logger.debug('No poll found for message', messageId);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPoll();
    return () => {
      cancelled = true;
    };
  }, [messageId, initialPoll]);

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!poll || voting) return;

      // Optimistic update
      const prevPoll = { ...poll };
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
      try {
        const updatedPoll = await api.votePoll(poll.id, optionId);
        setPoll(updatedPoll);
      } catch (err) {
        logger.error('Failed to vote:', err);
        setPoll(prevPoll); // Rollback
      } finally {
        setVoting(false);
      }
    },
    [poll, voting]
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
    try {
      const data = await api.getPollByMessage(messageId);
      if (data) setPoll(data);
    } catch {
      // ignore
    }
  }, [messageId]);

  return {
    poll,
    loading,
    voting,
    handleVote,
    handleEndPoll,
    refreshPoll,
    setPoll
  };
}
