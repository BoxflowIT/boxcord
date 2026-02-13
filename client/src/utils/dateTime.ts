// Date/Time utility functions

/**
 * Format a date string to relative time
 * @example "2 min sedan", "3h sedan", "24 dec"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just nu';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m sedan`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h sedan`;
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

/**
 * Format message timestamp
 * @example "14:23", "Igår 14:23", "24 dec"
 */
export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (date.toDateString() === now.toDateString()) {
    return time;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Igår ${time}`;
  }
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
