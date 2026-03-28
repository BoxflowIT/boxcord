# Changelog

All notable changes to Boxcord will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.24.9] - 2026-03-28

### Fixed

- **CHANGELOG** — Resolve 241 markdown lint errors (MD022/MD032 blank lines, MD024 duplicate headings)
- **Markdownlint config** — Add `.markdownlint.json` with `MD024.siblings_only: true`

## [1.24.8] - 2026-03-28

### Changed

- **Desktop updater (Linux)** — Show manual install dialog when pkexec fails:
  - Detect downloaded `.deb` in `XDG_CACHE_HOME` (or `~/.cache`) with mtime-based selection
  - Display native Electron dialog with `sudo dpkg -i '<path>'` command
  - Copy install command to clipboard automatically
  - Send `[MANUAL_INSTALL]` prefixed error to renderer for distinct UI treatment
  - UpdateBanner shows ClipboardCopy icon for manual-install errors

## [1.24.7] - 2026-03-28

### Fixed

- **Desktop updater (Linux)** — Handle all pkexec exit codes in update fallback:
  - Match on `/pkexec/i` keyword instead of specific exit codes (100, 126, 127)
  - Remove unreachable ENOENT branch; simplify `isPkexecFailure()` to 3-line function

## [1.24.6] - 2026-03-28

### Fixed

- **Desktop updater (Linux)** — Handle async pkexec failure and tighten detection:
  - Add `isInstallingUpdate` flag for async `autoUpdater.on('error')` handler
  - Create `isPkexecFailure()` helper with structured error code/exit code checks
  - Handle ENOENT and string exit codes
  - Reset `forceQuit` flag in async error path

## [1.24.5] - 2026-03-27

### Fixed

- **Desktop updater (Linux)** — Fallback to `app.relaunch()` when pkexec is unavailable:
  - Detect pkexec/sudo failure (exit code 127) in `quitAndInstall` catch block
  - Fall back to `app.relaunch()` + `app.quit()` when elevated install fails

## [1.24.4] - 2026-03-27

### Fixed

- **Security** — Resolve 4 Dependabot alerts:
  - Bump fastify 5.8.2 → 5.8.4 (X-Forwarded-Proto/Host spoofing)
  - Add brace-expansion >=5.0.5 resolution (zero-step sequence DoS)
  - Add yaml >=2.8.3 resolution (stack overflow via nested collections)
  - Add picomatch ^4.0.4 resolution in desktop (POSIX class method injection)

## [1.24.3] - 2026-03-27

### Fixed

- **Desktop updater** — Address Copilot review comments:
  - Clear stale `updateError` when update available/downloaded
  - Add catch block to `checkForUpdates` for unhandled rejections
  - Move `before-quit` listener to module scope (prevent duplicate listeners)
  - Scope picomatch resolutions to respect semver ranges
- **UpdateBanner** — Prioritize restart action over error display

## [1.24.2] - 2026-03-26

### Fixed

- **Security** — Resolve picomatch ReDoS vulnerability in client deps

## [1.24.1] - 2026-03-26

### Fixed

- **Security** — Resolve picomatch ReDoS vulnerability in root deps
- **Desktop updater** — Fix "Restart now" button not working:
  - Move `forceQuit` to module scope (close-to-tray was blocking quit)
  - Add try/catch on `quitAndInstall` with error reporting to renderer
  - Add `update:check` IPC handler for manual update checks

### Added

- **Desktop** — "Check for updates" button in Settings > About
- **Desktop** — Update error banner (amber) in UpdateBanner component

## [1.24.0] - 2026-03-26

### Added

- **UI modernization** — Discord-style visual refresh:
  - Button press feedback (scale + brightness)
  - Input focus glow effect
  - Voice speaking pulse animation
  - Channel spacing improvements
  - Message hover background
  - Message actions positioning fix
- **Voice VAD** — Fix analyser→highPassFilter, vadState.vadActive, requestAnimationFrame resilience

## [1.23.8] - 2026-03-24

### Changed

- **ICE candidate queue tests** — Phase-based queueCandidate test with proper flush expiry assertions
- **Test quality** — Improved voice module test assertions per Copilot Code Review feedback

## [1.23.6] - 2026-03-24

### Changed

- **ICE candidate queue extraction** — Extracted `iceCandidateQueue.ts` as shared module to break circular dependency between voice/index, voiceHandlers, and voice.service
- **7 unit tests** for ICE candidate queue module (enqueue, flush, reset, capacity cap)

## [1.23.4] - 2026-03-24

### Fixed

- **Voice call reliability** — 7 critical WebRTC fixes:
  - Added TURN server support (relay fallback for restrictive networks)
  - ICE candidate buffering with queue (cap 50) and flush on remote description
  - Retry gating on remote peer presence to prevent ghost connections
  - Initiator tracking to prevent dual-offer race conditions
  - Disconnect cleanup with grace timer (clear on VOICE_JOIN)
  - Proper `getCurrentUserId()` usage in voice membership checks
- **Copilot Code Review** — Applied all review suggestions across 5 rounds (voice room membership check, try/catch grace timer, TURN TLS URLs, initiator map cleanup, candidate queue cap)

### Added

- **Copilot review instructions** — `.github/copilot-review-instructions.md` to focus reviews on security/bugs/data integrity and skip test style/comment wording/doc counts

## [1.10.0] - 2026-03-22

### Added

- **Microsoft 365 multi-tenant** — Changed Azure AD authority to `common` endpoint for multi-tenant support, updated config feature flag

## [1.9.0] - 2026-03-05

### Added

- **CI/CD pipeline overhaul** — 9 improvements to push-to-production workflow
- **Parallel CI jobs** — E2E Tests run alongside Test & Lint (~3 min total)
- **Playwright browser caching** — Chromium cached between CI runs (~300MB saved)
- **E2E tests in CI** — Health check, API docs, Swagger UI with `@auth` tag exclusion
- **Deploy staging workflow** — Auto-deploy to AWS staging on develop push
- **Deploy preview environments** — PR-based preview deployments with auto-cleanup
- **Post-deploy smoke tests** — 5-check health verification after production deploys
- **Branch protection script** — `scripts/setup-branch-protection.sh` for main/develop rules
- **Pre-push build validation** — Client build added to pre-push hook

### Changed

- **Pre-commit slimmed** — Only runs lint-staged (removed tests for faster commits)
- **Commit message format** — PR number now optional in conventional commits
- **CI architecture** — E2E no longer depends on Test & Lint (parallel execution)

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
