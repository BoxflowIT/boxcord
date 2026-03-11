// ============================================================================
// CENTRALIZED TYPE DEFINITIONS
// Single source of truth for all app types
// ============================================================================

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  status?: string;
  statusEmoji?: string;
  dndMode?: boolean;
  dndUntil?: string;
  presence?: UserPresence;
}

export interface UserPresence {
  status: 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'OFFLINE';
  customStatus?: string;
  statusEmoji?: string;
  lastSeen: string;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  edited: boolean;
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  webhookId?: string | null;
  webhook?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export interface PaginatedMessages {
  items: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================================
// CHANNEL TYPES
// ============================================================================

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: 'TEXT' | 'ANNOUNCEMENT' | 'THREAD' | 'VOICE';
  isPrivate: boolean;
  createdAt?: string;
  updatedAt?: string;
  unreadCount?: number; // Number of unread messages
}

export interface DMChannel {
  id: string;
  createdAt: string;
  participants: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    };
  }>;
  lastMessage?: Message | null;
  unreadCount?: number;
}

// ============================================================================
// WORKSPACE TYPES
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  code: string;
  createdBy: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface InvitePreview {
  code: string;
  workspace: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
  };
}

// ============================================================================
// REACTION TYPES
// ============================================================================

export interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

// ============================================================================
// POLL TYPES
// ============================================================================

export interface Poll {
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
  hasVoted: boolean;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  position: number;
  voteCount: number;
  percentage: number;
  hasVoted: boolean;
  voters: string[];
}

// ============================================================================
// MICROSOFT 365 TYPES
// ============================================================================

export interface MicrosoftConnectionStatus {
  enabled: boolean;
  connected: boolean;
  email?: string;
}

export interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
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

export interface SharePointPermission {
  id: string;
  roles: string[];
  grantedTo?: { user?: { displayName: string; email?: string } };
  grantedToV2?: { user?: { displayName: string; email?: string } };
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
  isOnlineMeeting?: boolean;
  onlineMeeting?: { joinUrl: string };
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
  attendees?: string[];
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
