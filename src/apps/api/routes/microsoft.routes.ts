// Microsoft 365 Integration Routes
// OAuth flow + OneDrive, Calendar, SharePoint endpoints
import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { z } from 'zod';
import { microsoftGraphService } from '../../../02-application/services/microsoft-graph.service.js';
import { config, features } from '../../../00-core/config.js';

// Client URL for OAuth redirects (different in dev vs prod)
function clientUrl(path: string): string {
  if (config.NODE_ENV === 'production') {
    return path; // Same origin in production
  }
  return `http://localhost:5173${path}`;
}

// Validation schemas
const folderQuery = z.object({
  folderId: z.string().optional()
});

const searchQuery = z.object({
  q: z.string().min(1).max(200)
});

const shareBody = z.object({
  itemId: z.string().min(1)
});

const sharePointShareBody = z.object({
  siteId: z.string().min(1),
  itemId: z.string().min(1)
});

const calendarQuery = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  timeZone: z.string().optional()
});

const createEventBody = z.object({
  subject: z.string().min(1).max(500),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string()
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string()
  }),
  location: z.string().max(500).optional(),
  body: z.string().max(5000).optional(),
  attendees: z.array(z.string().email()).max(50).optional(),
  isOnlineMeeting: z.boolean().optional(),
  isAllDay: z.boolean().optional()
});

const updateEventBody = z.object({
  subject: z.string().min(1).max(500).optional(),
  start: z
    .object({
      dateTime: z.string(),
      timeZone: z.string()
    })
    .optional(),
  end: z
    .object({
      dateTime: z.string(),
      timeZone: z.string()
    })
    .optional(),
  location: z.string().max(500).optional(),
  body: z.string().max(5000).optional(),
  attendees: z.array(z.string().email()).max(50).optional(),
  isOnlineMeeting: z.boolean().optional(),
  isAllDay: z.boolean().optional()
});

export async function microsoftRoutes(app: FastifyInstance) {
  // ─── OAuth Callback (NO auth — browser redirect from Microsoft) ────────

  app.get<{
    Querystring: {
      code?: string;
      error?: string;
      error_description?: string;
      state?: string;
    };
  }>(
    '/callback',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      if (!features.microsoft365 || !microsoftGraphService) {
        return reply.redirect(clientUrl('/?microsoft_error=feature_disabled'));
      }

      const { code, error, error_description, state } = request.query;

      if (error) {
        app.log.error({ error, error_description }, 'Microsoft OAuth error');
        return reply.redirect(
          clientUrl(
            `/?microsoft_error=${encodeURIComponent(error_description || error)}`
          )
        );
      }

      if (!code || !state) {
        return reply.redirect(clientUrl('/?microsoft_error=missing_code'));
      }

      try {
        // state contains userId from getAuthorizationUrl
        await microsoftGraphService.exchangeCodeForTokens(code, state);
        return reply.redirect(clientUrl('/?microsoft_connected=true'));
      } catch (err) {
        app.log.error(err, 'Microsoft token exchange failed');
        return reply.redirect(
          clientUrl('/?microsoft_error=token_exchange_failed')
        );
      }
    }
  );

  // ─── All other routes require authentication ──────────────────────────
  // Wrapped in sub-plugin so the auth hook doesn't affect /callback above

  await app.register(async (authenticated) => {
    authenticated.addHook('onRequest', async (request) => {
      await app.authenticate(request);
    });

    // ─── Status (always available, even when feature disabled) ───────────

    authenticated.get(
      '/status',
      { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
      async (request) => {
        if (!features.microsoft365 || !microsoftGraphService) {
          return { success: true, data: { enabled: false, connected: false } };
        }
        const status = await microsoftGraphService.isConnected(request.user.id);
        return { success: true, data: { enabled: true, ...status } };
      }
    );

    // ─── Feature-gated routes ────────────────────────────────────────────

    await authenticated.register(async (gated) => {
      gated.addHook('onRequest', async (_request, reply) => {
        if (!features.microsoft365 || !microsoftGraphService) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'FEATURE_DISABLED',
              message: 'Microsoft 365 integration is not enabled'
            }
          });
        }
      });

      // Global error handler for all Graph API errors in this sub-plugin
      gated.setErrorHandler(async (error: Error, request, reply) => {
        // Let Boxcord auth errors (UnauthorizedError from jwt.ts) pass through
        // to the parent error handler — these are NOT Microsoft Graph errors.
        if (
          'code' in error &&
          (error as { code: string }).code === 'UNAUTHORIZED'
        ) {
          reply.status(401);
          return {
            success: false,
            error: { code: 'UNAUTHORIZED', message: error.message }
          };
        }

        const msg = error.message || String(error);
        request.log.error({ err: error }, `Microsoft Graph API error: ${msg}`);

        // Microsoft token-related errors → tell client to reconnect
        // Use 403 (not 401) to avoid triggering the client's global session-logout handler
        const isMsAuthError =
          msg.includes('reconnect') ||
          msg.includes('token expired') ||
          msg.includes('refresh token') ||
          msg.includes('not connected') ||
          msg.includes('connect your account') ||
          msg.includes('Graph API error 401');

        if (isMsAuthError) {
          reply.status(403);
          return {
            success: false,
            error: {
              code: 'MS_AUTH_EXPIRED',
              message: 'Microsoft-sessionen har gått ut. Anslut igen.'
            }
          };
        }

        reply.status(502);
        return {
          success: false,
          error: { code: 'MS_GRAPH_ERROR', message: msg }
        };
      });

      // Get Microsoft OAuth consent URL
      gated.get(
        '/connect',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          const url = microsoftGraphService!.getAuthorizationUrl(
            request.user.id
          );
          return { success: true, data: { url } };
        }
      );

      // Disconnect Microsoft 365
      gated.post(
        '/disconnect',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          await microsoftGraphService!.disconnect(request.user.id);
          return { success: true };
        }
      );

      // Get Microsoft profile
      gated.get(
        '/profile',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const profile = await microsoftGraphService!.getMicrosoftProfile(
            request.user.id
          );
          return { success: true, data: profile };
        }
      );

      // ─── OneDrive ────────────────────────────────────────────────────────

      gated.get<{ Querystring: { folderId?: string } }>(
        '/onedrive/files',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const { folderId } = folderQuery.parse(request.query);
          const files = await microsoftGraphService!.listOneDriveFiles(
            request.user.id,
            folderId
          );
          return { success: true, data: files };
        }
      );

      gated.get<{ Querystring: { q: string } }>(
        '/onedrive/search',
        { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
        async (request) => {
          const { q } = searchQuery.parse(request.query);
          const files = await microsoftGraphService!.searchOneDrive(
            request.user.id,
            q
          );
          return { success: true, data: files };
        }
      );

      gated.get<{ Params: { itemId: string } }>(
        '/onedrive/items/:itemId',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const item = await microsoftGraphService!.getOneDriveItem(
            request.user.id,
            request.params.itemId
          );
          return { success: true, data: item };
        }
      );

      gated.post(
        '/onedrive/share',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          const { itemId } = shareBody.parse(request.body);
          const url = await microsoftGraphService!.createOneDriveSharingLink(
            request.user.id,
            itemId
          );
          return { success: true, data: { url } };
        }
      );

      // Get permissions for a OneDrive item
      gated.get<{ Params: { itemId: string } }>(
        '/onedrive/items/:itemId/permissions',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const perms = await microsoftGraphService!.getOneDriveItemPermissions(
            request.user.id,
            request.params.itemId
          );
          return { success: true, data: perms };
        }
      );

      // Upload file to OneDrive
      await gated.register(async (oneDriveUploadPlugin) => {
        await oneDriveUploadPlugin.register(multipart, {
          limits: { fileSize: 25 * 1024 * 1024, files: 1 }
        });

        oneDriveUploadPlugin.post<{ Querystring: { folderId?: string } }>(
          '/onedrive/upload',
          { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
          async (request) => {
            const file = await request.file();
            if (!file) {
              throw new Error('No file uploaded');
            }
            const buffer = await file.toBuffer();
            const { folderId } = folderQuery.parse(request.query);
            const result = await microsoftGraphService!.uploadOneDriveFile(
              request.user.id,
              folderId,
              file.filename,
              buffer,
              file.mimetype
            );
            return { success: true, data: result };
          }
        );
      });

      // Delete OneDrive item
      gated.delete<{ Params: { itemId: string } }>(
        '/onedrive/items/:itemId',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          await microsoftGraphService!.deleteOneDriveItem(
            request.user.id,
            request.params.itemId
          );
          return { success: true };
        }
      );

      // ─── Calendar ────────────────────────────────────────────────────────

      gated.get<{
        Querystring: {
          days?: string;
          startDateTime?: string;
          endDateTime?: string;
          timeZone?: string;
        };
      }>(
        '/calendar/events',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const { days, startDateTime, endDateTime, timeZone } =
            calendarQuery.parse(request.query);
          const events = await microsoftGraphService!.getCalendarEvents(
            request.user.id,
            days,
            startDateTime,
            endDateTime,
            timeZone
          );
          return { success: true, data: events };
        }
      );

      gated.post(
        '/calendar/events',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          const input = createEventBody.parse(request.body);
          const event = await microsoftGraphService!.createCalendarEvent(
            request.user.id,
            input
          );
          return { success: true, data: event };
        }
      );

      gated.patch<{ Params: { eventId: string } }>(
        '/calendar/events/:eventId',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          const input = updateEventBody.parse(request.body);
          const event = await microsoftGraphService!.updateCalendarEvent(
            request.user.id,
            request.params.eventId,
            input
          );
          return { success: true, data: event };
        }
      );

      gated.delete<{ Params: { eventId: string } }>(
        '/calendar/events/:eventId',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          await microsoftGraphService!.deleteCalendarEvent(
            request.user.id,
            request.params.eventId
          );
          return { success: true };
        }
      );

      // ─── SharePoint ──────────────────────────────────────────────────────

      gated.get(
        '/sharepoint/sites',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const sites = await microsoftGraphService!.listSharePointSites(
            request.user.id
          );
          return { success: true, data: sites };
        }
      );

      gated.get<{
        Params: { siteId: string };
        Querystring: { folderId?: string };
      }>(
        '/sharepoint/sites/:siteId/files',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const { folderId } = folderQuery.parse(request.query);
          const files = await microsoftGraphService!.listSharePointFiles(
            request.user.id,
            request.params.siteId,
            folderId
          );
          return { success: true, data: files };
        }
      );

      gated.get<{ Params: { siteId: string }; Querystring: { q: string } }>(
        '/sharepoint/sites/:siteId/search',
        { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
        async (request) => {
          const { q } = searchQuery.parse(request.query);
          const files = await microsoftGraphService!.searchSharePointFiles(
            request.user.id,
            request.params.siteId,
            q
          );
          return { success: true, data: files };
        }
      );

      gated.post(
        '/sharepoint/share',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          const { siteId, itemId } = sharePointShareBody.parse(request.body);
          const url = await microsoftGraphService!.createSharePointSharingLink(
            request.user.id,
            siteId,
            itemId
          );
          return { success: true, data: { url } };
        }
      );

      // Get permissions/people for a SharePoint item
      gated.get<{ Params: { siteId: string; itemId: string } }>(
        '/sharepoint/sites/:siteId/items/:itemId/permissions',
        { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
        async (request) => {
          const perms =
            await microsoftGraphService!.getSharePointItemPermissions(
              request.user.id,
              request.params.siteId,
              request.params.itemId
            );
          return { success: true, data: perms };
        }
      );

      // Upload file to SharePoint
      await gated.register(async (uploadPlugin) => {
        await uploadPlugin.register(multipart, {
          limits: { fileSize: 25 * 1024 * 1024, files: 1 }
        });

        uploadPlugin.post<{
          Params: { siteId: string };
          Querystring: { folderId?: string };
        }>(
          '/sharepoint/sites/:siteId/upload',
          { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
          async (request) => {
            const file = await request.file();
            if (!file) {
              throw new Error('No file uploaded');
            }
            const buffer = await file.toBuffer();
            const { folderId } = folderQuery.parse(request.query);
            const result = await microsoftGraphService!.uploadSharePointFile(
              request.user.id,
              request.params.siteId,
              folderId,
              file.filename,
              buffer,
              file.mimetype
            );
            return { success: true, data: result };
          }
        );
      });

      // Delete SharePoint item
      gated.delete<{ Params: { siteId: string; itemId: string } }>(
        '/sharepoint/sites/:siteId/items/:itemId',
        { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
        async (request) => {
          await microsoftGraphService!.deleteSharePointItem(
            request.user.id,
            request.params.siteId,
            request.params.itemId
          );
          return { success: true };
        }
      );
    }); // end gated sub-plugin
  }); // end authenticated sub-plugin
}
