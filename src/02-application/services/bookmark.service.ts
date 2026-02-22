/**
 * Bookmark Service
 * Manages saved/bookmarked messages for users
 */

import { prisma } from '../../03-infrastructure/database/client.js';

export interface CreateBookmarkInput {
  userId: string;
  messageId?: string;
  dmMessageId?: string;
  workspaceId?: string;
  note?: string;
}

export interface BookmarkWithMessage {
  id: string;
  userId: string;
  messageId: string | null;
  dmMessageId: string | null;
  workspaceId: string | null;
  note: string | null;
  createdAt: Date;
  message?: {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    createdAt: Date;
    author: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
    channel: {
      id: string;
      name: string;
      workspaceId: string;
    };
  };
  dmMessage?: {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    createdAt: Date;
    author: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  };
}

/**
 * Add a message to user's bookmarks
 */
export async function addBookmark(input: CreateBookmarkInput) {
  const { userId, messageId, dmMessageId, workspaceId, note } = input;

  // Validate: must have either messageId or dmMessageId, not both
  if ((messageId && dmMessageId) || (!messageId && !dmMessageId)) {
    throw new Error('Must provide either messageId or dmMessageId, not both');
  }

  // Check if already bookmarked
  const existing = await prisma.bookmarkedMessage.findFirst({
    where: {
      userId,
      ...(messageId ? { messageId } : { dmMessageId })
    }
  });

  if (existing) {
    throw new Error('Message already bookmarked');
  }

  // Create bookmark
  return prisma.bookmarkedMessage.create({
    data: {
      userId,
      messageId,
      dmMessageId,
      workspaceId,
      note
    }
  });
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(bookmarkId: string, userId: string) {
  // Verify bookmark belongs to user
  const bookmark = await prisma.bookmarkedMessage.findUnique({
    where: { id: bookmarkId }
  });

  if (!bookmark) {
    throw new Error('Bookmark not found');
  }

  if (bookmark.userId !== userId) {
    throw new Error('Unauthorized: Bookmark belongs to another user');
  }

  return prisma.bookmarkedMessage.delete({
    where: { id: bookmarkId }
  });
}

/**
 * Remove bookmark by message ID
 */
export async function removeBookmarkByMessage(
  userId: string,
  messageId?: string,
  dmMessageId?: string
) {
  if ((messageId && dmMessageId) || (!messageId && !dmMessageId)) {
    throw new Error('Must provide either messageId or dmMessageId, not both');
  }

  const bookmark = await prisma.bookmarkedMessage.findFirst({
    where: {
      userId,
      ...(messageId ? { messageId } : { dmMessageId })
    }
  });

  if (!bookmark) {
    throw new Error('Bookmark not found');
  }

  return prisma.bookmarkedMessage.delete({
    where: { id: bookmark.id }
  });
}

/**
 * List user's bookmarks with message details
 */
export async function listBookmarks(
  userId: string,
  workspaceId?: string
): Promise<BookmarkWithMessage[]> {
  const bookmarks = await prisma.bookmarkedMessage.findMany({
    where: {
      userId,
      ...(workspaceId ? { workspaceId } : {})
    },
    include: {
      message: {
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true,
              workspaceId: true
            }
          }
        }
      },
      dmMessage: {
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return bookmarks as BookmarkWithMessage[];
}

/**
 * Check if a message is bookmarked by user
 */
export async function isBookmarked(
  userId: string,
  messageId?: string,
  dmMessageId?: string
): Promise<boolean> {
  if ((messageId && dmMessageId) || (!messageId && !dmMessageId)) {
    throw new Error('Must provide either messageId or dmMessageId, not both');
  }

  const bookmark = await prisma.bookmarkedMessage.findFirst({
    where: {
      userId,
      ...(messageId ? { messageId } : { dmMessageId })
    }
  });

  return !!bookmark;
}

/**
 * Update bookmark note
 */
export async function updateBookmarkNote(
  bookmarkId: string,
  userId: string,
  note: string
) {
  // Verify bookmark belongs to user
  const bookmark = await prisma.bookmarkedMessage.findUnique({
    where: { id: bookmarkId }
  });

  if (!bookmark) {
    throw new Error('Bookmark not found');
  }

  if (bookmark.userId !== userId) {
    throw new Error('Unauthorized: Bookmark belongs to another user');
  }

  return prisma.bookmarkedMessage.update({
    where: { id: bookmarkId },
    data: { note }
  });
}

/**
 * Get bookmark count for user
 */
export async function getBookmarkCount(
  userId: string,
  workspaceId?: string
): Promise<number> {
  return prisma.bookmarkedMessage.count({
    where: {
      userId,
      ...(workspaceId ? { workspaceId } : {})
    }
  });
}
