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
  presence?: UserPresence;
}

export interface UserPresence {
  status: 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'OFFLINE';
  customStatus?: string;
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
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
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
