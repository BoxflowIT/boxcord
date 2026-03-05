// Poll Message Component - Displays an interactive poll in a message
import React, { memo, useEffect, useState } from 'react';
import { usePoll } from '../hooks/usePoll';
import { useAuthStore } from '../store/auth';
import { socketService } from '../services/socket';
import { cn } from '../utils/classNames';
import { PollIcon, CheckIcon } from './ui/Icons';
import type { Poll } from '../types';

/** Show results (progress bars + percentages) when any of these are true */
function shouldShowResults(poll: Poll, isEnded: boolean): boolean {
  return poll.hasVoted || isEnded || poll.totalVotes > 0;
}

interface PollMessageProps {
  messageId: string;
  initialPoll?: Poll | null;
}

const OPTION_COLORS = [
  'bg-boxflow-primary',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-indigo-500'
];

const PollMessageComponent: React.FC<PollMessageProps> = ({
  messageId,
  initialPoll
}) => {
  const {
    poll,
    loading,
    voting,
    voteError,
    handleVote,
    handleEndPoll,
    setPoll
  } = usePoll({
    messageId,
    initialPoll
  });
  const userId = useAuthStore((s) => s.user?.id);

  // Live ended check — updates via state so the UI re-renders when time passes endsAt
  const endsAt = poll?.endsAt ?? null;
  const [isEnded, setIsEnded] = useState(() => {
    if (!endsAt) return false;
    return new Date(endsAt) < new Date();
  });

  useEffect(() => {
    if (!endsAt) {
      setIsEnded(false);
      return;
    }

    const remaining = new Date(endsAt).getTime() - Date.now();
    if (remaining <= 0) {
      setIsEnded(true);
      return;
    }

    // Not ended yet — schedule a re-check when the time arrives
    setIsEnded(false);
    const timer = setTimeout(() => setIsEnded(true), remaining + 500);
    return () => clearTimeout(timer);
  }, [endsAt]);

  const isCreator = userId === poll?.creatorId;
  const showResults = poll ? shouldShowResults(poll, isEnded) : false;

  // Listen for real-time poll updates via socket
  // NOTE: Do NOT include `poll` in deps — it changes on every vote and
  // would tear down + re-register the listener in a loop. Use setPoll
  // updater form to access current state without a dependency.
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Lightweight vote event — update counts while preserving user's own hasVoted
    const handleVoteUpdate = (data: {
      pollId: string;
      messageId: string;
      voterId?: string;
      options: Array<{
        id: string;
        voteCount: number;
        percentage: number;
        voters: string[];
      }>;
      totalVotes: number;
    }) => {
      if (data.messageId !== messageId) return;

      // Skip own vote events — the HTTP response is authoritative
      // to avoid a race condition where the socket event overwrites
      // the correct state from the API response.
      if (data.voterId && data.voterId === userId) return;

      setPoll((prev) => {
        if (!prev) return prev;
        const updatedOptions = prev.options.map((opt) => {
          const serverOpt = data.options.find((o) => o.id === opt.id);
          if (!serverOpt) return opt;
          return {
            ...opt,
            voteCount: serverOpt.voteCount,
            percentage: serverOpt.percentage,
            voters: serverOpt.voters,
            // Derive hasVoted from voters list for current user
            hasVoted: userId ? serverOpt.voters.includes(userId) : opt.hasVoted
          };
        });
        return {
          ...prev,
          totalVotes: data.totalVotes,
          options: updatedOptions,
          hasVoted: updatedOptions.some((o) => o.hasVoted)
        };
      });
    };

    // Full poll update for ended events
    const handlePollEnded = (updatedPoll: Poll) => {
      if (updatedPoll.messageId === messageId) {
        setPoll(updatedPoll);
      }
    };

    socket.on('poll:voted', handleVoteUpdate);
    socket.on('poll:ended', handlePollEnded);

    return () => {
      socket.off('poll:voted', handleVoteUpdate);
      socket.off('poll:ended', handlePollEnded);
    };
  }, [messageId, setPoll, userId]);

  if (loading) {
    return (
      <div className="card animate-pulse my-2 max-w-md">
        <div className="h-4 bg-boxflow-hover rounded w-3/4 mb-3" />
        <div className="h-8 bg-boxflow-hover rounded mb-2" />
        <div className="h-8 bg-boxflow-hover rounded mb-2" />
        <div className="h-8 bg-boxflow-hover rounded" />
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="card my-2 max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <PollIcon size="sm" className="text-boxflow-primary" />
        <h3 className="font-semibold text-boxflow-light text-sm leading-tight">
          {poll.question}
        </h3>
      </div>

      {/* Poll type badges */}
      <div className="flex gap-2 mb-3">
        {poll.isMultiple && <span className="badge-primary">Flerval</span>}
        {poll.isAnonymous && <span className="badge-primary">Anonym</span>}
        {isEnded && <span className="badge-danger">Avslutad</span>}
      </div>

      {/* Vote error */}
      {voteError && (
        <div className="px-3 py-1.5 mb-2 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-300">
          {voteError}
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => !isEnded && handleVote(option.id)}
            disabled={isEnded || voting}
            className={cn(
              'w-full text-left rounded-md p-2 transition-all relative overflow-hidden group',
              'border',
              isEnded || voting
                ? 'cursor-default'
                : 'cursor-pointer hover:border-boxflow-primary',
              option.hasVoted
                ? 'border-boxflow-primary bg-boxflow-primary-10'
                : 'border-boxflow-border bg-boxflow-dark'
            )}
          >
            {/* Progress bar background */}
            {showResults && (
              <div
                className={cn(
                  'absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-md opacity-20',
                  OPTION_COLORS[index % OPTION_COLORS.length]
                )}
                style={{ width: `${option.percentage}%` }}
              />
            )}

            {/* Content */}
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Checkbox/Radio indicator */}
                <div
                  className={cn(
                    'flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center',
                    poll.isMultiple ? 'rounded' : 'rounded-full',
                    option.hasVoted
                      ? 'border-boxflow-primary bg-boxflow-primary'
                      : 'border-boxflow-muted'
                  )}
                >
                  {option.hasVoted && (
                    <CheckIcon size="sm" className="w-2.5 h-2.5 text-white" />
                  )}
                </div>

                <span className="text-sm text-boxflow-light truncate">
                  {option.text}
                </span>
              </div>

              {/* Vote count & percentage */}
              {showResults && (
                <span className="flex-shrink-0 text-muted font-medium">
                  {option.voteCount} ({option.percentage}%)
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-boxflow-border">
        <span className="text-muted">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'röst' : 'röster'}
        </span>

        <div className="flex items-center gap-2">
          {poll.endsAt && !isEnded && (
            <span className="text-muted">
              Slutar{' '}
              {new Date(poll.endsAt).toLocaleString('sv-SE', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}

          {isCreator && !isEnded && (
            <button
              onClick={handleEndPoll}
              className="text-xs text-boxflow-danger hover:text-red-300 transition-colors"
            >
              Avsluta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const PollMessage = memo(PollMessageComponent);
