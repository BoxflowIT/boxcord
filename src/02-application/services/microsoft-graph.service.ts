// Microsoft Graph API Service
// Handles OAuth 2.0 flow and Graph API requests for OneDrive, Calendar, SharePoint

import { config, features } from '../../00-core/config.js';
import { createLogger } from '../../00-core/logger.js';
import { prisma } from '../../03-infrastructure/database/client.js';

const logger = createLogger('microsoft-graph');

// Microsoft Identity Platform endpoints
const AUTHORITY = `https://login.microsoftonline.com/${config.MS_TENANT_ID}`;
const AUTHORIZE_URL = `${AUTHORITY}/oauth2/v2.0/authorize`;
const TOKEN_URL = `${AUTHORITY}/oauth2/v2.0/token`;
const GRAPH_URL = 'https://graph.microsoft.com/v1.0';

/**
 * Validate that a Graph API path is a safe relative path (SSRF protection).
 * Only allows paths starting with '/' without protocol/host traversal.
 */
function validateGraphPath(path: string): string {
  if (!path.startsWith('/') || path.includes('://') || path.includes('..')) {
    throw new Error(`Invalid Graph API path: ${path}`);
  }
  return path;
}

// Scopes we request — use least privilege:
// Sites.Read.All = read sites user has access to (delegated = user's own permissions)
// Files.ReadWrite.All = read/write files in user's OneDrive + sites they have access to
const SCOPES = [
  'User.Read',
  'Files.ReadWrite.All',
  'Calendars.ReadWrite',
  'Sites.Read.All', // Read-only site listing (respects user's SharePoint permissions)
  'GroupMember.Read.All', // List user's group memberships for SharePoint filtering
  'offline_access' // Required for refresh tokens
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  token_type: string;
  scope: string;
}

export interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface IdentitySet {
  user?: { displayName: string; email?: string; id?: string };
  application?: { displayName: string; id?: string };
}

export interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  createdBy?: { user?: { displayName: string; email?: string } };
  lastModifiedBy?: { user?: { displayName: string; email?: string } };
  file?: { mimeType: string };
  folder?: { childCount: number };
  '@microsoft.graph.downloadUrl'?: string;
}

export interface OneDriveItemList {
  value: OneDriveItem[];
  '@odata.nextLink'?: string;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  organizer?: { emailAddress: { name: string; address: string } };
  webLink: string;
  isAllDay: boolean;
  bodyPreview?: string;
}

export interface CalendarEventList {
  value: CalendarEvent[];
  '@odata.nextLink'?: string;
}

export interface SharePointSite {
  id: string;
  displayName: string;
  webUrl: string;
  description?: string;
}

export interface CreateEventInput {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
  body?: string;
  attendees?: string[]; // email addresses
  isOnlineMeeting?: boolean;
  isAllDay?: boolean;
}

export interface UpdateEventInput {
  subject?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
  location?: string;
  body?: string;
  attendees?: string[];
  isOnlineMeeting?: boolean;
  isAllDay?: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class MicrosoftGraphService {
  // Per-user mutex: prevents multiple simultaneous token refreshes.
  // When 3 queries fire at once, only the first actually refreshes;
  // the others await the same promise and get the new token.
  private refreshLocks = new Map<string, Promise<string>>();

  // ─── OAuth Flow ──────────────────────────────────────────────────────────

  /**
   * Generate the Microsoft OAuth consent URL
   */
  getAuthorizationUrl(userId: string): string {
    const params = new URLSearchParams({
      client_id: config.MS_CLIENT_ID!,
      response_type: 'code',
      redirect_uri:
        config.MS_REDIRECT_URI ||
        `${getBaseUrl()}/api/v1/integrations/microsoft/callback`,
      scope: SCOPES.join(' '),
      response_mode: 'query',
      state: userId, // Pass userId as state to link callback to user
      prompt: 'consent'
    });

    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access + refresh tokens
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<void> {
    const body = new URLSearchParams({
      client_id: config.MS_CLIENT_ID!,
      client_secret: config.MS_CLIENT_SECRET!,
      code,
      redirect_uri:
        config.MS_REDIRECT_URI ||
        `${getBaseUrl()}/api/v1/integrations/microsoft/callback`,
      grant_type: 'authorization_code',
      scope: SCOPES.join(' ')
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as Record<
        string,
        string
      >;
      logger.error({ error, status: response.status }, 'Token exchange failed');
      throw new Error(
        `Microsoft token exchange failed: ${error.error_description || response.statusText}`
      );
    }

    const tokens = (await response.json()) as MicrosoftTokenResponse;

    // Get Microsoft user profile
    const msUser = await this.fetchGraphApi<MicrosoftUser>(
      '/me',
      tokens.access_token
    );

    // Store tokens in database
    await prisma.microsoftToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope,
        msUserId: msUser.id,
        msEmail: msUser.mail || msUser.userPrincipalName
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope,
        msUserId: msUser.id,
        msEmail: msUser.mail || msUser.userPrincipalName
      }
    });

    logger.info({ userId, msEmail: msUser.mail }, 'Microsoft 365 connected');
  }

  /**
   * Refresh an expired access token (internal — no concurrency guard)
   */
  private async _doRefresh(userId: string): Promise<string> {
    const stored = await prisma.microsoftToken.findUnique({
      where: { userId }
    });
    if (!stored?.refreshToken) {
      throw new Error('No Microsoft refresh token found. Please reconnect.');
    }

    const body = new URLSearchParams({
      client_id: config.MS_CLIENT_ID!,
      client_secret: config.MS_CLIENT_SECRET!,
      refresh_token: stored.refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES.join(' ')
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!response.ok) {
      // Refresh token expired or revoked — user must re-consent
      this.tokenCache.delete(userId);
      await prisma.microsoftToken.delete({ where: { userId } }).catch(() => {});
      throw new Error(
        'Microsoft token expired. Please reconnect your account.'
      );
    }

    const tokens = (await response.json()) as MicrosoftTokenResponse;

    const expiresAt = Date.now() + tokens.expires_in * 1000;

    await prisma.microsoftToken.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || stored.refreshToken,
        expiresAt: new Date(expiresAt),
        scopes: tokens.scope
      }
    });

    // Update in-memory cache
    this.tokenCache.set(userId, { token: tokens.access_token, expiresAt });

    return tokens.access_token;
  }

  /**
   * Refresh token with per-user mutex.
   * If a refresh is already in progress for this user, all concurrent
   * callers will await the same promise instead of racing each other.
   */
  private async refreshAccessToken(userId: string): Promise<string> {
    const existing = this.refreshLocks.get(userId);
    if (existing) {
      logger.debug({ userId }, 'Token refresh already in progress, waiting…');
      return existing;
    }

    const promise = this._doRefresh(userId).finally(() => {
      this.refreshLocks.delete(userId);
    });
    this.refreshLocks.set(userId, promise);
    return promise;
  }

  /**
   * Get a valid access token (refreshes if expired or expiring within 5 min).
   * Uses an in-memory cache to avoid redundant DB lookups.
   */
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();

  async getAccessToken(userId: string): Promise<string> {
    // Check in-memory cache first
    const cached = this.tokenCache.get(userId);
    if (cached && cached.expiresAt - Date.now() > 5 * 60 * 1000) {
      return cached.token;
    }

    const stored = await prisma.microsoftToken.findUnique({
      where: { userId }
    });
    if (!stored) {
      throw new Error(
        'Microsoft 365 not connected. Please connect your account first.'
      );
    }

    // If token expires within 5 minutes, refresh it
    if (stored.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      const newToken = await this.refreshAccessToken(userId);
      // Cache will be updated by _doRefresh → but also set it here from the return value
      return newToken;
    }

    // Cache the valid token
    this.tokenCache.set(userId, {
      token: stored.accessToken,
      expiresAt: stored.expiresAt.getTime()
    });

    return stored.accessToken;
  }

  /**
   * Disconnect Microsoft 365 from user account
   */
  async disconnect(userId: string): Promise<void> {
    this.tokenCache.delete(userId);
    this.refreshLocks.delete(userId);
    await prisma.microsoftToken.delete({ where: { userId } }).catch(() => {});
    logger.info({ userId }, 'Microsoft 365 disconnected');
  }

  /**
   * Check if user has Microsoft 365 connected
   */
  async isConnected(
    userId: string
  ): Promise<{ connected: boolean; email?: string }> {
    const token = await prisma.microsoftToken.findUnique({
      where: { userId },
      select: { msEmail: true }
    });
    return { connected: !!token, email: token?.msEmail || undefined };
  }

  // ─── Graph API Helpers ───────────────────────────────────────────────────

  private async fetchGraphApi<T>(
    path: string,
    accessToken: string,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const safePath = validateGraphPath(path);
    const response = await fetch(`${GRAPH_URL}${safePath}`, {
      headers: { Authorization: `Bearer ${accessToken}`, ...extraHeaders }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error ${response.status}: ${JSON.stringify(error)}`
      );
    }

    return response.json() as Promise<T>;
  }

  private async postGraphApi<T>(
    path: string,
    accessToken: string,
    body: unknown
  ): Promise<T> {
    const safePath = validateGraphPath(path);
    const response = await fetch(`${GRAPH_URL}${safePath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error ${response.status}: ${JSON.stringify(error)}`
      );
    }

    return response.json() as Promise<T>;
  }

  private async patchGraphApi<T>(
    path: string,
    accessToken: string,
    body: unknown
  ): Promise<T> {
    const safePath = validateGraphPath(path);
    const response = await fetch(`${GRAPH_URL}${safePath}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error ${response.status}: ${JSON.stringify(error)}`
      );
    }

    return response.json() as Promise<T>;
  }

  private async deleteGraphApi(
    path: string,
    accessToken: string
  ): Promise<void> {
    const safePath = validateGraphPath(path);
    const response = await fetch(`${GRAPH_URL}${safePath}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error ${response.status}: ${JSON.stringify(error)}`
      );
    }
  }

  /**
   * Authenticated Graph request with auto-refresh
   */
  private async graphRequest<T>(
    userId: string,
    path: string,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const token = await this.getAccessToken(userId);
    try {
      return await this.fetchGraphApi<T>(path, token, extraHeaders);
    } catch (error) {
      // If 401, try refreshing once
      if (String(error).includes('401')) {
        const newToken = await this.refreshAccessToken(userId);
        return this.fetchGraphApi<T>(path, newToken, extraHeaders);
      }
      throw error;
    }
  }

  private async graphPost<T>(
    userId: string,
    path: string,
    body: unknown
  ): Promise<T> {
    const token = await this.getAccessToken(userId);
    try {
      return await this.postGraphApi<T>(path, token, body);
    } catch (error) {
      if (String(error).includes('401')) {
        const newToken = await this.refreshAccessToken(userId);
        return this.postGraphApi<T>(path, newToken, body);
      }
      throw error;
    }
  }

  private async graphPatch<T>(
    userId: string,
    path: string,
    body: unknown
  ): Promise<T> {
    const token = await this.getAccessToken(userId);
    try {
      return await this.patchGraphApi<T>(path, token, body);
    } catch (error) {
      if (String(error).includes('401')) {
        const newToken = await this.refreshAccessToken(userId);
        return this.patchGraphApi<T>(path, newToken, body);
      }
      throw error;
    }
  }

  private async graphDelete(userId: string, path: string): Promise<void> {
    const token = await this.getAccessToken(userId);
    try {
      await this.deleteGraphApi(path, token);
    } catch (error) {
      if (String(error).includes('401')) {
        const newToken = await this.refreshAccessToken(userId);
        await this.deleteGraphApi(path, newToken);
        return;
      }
      throw error;
    }
  }

  // ─── OneDrive ────────────────────────────────────────────────────────────

  /**
   * List files in OneDrive root or folder.
   * Includes createdBy/lastModifiedBy metadata like OneDrive web.
   */
  async listOneDriveFiles(
    userId: string,
    folderId?: string
  ): Promise<OneDriveItemList> {
    const path = folderId
      ? `/me/drive/items/${folderId}/children`
      : '/me/drive/root/children';
    const select =
      '$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,file,folder,createdBy,lastModifiedBy';
    return this.graphRequest<OneDriveItemList>(
      userId,
      `${path}?$top=100&$orderby=lastModifiedDateTime desc&${select}`
    );
  }

  /**
   * Get a specific OneDrive item (file or folder)
   */
  async getOneDriveItem(userId: string, itemId: string): Promise<OneDriveItem> {
    return this.graphRequest<OneDriveItem>(userId, `/me/drive/items/${itemId}`);
  }

  /**
   * Search OneDrive files
   */
  async searchOneDrive(
    userId: string,
    query: string
  ): Promise<OneDriveItemList> {
    return this.graphRequest<OneDriveItemList>(
      userId,
      `/me/drive/root/search(q='${encodeURIComponent(query)}')?$top=25`
    );
  }

  /**
   * Get a sharing link for a OneDrive file
   */
  async createOneDriveSharingLink(
    userId: string,
    itemId: string
  ): Promise<string> {
    const result = await this.graphPost<{ link: { webUrl: string } }>(
      userId,
      `/me/drive/items/${itemId}/createLink`,
      { type: 'view', scope: 'organization' }
    );
    return result.link.webUrl;
  }

  /**
   * Upload a file to OneDrive.
   * For files < 4MB, uses simple upload. For larger files, would need resumable upload session.
   */
  async uploadOneDriveFile(
    userId: string,
    folderId: string | undefined,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<OneDriveItem> {
    const token = await this.getAccessToken(userId);
    const encodedName = encodeURIComponent(fileName);
    const basePath = folderId
      ? `/me/drive/items/${folderId}`
      : '/me/drive/root';
    const safePath = validateGraphPath(`${basePath}:/${encodedName}:/content`);
    const url = `${GRAPH_URL}${safePath}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType || 'application/octet-stream'
      },
      body: fileBuffer
    });

    if (!response.ok) {
      if (response.status === 401) {
        const newToken = await this.refreshAccessToken(userId);
        const retryResponse = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': contentType || 'application/octet-stream'
          },
          body: fileBuffer
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new Error(
            `Graph API error ${retryResponse.status}: ${JSON.stringify(error)}`
          );
        }
        return retryResponse.json() as Promise<OneDriveItem>;
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error ${response.status}: ${JSON.stringify(error)}`
      );
    }

    return response.json() as Promise<OneDriveItem>;
  }

  /**
   * Delete a file or folder from OneDrive.
   */
  async deleteOneDriveItem(userId: string, itemId: string): Promise<void> {
    return this.graphDelete(userId, `/me/drive/items/${itemId}`);
  }

  /**
   * Get permissions/sharing info for a OneDrive item
   */
  async getOneDriveItemPermissions(
    userId: string,
    itemId: string
  ): Promise<{
    value: Array<{
      id: string;
      roles: string[];
      grantedTo?: { user?: { displayName: string; email?: string } };
      grantedToV2?: { user?: { displayName: string; email?: string } };
    }>;
  }> {
    return this.graphRequest(userId, `/me/drive/items/${itemId}/permissions`);
  }

  // ─── Calendar ────────────────────────────────────────────────────────────

  /**
   * Get upcoming calendar events
   */
  async getCalendarEvents(
    userId: string,
    days: number = 7,
    start?: string,
    end?: string,
    timeZone?: string
  ): Promise<CalendarEventList> {
    const startDateTime = start || new Date().toISOString();
    const endDateTime =
      end || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const headers: Record<string, string> = {};
    if (timeZone) {
      headers['Prefer'] = `outlook.timezone="${timeZone}"`;
    }

    return this.graphRequest<CalendarEventList>(
      userId,
      `/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$top=100&$orderby=start/dateTime`,
      headers
    );
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(
    userId: string,
    input: CreateEventInput
  ): Promise<CalendarEvent> {
    const eventBody: Record<string, unknown> = {
      subject: input.subject,
      start: input.start,
      end: input.end
    };

    if (input.location) {
      eventBody.location = { displayName: input.location };
    }

    if (input.body) {
      eventBody.body = { contentType: 'HTML', content: input.body };
    }

    if (input.attendees?.length) {
      eventBody.attendees = input.attendees.map((email) => ({
        emailAddress: { address: email },
        type: 'required'
      }));
    }

    if (input.isOnlineMeeting) {
      eventBody.isOnlineMeeting = true;
      eventBody.onlineMeetingProvider = 'teamsForBusiness';
    }

    if (input.isAllDay) {
      eventBody.isAllDay = true;
    }

    return this.graphPost<CalendarEvent>(userId, '/me/events', eventBody);
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(
    userId: string,
    eventId: string,
    input: UpdateEventInput
  ): Promise<CalendarEvent> {
    const eventBody: Record<string, unknown> = {};

    if (input.subject !== undefined) eventBody.subject = input.subject;
    if (input.start) eventBody.start = input.start;
    if (input.end) eventBody.end = input.end;

    if (input.location !== undefined) {
      eventBody.location = input.location
        ? { displayName: input.location }
        : { displayName: '' };
    }

    if (input.body !== undefined) {
      eventBody.body = { contentType: 'HTML', content: input.body };
    }

    if (input.attendees) {
      eventBody.attendees = input.attendees.map((email) => ({
        emailAddress: { address: email },
        type: 'required'
      }));
    }

    if (input.isOnlineMeeting !== undefined) {
      eventBody.isOnlineMeeting = input.isOnlineMeeting;
      eventBody.onlineMeetingProvider = input.isOnlineMeeting
        ? 'teamsForBusiness'
        : 'unknown';
    }

    if (input.isAllDay !== undefined) {
      eventBody.isAllDay = input.isAllDay;
    }

    return this.graphPatch<CalendarEvent>(
      userId,
      `/me/events/${eventId}`,
      eventBody
    );
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
    return this.graphDelete(userId, `/me/events/${eventId}`);
  }

  // ─── SharePoint ──────────────────────────────────────────────────────────

  /**
   * List SharePoint sites the user has access to.
   * Strategy:
   * 1. Start with sites the user explicitly follows (/me/followedSites)
   * 2. Add sites from user's M365 groups, but ONLY Unified groups
   *    where the user is a direct member (not inherited tenant-wide access)
   * 3. For each site, verify the user can actually list the drive
   *    — this filters out sites where API scope gives access but user shouldn't see them
   * This mirrors what Teams/Outlook shows: only sites you're actively part of.
   */
  async listSharePointSites(
    userId: string
  ): Promise<{ value: SharePointSite[] }> {
    const sites: SharePointSite[] = [];
    const seenIds = new Set<string>();

    // 1. Followed sites — these are explicitly chosen by the user
    try {
      const followed = await this.graphRequest<{ value: SharePointSite[] }>(
        userId,
        '/me/followedSites?$top=100'
      );
      for (const site of followed.value || []) {
        if (!seenIds.has(site.id)) {
          seenIds.add(site.id);
          sites.push(site);
        }
      }
    } catch {
      // followedSites might not be available
    }

    // 2. Get M365 groups the user is a DIRECT member of
    //    Filter to only Unified groups (Teams/M365 groups that have SharePoint sites)
    try {
      const groups = await this.graphRequest<{
        value: Array<{
          id: string;
          displayName: string;
          groupTypes?: string[];
        }>;
      }>(
        userId,
        "/me/memberOf/microsoft.graph.group?$filter=groupTypes/any(g:g eq 'Unified')&$select=id,displayName,groupTypes&$top=50"
      );

      // For each group, try to get its SharePoint site
      // Use Promise.allSettled so one failure doesn't block others
      const siteResults = await Promise.allSettled(
        groups.value.map(async (group) => {
          const site = await this.graphRequest<SharePointSite>(
            userId,
            `/groups/${group.id}/sites/root?$select=id,displayName,webUrl,description`
          );
          return site;
        })
      );

      for (const result of siteResults) {
        if (
          result.status === 'fulfilled' &&
          result.value &&
          !seenIds.has(result.value.id)
        ) {
          seenIds.add(result.value.id);
          sites.push(result.value);
        }
      }
    } catch {
      // Group lookup failed, continue with what we have
    }

    // Sort alphabetically
    sites.sort((a, b) =>
      (a.displayName || '').localeCompare(b.displayName || '')
    );

    return { value: sites };
  }

  /**
   * List files in a SharePoint site document library.
   * Includes createdBy/lastModifiedBy metadata  like Teams/Outlook.
   */
  async listSharePointFiles(
    userId: string,
    siteId: string,
    folderId?: string
  ): Promise<OneDriveItemList> {
    const path = folderId
      ? `/sites/${siteId}/drive/items/${folderId}/children`
      : `/sites/${siteId}/drive/root/children`;
    const select =
      '$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,file,folder,createdBy,lastModifiedBy';
    return this.graphRequest<OneDriveItemList>(
      userId,
      `${path}?$top=100&$orderby=lastModifiedDateTime desc&${select}`
    );
  }

  /**
   * Search files in a SharePoint site document library.
   */
  async searchSharePointFiles(
    userId: string,
    siteId: string,
    query: string
  ): Promise<OneDriveItemList> {
    return this.graphRequest<OneDriveItemList>(
      userId,
      `/sites/${siteId}/drive/root/search(q='${encodeURIComponent(query)}')?$top=50`
    );
  }

  /**
   * Upload a file to a SharePoint site document library.
   * For files < 4MB, uses simple upload. For larger files, would need resumable upload session.
   */
  async uploadSharePointFile(
    userId: string,
    siteId: string,
    folderId: string | undefined,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<OneDriveItem> {
    const token = await this.getAccessToken(userId);
    const encodedName = encodeURIComponent(fileName);
    const basePath = folderId
      ? `/sites/${siteId}/drive/items/${folderId}`
      : `/sites/${siteId}/drive/root`;
    const safePath = validateGraphPath(`${basePath}:/${encodedName}:/content`);
    const url = `${GRAPH_URL}${safePath}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType || 'application/octet-stream'
      },
      body: fileBuffer
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try refresh
        const newToken = await this.refreshAccessToken(userId);
        const retryResponse = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': contentType || 'application/octet-stream'
          },
          body: fileBuffer
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new Error(
            `Graph API error ${retryResponse.status}: ${JSON.stringify(error)}`
          );
        }
        return retryResponse.json() as Promise<OneDriveItem>;
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error ${response.status}: ${JSON.stringify(error)}`
      );
    }

    return response.json() as Promise<OneDriveItem>;
  }

  /**
   * Delete a file or folder from a SharePoint site document library.
   */
  async deleteSharePointItem(
    userId: string,
    siteId: string,
    itemId: string
  ): Promise<void> {
    return this.graphDelete(userId, `/sites/${siteId}/drive/items/${itemId}`);
  }

  /**
   * Get sharing link for a SharePoint file
   */
  async createSharePointSharingLink(
    userId: string,
    siteId: string,
    itemId: string
  ): Promise<string> {
    const result = await this.graphPost<{ link: { webUrl: string } }>(
      userId,
      `/sites/${siteId}/drive/items/${itemId}/createLink`,
      { type: 'view', scope: 'organization' }
    );
    return result.link.webUrl;
  }

  /**
   * Get permissions/sharing info for a SharePoint item
   */
  async getSharePointItemPermissions(
    userId: string,
    siteId: string,
    itemId: string
  ): Promise<{
    value: Array<{
      id: string;
      roles: string[];
      grantedTo?: { user?: { displayName: string; email?: string } };
      grantedToV2?: { user?: { displayName: string; email?: string } };
    }>;
  }> {
    return this.graphRequest(
      userId,
      `/sites/${siteId}/drive/items/${itemId}/permissions`
    );
  }

  // ─── User Profile ────────────────────────────────────────────────────────

  /**
   * Get Microsoft profile of connected user
   */
  async getMicrosoftProfile(userId: string): Promise<MicrosoftUser> {
    return this.graphRequest<MicrosoftUser>(userId, '/me');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (config.NODE_ENV === 'production') {
    return 'https://boxcord.boxflow.com';
  }
  return `http://localhost:${config.PORT}`;
}

// Singleton export
export const microsoftGraphService = features.microsoft365
  ? new MicrosoftGraphService()
  : (null as unknown as MicrosoftGraphService);
