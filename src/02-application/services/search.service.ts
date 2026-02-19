// Search Service - Global message search
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { PaginationParams, PaginatedResult } from '../../00-core/types.js';
import { ValidationError } from '../../00-core/errors.js';

export interface SearchResult {
  id: string;
  content: string;
  channelId?: string;
  dmChannelId?: string;
  authorId: string;
  createdAt: Date;
  author?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  channel?: {
    id: string;
    name: string;
    workspace: {
      id: string;
      name: string;
    };
  };
  dmChannel?: {
    id: string;
    participants: Array<{
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email: string;
    }>;
  };
}

export class SearchService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  async searchMessages(
    userId: string,
    query: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<SearchResult>> {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    const searchTerm = `%${query.trim()}%`;
    const limit = Math.min(params.limit ?? 50, 100);

    // Search in channels where user is a member
    const channelMessages = await this.prisma.message.findMany({
      where: {
        content: {
          contains: query.trim(),
          mode: 'insensitive'
        },
        channel: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Search in DMs where user is a participant
    const dmMessages = await this.prisma.directMessage.findMany({
      where: {
        content: {
          contains: query.trim(),
          mode: 'insensitive'
        },
        channel: {
          participants: {
            some: { id: userId }
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        channel: {
          select: {
            id: true,
            participants: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Combine and sort results
    const allResults: SearchResult[] = [
      ...channelMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        channelId: msg.channelId,
        authorId: msg.authorId,
        createdAt: msg.createdAt,
        author: msg.author,
        channel: msg.channel
      })),
      ...dmMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        dmChannelId: msg.channelId,
        authorId: msg.authorId,
        createdAt: msg.createdAt,
        author: msg.author,
        dmChannel: {
          id: msg.channel.id,
          participants: msg.channel.participants.map((p) => ({
            id: p.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            email: p.user.email
          }))
        }
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const items = allResults.slice(0, limit);

    return {
      items,
      hasMore: allResults.length > limit,
      nextCursor: undefined
    };
  }
}
