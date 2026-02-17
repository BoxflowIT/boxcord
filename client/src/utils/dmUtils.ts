// DM-related utility functions

interface DMChannel {
  participants: {
    userId: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }[];
}

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

/**
 * Gets the other user in a DM channel (not the current user)
 */
export function getOtherUser(
  channel: DMChannel,
  currentUserId?: string
): UserInfo | undefined {
  const otherParticipant = channel.participants.find(
    (p) => p.userId !== currentUserId
  );

  return otherParticipant?.user;
}

/**
 * Gets display name for a user
 */
export function getUserDisplayName(user: UserInfo): string {
  return user.firstName ?? user.email.split('@')[0];
}

/**
 * Gets initial for avatar
 */
export function getUserInitial(user: UserInfo): string {
  return user.firstName?.charAt(0) ?? user.email.charAt(0);
}
