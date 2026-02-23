// User utility functions

/**
 * Get display name for a user (firstName lastName or firstName or email username)
 */
export function getUserDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Unknown User';
}

/**
 * Get initials from user name (for avatars)
 */
export function getUserInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  return '?';
}
