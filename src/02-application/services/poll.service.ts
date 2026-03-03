// Poll Service - Application Layer
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError
} from '../../00-core/errors.js';
import { POLL_MESSAGE_PREFIX } from '../../00-core/constants.js';
import {
  POLL_RULES,
  validatePollQuestion,
  validatePollOptions
} from '../../01-domain/entities/poll.js';
import type {
  CreatePollInput,
  CreatePollResult,
  PollWithResults,
  PollOptionWithVotes
} from '../../01-domain/entities/poll.js';

export class PollService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  /**
   * Create a new poll attached to a message
   */
  async createPoll(input: CreatePollInput): Promise<CreatePollResult> {
    // Validate using domain functions
    if (!validatePollQuestion(input.question)) {
      throw new ValidationError(
        `Question must be ${POLL_RULES.MIN_QUESTION_LENGTH}-${POLL_RULES.MAX_QUESTION_LENGTH} characters`
      );
    }

    if (!validatePollOptions(input.options)) {
      throw new ValidationError(
        `Must have ${POLL_RULES.MIN_OPTIONS}-${POLL_RULES.MAX_OPTIONS} options, each ${POLL_RULES.MIN_OPTION_LENGTH}-${POLL_RULES.MAX_OPTION_LENGTH} characters`
      );
    }

    // Verify channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: input.channelId }
    });
    if (!channel) {
      throw new NotFoundError('Channel', input.channelId);
    }

    // Create the message + poll + options in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the message that anchors the poll
      const message = await tx.message.create({
        data: {
          channelId: input.channelId,
          authorId: input.creatorId,
          content: `${POLL_MESSAGE_PREFIX} ${input.question}`
        }
      });

      // Create poll
      const poll = await tx.poll.create({
        data: {
          messageId: message.id,
          channelId: input.channelId,
          creatorId: input.creatorId,
          question: input.question,
          isMultiple: input.isMultiple ?? false,
          isAnonymous: input.isAnonymous ?? false,
          endsAt: input.endsAt ?? null
        }
      });

      // Create options
      const options = await Promise.all(
        input.options.map((text, index) =>
          tx.pollOption.create({
            data: {
              pollId: poll.id,
              text,
              position: index
            }
          })
        )
      );

      return { message, poll, options };
    });

    return {
      poll: {
        id: result.poll.id,
        messageId: result.message.id,
        channelId: result.poll.channelId,
        creatorId: result.poll.creatorId,
        question: result.poll.question,
        isMultiple: result.poll.isMultiple,
        isAnonymous: result.poll.isAnonymous,
        endsAt: result.poll.endsAt?.toISOString() ?? null,
        createdAt: result.poll.createdAt.toISOString(),
        totalVotes: 0,
        hasVoted: false,
        options: result.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          position: opt.position,
          voteCount: 0,
          percentage: 0,
          hasVoted: false,
          voters: []
        }))
      },
      message: result.message
    };
  }

  /**
   * Get poll with results for a given user
   */
  async getPoll(pollId: string, userId: string): Promise<PollWithResults> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!poll) {
      throw new NotFoundError('Poll', pollId);
    }

    return this.formatPollResults(poll, userId);
  }

  /**
   * Get poll by message ID
   */
  async getPollByMessageId(
    messageId: string,
    userId: string
  ): Promise<PollWithResults | null> {
    const poll = await this.prisma.poll.findUnique({
      where: { messageId },
      include: {
        options: {
          include: {
            votes: true
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!poll) return null;

    return this.formatPollResults(poll, userId);
  }

  /**
   * Vote on a poll option
   */
  async vote(
    pollId: string,
    optionId: string,
    userId: string
  ): Promise<PollWithResults> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: { votes: true },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!poll) {
      throw new NotFoundError('Poll', pollId);
    }

    // Check if poll has ended
    if (poll.endsAt && poll.endsAt < new Date()) {
      throw new ForbiddenError('This poll has ended');
    }

    // Verify option belongs to this poll
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) {
      throw new NotFoundError('Poll option', optionId);
    }

    // Check for existing vote on this option
    const existingVote = option.votes.find((v) => v.userId === userId);

    if (existingVote) {
      // Remove vote (toggle off)
      await this.prisma.pollVote.delete({
        where: { id: existingVote.id }
      });
    } else {
      // If single-choice, remove any existing votes first
      if (!poll.isMultiple) {
        const existingVoteIds = poll.options
          .flatMap((o) => o.votes)
          .filter((v) => v.userId === userId)
          .map((v) => v.id);

        if (existingVoteIds.length > 0) {
          await this.prisma.pollVote.deleteMany({
            where: { id: { in: existingVoteIds } }
          });
        }
      }

      // Add vote
      try {
        await this.prisma.pollVote.create({
          data: { optionId, userId }
        });
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'P2002') {
          throw new ConflictError('You have already voted for this option');
        }
        throw err;
      }
    }

    // Return updated results
    return this.getPoll(pollId, userId);
  }

  /**
   * End a poll early (only creator can do this)
   */
  async endPoll(pollId: string, userId: string): Promise<PollWithResults> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      throw new NotFoundError('Poll', pollId);
    }

    if (poll.creatorId !== userId) {
      throw new ForbiddenError('Only the poll creator can end the poll');
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { endsAt: new Date() }
    });

    return this.getPoll(pollId, userId);
  }

  /**
   * Delete a poll (only creator can do this)
   */
  async deletePoll(pollId: string, userId: string): Promise<void> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      throw new NotFoundError('Poll', pollId);
    }

    if (poll.creatorId !== userId) {
      throw new ForbiddenError('Only the poll creator can delete the poll');
    }

    // Delete the poll (cascade deletes options + votes)
    // Also delete the anchoring message
    await this.prisma.$transaction([
      this.prisma.poll.delete({ where: { id: pollId } }),
      this.prisma.message.delete({ where: { id: poll.messageId } })
    ]);
  }

  /**
   * Format raw poll data into PollWithResults
   */
  private formatPollResults(
    poll: {
      id: string;
      messageId: string;
      channelId: string;
      creatorId: string;
      question: string;
      isMultiple: boolean;
      isAnonymous: boolean;
      endsAt: Date | null;
      createdAt: Date;
      options: Array<{
        id: string;
        text: string;
        position: number;
        votes: Array<{ userId: string }>;
      }>;
    },
    userId: string
  ): PollWithResults {
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + opt.votes.length,
      0
    );

    let hasVoted = false;
    const options: PollOptionWithVotes[] = poll.options.map((opt) => {
      const userVoted = opt.votes.some((v) => v.userId === userId);
      if (userVoted) hasVoted = true;

      return {
        id: opt.id,
        text: opt.text,
        position: opt.position,
        voteCount: opt.votes.length,
        percentage:
          totalVotes > 0
            ? Math.round((opt.votes.length / totalVotes) * 100)
            : 0,
        hasVoted: userVoted,
        voters: poll.isAnonymous ? [] : opt.votes.map((v) => v.userId)
      };
    });

    return {
      id: poll.id,
      messageId: poll.messageId,
      channelId: poll.channelId,
      creatorId: poll.creatorId,
      question: poll.question,
      isMultiple: poll.isMultiple,
      isAnonymous: poll.isAnonymous,
      endsAt: poll.endsAt?.toISOString() ?? null,
      createdAt: poll.createdAt.toISOString(),
      totalVotes,
      hasVoted,
      options
    };
  }
}
