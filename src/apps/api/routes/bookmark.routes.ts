/**
 * Bookmark API Routes
 * Endpoints for managing saved/bookmarked messages
 */

import type { FastifyInstance } from 'fastify';
import {
  addBookmark,
  removeBookmark,
  removeBookmarkByMessage,
  listBookmarks,
  isBookmarked,
  updateBookmarkNote,
  getBookmarkCount
} from '../../../02-application/services/bookmark.service.js';

export default async function bookmarkRoutes(fastify: FastifyInstance) {
  /**
   * Add bookmark
   * POST /api/v1/bookmarks
   */
  fastify.post('/bookmarks', async (request) => {
    await fastify.authenticate(request);
    const { messageId, dmMessageId, workspaceId, note } = request.body as {
      messageId?: string;
      dmMessageId?: string;
      workspaceId?: string;
      note?: string;
    };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const bookmark = await addBookmark({
      userId,
      messageId,
      dmMessageId,
      workspaceId,
      note
    });

    return { success: true, data: bookmark };
  });

  /**
   * Remove bookmark by ID
   * DELETE /api/v1/bookmarks/:id
   */
  fastify.delete('/bookmarks/:id', async (request) => {
    await fastify.authenticate(request);
    const { id } = request.params as { id: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    await removeBookmark(id, userId);

    return { success: true };
  });

  /**
   * Remove bookmark by message ID
   * DELETE /api/v1/bookmarks/message/:messageId
   * DELETE /api/v1/bookmarks/dm/:dmMessageId
   */
  fastify.delete('/bookmarks/message/:messageId', async (request) => {
    await fastify.authenticate(request);
    const { messageId } = request.params as { messageId: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    await removeBookmarkByMessage(userId, messageId);

    return { success: true };
  });

  fastify.delete('/bookmarks/dm/:dmMessageId', async (request) => {
    await fastify.authenticate(request);
    const { dmMessageId } = request.params as { dmMessageId: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    await removeBookmarkByMessage(userId, undefined, dmMessageId);

    return { success: true };
  });

  /**
   * List user's bookmarks
   * GET /api/v1/bookmarks?workspaceId=...
   */
  fastify.get('/bookmarks', async (request) => {
    await fastify.authenticate(request);
    const { workspaceId } = request.query as { workspaceId?: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const bookmarks = await listBookmarks(userId, workspaceId);

    return { success: true, data: bookmarks };
  });

  /**
   * Check if message is bookmarked
   * GET /api/v1/bookmarks/check?messageId=...
   * GET /api/v1/bookmarks/check?dmMessageId=...
   */
  fastify.get('/bookmarks/check', async (request) => {
    await fastify.authenticate(request);
    const { messageId, dmMessageId } = request.query as {
      messageId?: string;
      dmMessageId?: string;
    };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const bookmarked = await isBookmarked(userId, messageId, dmMessageId);

    return { success: true, data: { bookmarked } };
  });

  /**
   * Update bookmark note
   * PATCH /api/v1/bookmarks/:id/note
   */
  fastify.patch('/bookmarks/:id/note', async (request) => {
    await fastify.authenticate(request);
    const { id } = request.params as { id: string };
    const { note } = request.body as { note: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const bookmark = await updateBookmarkNote(id, userId, note);

    return { success: true, data: bookmark };
  });

  /**
   * Get bookmark count
   * GET /api/v1/bookmarks/count?workspaceId=...
   */
  fastify.get('/bookmarks/count', async (request) => {
    await fastify.authenticate(request);
    const { workspaceId } = request.query as { workspaceId?: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const count = await getBookmarkCount(userId, workspaceId);

    return { success: true, data: { count } };
  });
}
