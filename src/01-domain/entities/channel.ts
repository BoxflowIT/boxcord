// Domain entity: Channel

export type ChannelType = 'TEXT' | 'ANNOUNCEMENT' | 'THREAD';

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  type: ChannelType;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChannelInput {
  workspaceId: string;
  name: string;
  description?: string;
  type?: ChannelType;
  isPrivate?: boolean;
}

// Domain rules
export const CHANNEL_RULES = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  NAME_PATTERN: /^[a-z0-9-]+$/ // Lowercase, numbers, hyphens only
} as const;

export function validateChannelName(name: string): boolean {
  return (
    name.length >= CHANNEL_RULES.MIN_NAME_LENGTH &&
    name.length <= CHANNEL_RULES.MAX_NAME_LENGTH &&
    CHANNEL_RULES.NAME_PATTERN.test(name)
  );
}

export function normalizeChannelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
