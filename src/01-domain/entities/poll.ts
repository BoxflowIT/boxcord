// Domain entity: Poll

export interface Poll {
  id: string;
  messageId: string;
  channelId: string;
  creatorId: string;
  question: string;
  isMultiple: boolean;
  isAnonymous: boolean;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  position: number;
}

export interface PollVote {
  id: string;
  optionId: string;
  userId: string;
  createdAt: Date;
}

export interface CreatePollInput {
  channelId: string;
  creatorId: string;
  question: string;
  options: string[];
  isMultiple?: boolean;
  isAnonymous?: boolean;
  endsAt?: Date;
}

export interface PollWithResults {
  id: string;
  messageId: string;
  channelId: string;
  creatorId: string;
  question: string;
  isMultiple: boolean;
  isAnonymous: boolean;
  endsAt: string | null;
  createdAt: string;
  totalVotes: number;
  options: PollOptionWithVotes[];
  hasVoted: boolean;
}

export interface CreatePollResult {
  poll: PollWithResults;
  message: {
    id: string;
    channelId: string;
    authorId: string;
    content: string;
    edited: boolean;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PollOptionWithVotes {
  id: string;
  text: string;
  position: number;
  voteCount: number;
  percentage: number;
  hasVoted: boolean;
  voters: string[]; // User IDs (empty if anonymous)
}

// Domain rules
export const POLL_RULES = {
  MIN_QUESTION_LENGTH: 1,
  MAX_QUESTION_LENGTH: 500,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MIN_OPTION_LENGTH: 1,
  MAX_OPTION_LENGTH: 200
} as const;

export function validatePollQuestion(question: string): boolean {
  return (
    question.length >= POLL_RULES.MIN_QUESTION_LENGTH &&
    question.length <= POLL_RULES.MAX_QUESTION_LENGTH
  );
}

export function validatePollOptions(options: string[]): boolean {
  if (
    options.length < POLL_RULES.MIN_OPTIONS ||
    options.length > POLL_RULES.MAX_OPTIONS
  ) {
    return false;
  }
  return options.every(
    (opt) =>
      opt.length >= POLL_RULES.MIN_OPTION_LENGTH &&
      opt.length <= POLL_RULES.MAX_OPTION_LENGTH
  );
}
