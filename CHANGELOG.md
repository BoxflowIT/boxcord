# Changelog

All notable changes to Boxcord will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.1] - 2026-03-05

### Fixed
- **ETag collision** — ETags now use SHA-256 hash of full response payload instead of truncated base64 (first 20 chars); fixes browsers receiving 304 for changed poll data, causing votes to disappear on page refresh
- **Anonymous poll voter leak** — Voter IDs no longer sent via `poll:voted` WebSocket events for anonymous polls
- **End poll guard** — Already-ended polls return current results (200) instead of redundant DB update
- **handleEndPoll error feedback** — UI now shows error message when ending a poll fails
- **setTimeout overflow** — Polls >24 days use clamped delay to avoid 32-bit int overflow firing timer immediately

### Added
- **Global no-cache default** — All `/api/v1` routes default to `Cache-Control: no-cache, no-store, must-revalidate`; individual routes opt-in to caching via `reply.cache()`
- **Poll deletion events** — `DELETE /polls/:id` now emits `poll:deleted` and `message:delete` socket events
- **Duplicate option validation** — Case-insensitive duplicate detection in poll creation
- **Whitespace trimming** — Zod schemas trim poll question and option strings

### Changed
- ETag generation uses `createHash('sha256')` from `node:crypto` instead of raw base64
- `POLL_DELETED` and `MESSAGE_DELETED` constants added to `SOCKET_EVENTS`

## [1.7.1] - 2026-03-02

### Changed
- **Request optimization round 1** — Batch users, React Query threads, fix caching
  - Batch user fetching: `useUsers(ids)` checks cache first, batch-fetches uncached via `POST /users/batch`
  - Migrated `useThreads` from raw fetch to React Query with 18 api service functions
  - Socket `user:update` handler uses targeted `setQueryData` instead of broad `invalidateQueries`
  - Bookmark status derived from `useBookmarks()` list — no per-message `GET /bookmarks/check`
  - Fixed duplicate query keys: shared hooks for online users, workspace members
  - Pinned messages caching with `staleTime: 30s` (was cache-busting with `Date.now()`)
  - Voice channel users `staleTime: 10s` (was 0 = refetch every mount)
  - Thread file upload uses `api.uploadFile` instead of raw `fetch`

- **Request optimization round 2** — Fix N+1, staleTime, auth, api service migration
  - ForwardMessageModal: uses cached React Query hooks instead of N+1 `getWorkspaces → loop getChannels`
  - Added `staleTime: 30s` to `useBookmarks`, `useBookmarkCount`, `useChannelPermissions`
  - Migrated raw `fetch()` to centralized `api` service in `useBookmarks`, `usePermissions`, `useGiphy`
  - Fixed AuditLogViewer missing `Authorization` header (was guaranteed 401)
  - Added 500ms debounce to MessageEmbed embed parsing (`POST /embeds/parse`)

### Fixed
- All CodeQL alerts resolved (security fixes)
- All ESLint warnings resolved

## [1.7.0] - 2026-02-27

### Added
- **Thread enhancements:**
  - Required thread title on creation with CreateThreadModal dialog
  - Thread search with server-side API (`GET /threads/search?q=`) and client-side filtering
  - Thread archiving/resolving with DB migration (`is_archived`, `is_resolved` columns)
  - Thread analytics panel (per-thread and channel-level stats)
  - Thread notification panel with bell icon and real-time updates
  - @mention support in thread replies with push notifications
  - Wider thread sidebar (480px) for better readability
  - Unified sidebar section headers (Channels/DMs/Threads)
  - New icons: ArchiveIcon, CheckCircleIcon, BellIcon
  - Full i18n support for all new thread features (English + Swedish)

## [1.6.0] - 2026-02-26

### Added
- Thread support - create threads from any channel message
- Thread sidebar UI with real-time reply list, composer, and thread info
- Thread reply CRUD (create, edit, delete) with author-only permissions
- Thread reply reactions with optimistic-first update pattern
- Follow/unfollow threads with auto-follow on reply
- Unread thread count badges and mark-as-read
- Thread locking for admins/moderators
- Following threads list panel
- Thread context menu (right-click)
- Keyboard quick reactions (1-5) route to threads when sidebar is open
- Notification sounds for new thread replies
- Thread WebSocket events (created, reply, reply:edited, reply:deleted, reply:reaction, updated, deleted)
- File attachments in thread replies
- Thread REST API with 14 endpoints
- Thread state management via Zustand with Immer
- Database migration for Thread and ThreadParticipant tables

### Fixed
- Thread reactions no longer break channel reactions (individual Zustand selectors)
- Duplicate reaction bubbles eliminated (optimistic-first pattern)
- Thread reply button ("X replies") shows correctly on refresh (React.memo comparator fix)
- Thread deletion properly cleans up all reply messages, reactions, and attachments
- Socket `toggleReaction` uses `queueOrExecute` for reliability during reconnections

## [1.5.0] - 2026-02-25

### Added
- Call hangup sounds for all scenarios (reject, hangup, timeout) (#6)
- Real-time socket events for channel message pin/unpin updates (#6)
- Optimized cache invalidation for DM channels navigation (#6)
- Async cache invalidation for bookmarks (#6)

### Fixed
- Theme and font size persistence on page refresh (JSON parse fix) (#6)
- Keyboard shortcuts panel styling and keybind handling (#6)
- Unused variable cleanup (ESLint) (#6)

### Changed
- Improved DM channels cache for faster navigation (#6)

## [1.4.0] - 2026-02-25

### Added
- Custom keyboard shortcuts system (#227)
- 17+ customizable shortcuts with conflict detection (#227)
- Keyboard shortcuts settings tab (#227)

### Changed
- Keybinds now fully customizable by users (#227)

## [1.3.0] - 2026-02-25

### Added
- Audio quality presets (Low/Balanced/High/Studio) (#226)
- Custom notification sounds (Default, Chime, Bell, Pop, Ding) (#226)
- Sound preview feature for notification sounds (#226)

### Changed
- Enhanced audio settings UI (#226)
- Improved notification settings panel (#226)

## [1.2.0] - 2026-02-25

### Added
- Theme customization (Dark/Medium/Light) (#225)
- Message density settings (Compact/Cozy/Spacious) (#225)
- High contrast mode for accessibility (#225)
- Reduced motion option for accessibility (#225)
- Appearance settings tab (#225)

### Changed
- Settings modal now includes appearance customization (#225)

## [1.1.0] - 2026-02-XX

### Added
- Multi-language support (English, Swedish)
- Real-time voice channels with WebRTC
- AI noise suppression (RNNoise)
- Video calls with screen sharing
- Message reactions and emoji picker
- File attachments and GIF support
- Message pinning and bookmarks
- User profiles and custom status
- Direct Messages (DMs)
- Workspace management

### Changed
- Improved WebSocket performance
- Enhanced UI/UX with Discord-inspired design

## [1.0.0] - 2026-02-XX

### Added
- Initial release
- Basic messaging functionality
- Real-time updates via WebSocket
- AWS Cognito authentication
- PostgreSQL database with Prisma
- React frontend with Vite
- Docker development environment
