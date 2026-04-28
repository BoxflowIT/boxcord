// Central export file for all reusable components
// This makes imports cleaner: import { Button, TextInput } from '@/components'

// Message components
export * from './message';

// Channel components
export * from './channel';

// Sidebar components
export * from './sidebar/index';

// DM components
export * from './dm';

// Form components
export * from './form';

// Layout components
export * from './layout';

// Profile components
export * from './profile';

// Settings components
export * from './settings';

// Member components
export * from './member';

// Modal utility components
export * from './modal';

// Workspace components
export * from './workspace';

// User components
export * from './user';

// Action components
export * from './action';

// Notification components
export * from './notification';

// List components
export * from './list';

// Container components
export * from './container';

// Avatar components
export * from './avatar';

// Menu components
export * from './menu';

// Dialog components
export * from './dialog';

// Tabs components
export * from './tabs';

// Scroll components
export * from './scroll';

// Utility components
export * from './utility';

// UI components (existing)
export { default as Avatar } from './ui/Avatar';
export { default as Modal } from './ui/Modal';
export * from './ui/Icons';
export * from './ui/LoadingSpinner';
export {
  MessageListSkeleton,
  ChannelSkeleton,
  MemberListSkeleton
} from './ui/Skeleton';

// UI components (new)
export { default as Badge } from './ui/Badge';
export { default as Tooltip } from './ui/Tooltip';
export { default as SearchInput } from './ui/SearchInput';
export { default as CountBadge } from './ui/CountBadge';
export { default as Card } from './ui/Card';

// Keep existing components accessible
export { MessageItem } from './MessageItem';
export { default as FileUpload } from './FileUpload';
export { default as EmojiPicker } from './ui/EmojiPicker';
export { default as DeleteConfirmModal } from './DeleteConfirmModal';
export {
  default as MentionAutocomplete,
  parseMentions
} from './MentionAutocomplete';
export { default as SlashCommandAutocomplete } from './SlashCommandAutocomplete';
