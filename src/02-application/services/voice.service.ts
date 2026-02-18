// Voice Channel Service
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import { NotFoundError, ValidationError } from '../../00-core/errors.js';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceSessionInfo {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: Date;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

export interface ActiveVoiceUser {
  userId: string;
  sessionId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}

interface VoiceSessionRecord {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: Date;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const toSessionInfo = (session: VoiceSessionRecord): VoiceSessionInfo => ({
  id: session.id,
  channelId: session.channelId,
  userId: session.userId,
  joinedAt: session.joinedAt,
  isMuted: session.isMuted,
  isDeafened: session.isDeafened,
  isSpeaking: session.isSpeaking
});

// ============================================================================
// SERVICE
// ============================================================================

export class VoiceService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  /**
   * Join a voice channel
   */
  async joinChannel(
    channelId: string,
    userId: string
  ): Promise<VoiceSessionInfo> {
    // Verify channel exists and is a voice channel
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, type: true }
    });

    if (!channel) {
      throw new NotFoundError('Channel', channelId);
    }

    if (channel.type !== 'VOICE') {
      throw new ValidationError('Channel is not a voice channel');
    }

    // Check if user already has an active session in this channel
    const existingSession = await this.prisma.voiceSession.findFirst({
      where: { channelId, userId, leftAt: null }
    });

    if (existingSession) {
      return toSessionInfo(existingSession);
    }

    // Leave any other active voice sessions
    await this.prisma.voiceSession.updateMany({
      where: { userId, leftAt: null },
      data: { leftAt: new Date() }
    });

    // Create new session
    const session = await this.prisma.voiceSession.create({
      data: { channelId, userId }
    });

    return toSessionInfo(session);
  }

  /**
   * Leave a voice channel
   */
  async leaveChannel(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.voiceSession.findFirst({
      where: { id: sessionId, userId, leftAt: null }
    });

    if (!session) {
      throw new NotFoundError('Voice session', sessionId);
    }

    await this.prisma.voiceSession.update({
      where: { id: sessionId },
      data: { leftAt: new Date() }
    });
  }

  /**
   * Update voice state (mute/deafen/speaking)
   */
  async updateVoiceState(
    sessionId: string,
    userId: string,
    state: {
      isMuted?: boolean;
      isDeafened?: boolean;
      isSpeaking?: boolean;
    }
  ): Promise<VoiceSessionInfo> {
    const session = await this.prisma.voiceSession.findFirst({
      where: { id: sessionId, userId, leftAt: null }
    });

    if (!session) {
      throw new NotFoundError('Voice session', sessionId);
    }

    const updated = await this.prisma.voiceSession.update({
      where: { id: sessionId },
      data: state
    });

    return toSessionInfo(updated);
  }

  /**
   * Get active users in a voice channel
   */
  async getActiveUsers(channelId: string): Promise<ActiveVoiceUser[]> {
    const sessions = await this.prisma.voiceSession.findMany({
      where: { channelId, leftAt: null },
      select: {
        id: true,
        userId: true,
        joinedAt: true,
        isMuted: true,
        isDeafened: true,
        isSpeaking: true
      },
      orderBy: { joinedAt: 'asc' }
    });

    return sessions.map((s) => ({
      userId: s.userId,
      sessionId: s.id,
      isMuted: s.isMuted,
      isDeafened: s.isDeafened,
      isSpeaking: s.isSpeaking,
      joinedAt: s.joinedAt
    }));
  }

  /**
   * Get user's current voice session
   */
  async getCurrentSession(userId: string): Promise<VoiceSessionInfo | null> {
    const session = await this.prisma.voiceSession.findFirst({
      where: { userId, leftAt: null }
    });

    return session ? toSessionInfo(session) : null;
  }

  /**
   * Cleanup - close all sessions for a user (on disconnect)
   */
  async cleanupUserSessions(userId: string): Promise<void> {
    await this.prisma.voiceSession.updateMany({
      where: { userId, leftAt: null },
      data: { leftAt: new Date() }
    });
  }
}
