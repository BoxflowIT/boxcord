# Boxcord Features

Complete list of all implemented features in Boxcord.

## 💬 Messaging & Communication

### Core Messaging
- ✅ **Real-time messaging** - WebSocket-based instant message delivery
- ✅ **Direct Messages (DMs)** - Private 1-on-1 conversations
- ✅ **Message editing** - Edit sent messages with history tracking
- ✅ **Message deletion** - Delete messages (soft delete with tracking)
- ✅ **Message forwarding** - Forward messages to other channels/DMs
- ✅ **Message pinning** - Pin important messages to channel/DM
- ✅ **Bookmarks/Saved messages** - Save messages for later reference
- ✅ **Typing indicators** - Real-time "user is typing..." indicator
- ✅ **Read receipts** - Track when messages are read
- ✅ **Message search** - Full-text search across all messages
- ✅ **Advanced search** - Filter by type, date range, workspace, channel, attachments
- ✅ **Infinite scroll** - Efficient pagination with cursor-based loading

### Rich Content
- ✅ **Markdown support** - Format text with markdown syntax
- ✅ **Code blocks** - Syntax-highlighted code snippets
- ✅ **File attachments** - Upload images, documents, videos (25MB limit)
- ✅ **GIF support** - Search and send GIFs via Giphy integration
- ✅ **Rich media embeds** - OpenGraph/oEmbed for link previews
- ✅ **Emoji reactions** - Full emoji picker with 1000+ emojis
- ✅ **Quick reactions** - 5 common reactions (👍 ❤️ 😂 🎉 🔥)
- ✅ **Custom emoji picker** - React Portal-based picker with smart positioning
- ✅ **Reaction deduplication** - Prevents duplicate reaction bubbles

### Mentions & Commands
- ✅ **@Mentions** - Tag users with autocomplete
- ✅ **Slash commands** - Quick actions with `/` prefix
- ✅ **Mention notifications** - Get notified when mentioned

## 🎤 Voice & Audio

### Voice Communication
- ✅ **Voice channels** - Real-time voice communication rooms
- ✅ **Voice channel text chat** - Integrated messaging in voice channels
- ✅ **WebRTC peer-to-peer** - Direct audio streaming between users
- ✅ **Voice activity detection (VAD)** - Automatic noise gating
- ✅ **Speaking indicators** - Visual feedback when users speak
- ✅ **Join/leave sounds** - Audio cues for voice channel events
- ✅ **Split-panel layout** - Voice users and text chat side-by-side

### Audio Quality
- ✅ **AI noise suppression** - RNNoise AI for crystal-clear audio
- ✅ **Echo cancellation** - Automatic echo removal
- ✅ **Auto gain control** - Consistent volume levels
- ✅ **Professional audio pipeline** - Compression, limiting, gain control
- ✅ **High-pass filter** - Remove low-frequency rumble
- ✅ **Volume normalization** - Prevent audio clipping

### Audio Settings
- ✅ **Device selection** - Choose input/output devices
- ✅ **Mic testing** - Test audio with real-time level monitoring
- ✅ **Input sensitivity** - Adjust voice activation threshold
- ✅ **Output volume control** - Adjust playback volume
- ✅ **Monitor mode** - "Hear yourself" for mic testing
- ✅ **Audio quality presets** - Low/Balanced/High/Studio quality presets (#226)
  - **Low**: 16kHz sample rate, Mono, optimized for bandwidth
  - **Balanced**: 24kHz sample rate, Stereo, default setting
  - **High**: 48kHz sample rate, Stereo, high-quality audio
  - **Studio**: 48kHz sample rate, Stereo, professional audio
- ✅ **Notification sounds** - 5 customizable notification sound types (#226)
  - Default, Chime, Bell, Pop, Ding
  - Sound preview functionality
  - Persistent settings across sessions

### Video Communication
- ✅ **Video calls** - DM and group video calls
- ✅ **DM video calling** - 1-on-1 video in direct messages
- ✅ **Screen sharing** - Share screen in voice channels and DMs
- ✅ **Camera + Screen combo** - Show camera and screen simultaneously
- ✅ **Video grid layout** - Automatic layout for multiple participants
- ✅ **Mirrored local video** - See yourself as others see you
- ✅ **Video quality switching** - Dynamic quality control (360p/480p/720p/1080p)
- ✅ **Live quality adjustment** - Change quality during active calls

### Video Window Controls
- ✅ **Fullscreen mode** - Immersive video experience
- ✅ **Minimize video** - Collapse to small floating indicator
- ✅ **Floating window** - Draggable and resizable video window
- ✅ **Picture-in-Picture** - Browser native PiP support
- ✅ **Window state persistence** - Remember window position and size
- ✅ **Drag to reposition** - Move floating window anywhere
- ✅ **Resize window** - Custom resize with min/max constraints
- ✅ **Quick mode switching** - Toggle between fullscreen, floating, minimized, PiP

**📖 See:** [VOICE_ARCHITECTURE.md](VOICE_ARCHITECTURE.md)

## 🌍 Workspaces & Channels

### Workspace Management
- ✅ **Multiple workspaces** - Organize teams separately
- ✅ **Workspace creation** - Create new workspaces
- ✅ **Workspace settings** - Configure workspace name, icon
- ✅ **Workspace deletion** - Remove workspaces (admin only)
- ✅ **Workspace invites** - Share invite links
- ✅ **Member list** - View all workspace members

### Channel Types
- ✅ **Text channels** - Topic-specific conversations
- ✅ **Voice channels** - Real-time audio rooms
- ✅ **Announcement channels** - One-way broadcast channels

### Channel Management
- ✅ **Channel creation** - Create new channels
- ✅ **Channel settings** - Configure name, description, type
- ✅ **Channel deletion** - Remove channels (admin only)
- ✅ **Channel permissions** - Granular access control
- ✅ **Channel categories** - Organize channels into groups
- ✅ **Channel ordering** - Custom channel sort order

## 🧵 Threads

### Thread Conversations
- ✅ **Create threads** - Start a thread from any channel message
- ✅ **Thread replies** - Nested conversations within threads
- ✅ **Thread sidebar** - Dedicated sidebar UI for viewing/replying to threads
- ✅ **Real-time updates** - WebSocket-based instant thread reply delivery
- ✅ **Thread reactions** - Emoji reactions on thread replies with optimistic updates
- ✅ **Thread reply editing** - Edit your own thread replies
- ✅ **Thread reply deletion** - Delete your own thread replies
- ✅ **File attachments in threads** - Upload files in thread replies

### Thread Management
- ✅ **Follow/unfollow threads** - Control thread notifications
- ✅ **Auto-follow on reply** - Automatically follow threads when you reply
- ✅ **Mark threads as read** - Track unread thread replies
- ✅ **Unread count badges** - Visual indicators for unread thread replies
- ✅ **Thread locking** - Admins/moderators can lock threads
- ✅ **Thread deletion** - Delete threads and all replies (with proper cleanup)
- ✅ **Following threads list** - View all threads you're following
- ✅ **Thread archiving** - Archive completed threads (read-only)
- ✅ **Thread resolving** - Mark threads as resolved with status badge
- ✅ **Thread search** - Search threads by title and content
- ✅ **Thread analytics** - Per-thread and channel-level analytics
- ✅ **Thread notifications** - Real-time notification panel with bell icon
- ✅ **Thread mentions** - @mention users in thread replies with push notifications

### Thread UI/UX
- ✅ **Thread indicator** - "X replies" button on messages with threads
- ✅ **Thread context menu** - Right-click actions for thread management (archive, resolve)
- ✅ **Keyboard shortcut reactions** - Quick reactions (1-5) work in threads when sidebar is open
- ✅ **Notification sounds** - Audio notifications for new thread replies
- ✅ **Thread info panel** - View thread metadata, participants, and analytics
- ✅ **Thread title required** - CreateThreadModal dialog requires title on creation
- ✅ **Thread notification panel** - Bell icon with unread badge and notification list
- ✅ **Mention autocomplete** - @mention support in thread composer
- ✅ **Archive/resolve badges** - Visual status indicators in thread list

**📖 See:** [THREADS.md](THREADS.md)

## 👥 User Management

### User Profiles
- ✅ **User profiles** - View user information
- ✅ **Profile editing** - Update name, bio, avatar
- ✅ **Avatar upload** - Custom profile pictures
- ✅ **Profile modal** - Detailed user information view
- ✅ **Bio/About section** - Personal description

### User Status & Presence
- ✅ **Online status** - Real-time presence tracking
  - 🟢 Online
  - 🟡 Away (idle)
  - 🔴 Do Not Disturb
  - ⚫ Offline
- ✅ **Custom status** - Set status text and emoji
- ✅ **Last seen timestamp** - When user was last online
- ✅ **Activity status** - Show what user is doing

### User Discovery
- ✅ **User search** - Find users by name or email
- ✅ **Member list** - View all workspace members with status
- ✅ **Grouped by role** - Members organized by role
- ✅ **Online/offline sorting** - Online users shown first

## 🛡️ Moderation & Admin

### User Management
- ✅ **Kick users** - Remove users from workspace (can rejoin)
- ✅ **Ban users** - Permanently ban with reason tracking
- ✅ **Unban users** - Restore access to banned users
- ✅ **Role management** - Promote/demote users
- ✅ **User roles** - Super Admin, Admin, Staff, Member

### Moderation Tools
- ✅ **Moderation modal** - Quick moderation actions
- ✅ **Context menu actions** - Right-click moderation
- ✅ **Audit logs** - Track all moderation actions
- ✅ **Ban reasons** - Document why users were banned
- ✅ **Moderator permissions** - Role-based moderation access

### Channel Permissions
- ✅ **Granular permissions** - Control who can access channels
- ✅ **Permission roles** - Admin, Moderator, Member
- ✅ **View channel** - Control channel visibility
- ✅ **Send messages** - Control who can post
- ✅ **Manage channels** - Control channel management

## 🌐 Internationalization (i18n)

- ✅ **Multi-language support** - English 🇬🇧 and Swedish 🇸🇪
- ✅ **Live language switching** - Change language without reload
- ✅ **Persistent preferences** - Saves language choice
- ✅ **Automatic detection** - Detects browser language
- ✅ **Translation keys** - Organized translation structure
- ✅ **Variable interpolation** - Dynamic text with variables

**📖 See:** [I18N.md](I18N.md)

## 🔔 Notifications

### Push Notifications
- ✅ **Web Push Notifications** - Browser notifications
- ✅ **Mention notifications** - Get notified when mentioned
- ✅ **DM notifications** - Alerts for direct messages
- ✅ **Channel notifications** - Alerts for channel messages
- ✅ **Email notifications** - Via SendGrid (optional)

### Notification Settings
- ✅ **Granular control** - Per-channel notification settings
- ✅ **Mute channels** - Disable notifications for specific channels
- ✅ **All messages** - Notify on every message
- ✅ **Mentions only** - Only notify on @mentions
- ✅ **Nothing** - Disable all notifications

### Notification Features
- ✅ **Sound effects** - Audio cues for events
- ✅ **Desktop notifications** - Native OS notifications
- ✅ **Browser badges** - Unread count badges
- ✅ **Notification permissions** - Request user permission

## ⚡ Performance & Optimization

### Caching
- ✅ **Redis caching** - 70-90% faster cached queries (optional)
- ✅ **In-memory fallback** - Works without Redis
- ✅ **React Query** - Client-side query caching with `staleTime: Infinity` for core data
- ✅ **WebSocket cache sync** - Targeted `setQueryData` updates instead of refetches
- ✅ **Automatic invalidation** - Cache updates on data changes
- ✅ **ETag support** - SHA-256 hash-based ETags for 304 Not Modified responses
- ✅ **Global no-cache default** - All API routes default to `no-cache`; routes opt-in to caching

### Database
- ✅ **Prisma 6** - 30-50% faster database queries
- ✅ **Connection pooling** - Efficient database connections
- ✅ **Selective field fetching** - Only fetch needed data
- ✅ **Database indexes** - Optimized query performance
- ✅ **Query optimization** - Reduced N+1 queries

### Client-Side (v1.7.1)
- ✅ **Batch user fetching** - Single request for all users instead of N+1
- ✅ **Centralized API service** - All HTTP calls through `api` service with auth
- ✅ **Derived bookmark status** - Computed from cached list, no extra requests
- ✅ **Shared query hooks** - `useSharedChannelQueries` for common data
- ✅ **Debounced embeds** - 500ms debounce on link preview parsing

### Real-time
- ✅ **WebSocket-first architecture** - Minimal HTTP overhead
- ✅ **Optimistic updates** - Instant UI feedback
- ✅ **Efficient pagination** - Cursor-based infinite scroll
- ✅ **Debounced typing** - Reduced typing indicator spam
- ✅ **Message batching** - Efficient bulk operations

**📖 See:** [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) | [CACHING.md](CACHING.md)

## 🔒 Security

### Authentication & Authorization
- ✅ **AWS Cognito authentication** - Enterprise-grade auth
- ✅ **JWT tokens** - Secure session management
- ✅ **Token refresh** - Automatic token renewal
- ✅ **Session validation** - Verify tokens on every request
- ✅ **Role-based access** - Permission system

### Security Features
- ✅ **XSS protection** - Sanitized user input
- ✅ **CORS configuration** - Controlled cross-origin access
- ✅ **Rate limiting** - API abuse protection (100 req/min)
- ✅ **Content Security Policy** - Browser-level security
- ✅ **Helmet security headers** - Additional HTTP headers
- ✅ **Input validation** - Zod schema validation

### File Security
- ✅ **File type validation** - Allowed file types
- ✅ **File size limits** - 25MB maximum
- ✅ **Secure file storage** - S3 or local storage
- ✅ **Automatic cleanup** - Remove old files

## 🎨 UI/UX

### Design
- ✅ **Discord-inspired design** - Familiar and intuitive
- ✅ **Dark mode** - Easy on the eyes
- ✅ **Responsive layout** - Mobile, tablet, desktop
- ✅ **TailwindCSS** - Modern utility-first styling
- ✅ **Custom components** - Reusable UI components
- ✅ **Smooth animations** - Polished interactions

### User Experience
- ✅ **Keyboard shortcuts** - 17+ customizable shortcuts for power users (#227)
  - Navigation: Alt+↑/↓ (prev/next channel), Ctrl+K (search), Ctrl+Shift+A (mark read)
  - Voice: Ctrl+Shift+M (mute), Ctrl+Shift+D (deafen), Ctrl+Shift+V (video), Ctrl+Shift+S (screen share), Ctrl+Shift+L (leave)
  - Messaging: Ctrl+U (upload), Ctrl+E (emoji), Ctrl+P (pin)
  - Quick reactions: 1-5 keys (👍❤️😂🎉🔥)
  - Settings: Ctrl+, (open settings)
- ✅ **Custom keyboard shortcuts** - Fully customizable keybinds with conflict detection (#227)
- ✅ **Shortcut recorder** - Visual key combination recording (#227)
- ✅ **Advanced settings tabs** - Appearance, Video, Audio, Privacy, Notifications, Keybinds, Account
- ✅ **Video quality controls** - Test camera and adjust quality in settings (#223)
- ✅ **Audio quality presets** - Low/Balanced/High/Studio quality presets (#226)
- ✅ **Notification sounds** - 5 customizable notification sound types (#226)
- ✅ **Message density** - Compact/Cozy/Spacious message spacing (#225)
- ✅ **Theme customization** - Dark/Medium/Light themes (#225)
- ✅ **Context menus** - Right-click actions
- ✅ **Drag & drop** - File upload via drag & drop
- ✅ **Emoji picker** - Full emoji picker with smart positioning
- ✅ **GIF picker** - Integrated Giphy search
- ✅ **Loading states** - Skeletons and spinners
- ✅ **Error handling** - Toast notifications
- ✅ **Confirmation dialogs** - Safety for destructive actions

### Accessibility
- ✅ **Semantic HTML** - Proper HTML structure
- ✅ **ARIA labels** - Screen reader support
- ✅ **Keyboard navigation** - Full keyboard support
- ✅ **Focus management** - Visible focus indicators
- ✅ **Color contrast** - WCAG AA compliant
- ✅ **High contrast mode** - Enhanced contrast for accessibility (#225)
- ✅ **Reduced motion mode** - Minimize animations for accessibility (#225)

## 🛠️ Developer Experience

### Code Quality
- ✅ **TypeScript** - Full type safety
- ✅ **ESLint** - Code linting
- ✅ **Prettier** - Code formatting
- ✅ **Vitest** - Unit testing (122 tests passing: 61 backend + 61 frontend)
- ✅ **Playwright** - E2E testing
- ✅ **K6** - Load testing

### CI/CD
- ✅ **GitHub Actions** - Automated testing
- ✅ **Pre-commit hooks** - Lint-staged validation
- ✅ **Pre-push validation** - Run tests before push
- ✅ **Automatic deployment** - Railway deployment on push

### Monitoring & Observability
- ✅ **Sentry integration** - Error tracking (optional)
- ✅ **Structured logging** - Pino logger
- ✅ **Health checks** - `/health` endpoint
- ✅ **Performance monitoring** - Request timing
- ✅ **Slow query detection** - Database query logging

**📖 See:** [TESTING.md](TESTING.md)

## 🚀 Production Features

### Deployment
- ✅ **Docker support** - Containerized deployment
- ✅ **Railway optimized** - Works with Railway platform
- ✅ **Environment variables** - Flexible configuration
- ✅ **Graceful shutdown** - SIGTERM/SIGINT handling
- ✅ **Zero-downtime deploys** - Rolling updates

### Scalability
- ✅ **Horizontal scaling** - Multiple instances support
- ✅ **Redis for clustering** - Shared state across instances
- ✅ **S3 for files** - Shared file storage
- ✅ **Load balancer ready** - Sticky sessions support
- ✅ **Database pooling** - Efficient connections

**📖 See:** [PRODUCTION.md](PRODUCTION.md) | [SCALING_STRATEGY.md](SCALING_STRATEGY.md)

## 📊 Analytics & Metrics

- ✅ **User activity tracking** - Online/offline events
- ✅ **Message statistics** - Message count, rate
- ✅ **Channel activity** - Most active channels
- ✅ **Performance metrics** - Response times, throughput
- ✅ **Error tracking** - Via Sentry (optional)

## 🔄 Background Jobs

- ✅ **Email delivery** - Async email sending
- ✅ **Webhook delivery** - Reliable webhook dispatch
- ✅ **File processing** - Image optimization
- ✅ **Cache warming** - Pre-populate cache
- ✅ **Cleanup tasks** - Remove old data

## 🗳️ Polls

### Poll Creation
- ✅ **Create polls** - Create polls in any text channel via slash command (`/poll`) or modal
- ✅ **Multiple options** - 2-10 answer options per poll
- ✅ **Single/multiple choice** - Configure single or multiple selection mode
- ✅ **Anonymous voting** - Optional anonymous vote mode
- ✅ **Timed polls** - Set optional end time for automatic expiry
- ✅ **Poll messages** - Polls are attached to channel messages for context
- ✅ **Duplicate option validation** - Case-insensitive duplicate detection prevents identical options
- ✅ **Whitespace trimming** - Question and options auto-trimmed via Zod schemas

### Voting
- ✅ **Vote toggle** - Click to vote, click again to remove vote
- ✅ **Vote change** - Switch vote to different option (single-choice)
- ✅ **Optimistic updates** - Instant UI feedback on vote
- ✅ **Real-time sync** - WebSocket broadcasts votes to all channel members
- ✅ **Voter skip** - Socket events include voterId so voters skip their own update
- ✅ **Persistent votes** - Votes survive hard refresh (cache bypass for poll models)
- ✅ **Anonymous voter privacy** - WebSocket events omit voter IDs for anonymous polls

### Poll Display
- ✅ **Live results** - Vote counts and percentages update in real-time
- ✅ **Progress bars** - Visual vote distribution per option
- ✅ **Auto-end timer** - Live countdown and automatic isEnded state
- ✅ **End poll early** - Creator can end poll before scheduled time
- ✅ **Error handling** - Swedish error messages with auto-clear

### Technical
- ✅ **Cache bypass** - `NEVER_CACHE_MODELS` set bypasses Prisma query cache for Poll, PollOption, PollVote
- ✅ **Race-safe voting** - Uses `deleteMany` + P2002 no-op for concurrent vote handling
- ✅ **Domain validation** - Question (1-500 chars), options (1-200 chars each)
- ✅ **Rate limiting** - 10 req/min for creation, 30 req/min for voting
- ✅ **Poll deletion events** - Emits `poll:deleted` and `message:delete` socket events on deletion
- ✅ **End poll guard** - Already-ended polls return current results without DB update
- ✅ **setTimeout overflow clamp** - Polls >24 days use clamped delay to avoid 32-bit int overflow
- ✅ **Error feedback** - `handleEndPoll` shows error state in UI on failure

## 📋 Message Templates

### Core
- ✅ **CRUD operations** - Create, read, update, and delete reusable message templates
- ✅ **Template limit** - Max 50 templates per user
- ✅ **Duplicate name check** - Case-insensitive name uniqueness per user
- ✅ **Input validation** - Name (1-100 chars), content (1-2000 chars)

### UI
- ✅ **Template modal** - Radix Dialog with list, create, and edit views
- ✅ **Quick insert** - One-click to insert template content into message input
- ✅ **Channel + DM support** - Template button in both channel and DM input areas
- ✅ **Inline delete confirmation** - Delete overlay with confirm/cancel
- ✅ **Content preview** - Truncated content preview in template list

### Technical
- ✅ **REST API** - Full CRUD at `/api/v1/templates` with Zod validation
- ✅ **Rate limiting** - GET 60/min, POST 10/min, PATCH/DELETE 20/min
- ✅ **Ownership enforcement** - Users can only access/edit/delete their own templates
- ✅ **i18n** - Full English and Swedish translations (17 keys)
- ✅ **Database** - `message_templates` table with userId index

## 🎯 Coming Soon

### Planned Features
- ⏳ **Bot integration** - Webhooks and bot API
- ⏳ **Mobile apps** - Native iOS/Android apps

---

## Feature Matrix

| Feature | Status | Documentation |
|---------|--------|---------------|
| Real-time messaging | ✅ Stable | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Voice channels | ✅ Stable | [VOICE_ARCHITECTURE.md](VOICE_ARCHITECTURE.md) |
| Direct messages | ✅ Stable | [ARCHITECTURE.md](ARCHITECTURE.md) |
| File uploads | ✅ Stable | [PRODUCTION.md](PRODUCTION.md) |
| GIF support | ✅ Stable | [GIF_SUPPORT.md](GIF_SUPPORT.md) |
| Multi-language | ✅ Stable | [I18N.md](I18N.md) |
| Redis caching | ✅ Stable | [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) |
| Push notifications | ✅ Stable | [PRODUCTION.md](PRODUCTION.md) |
| Moderation tools | ✅ Stable | - |
| Bookmarks | ✅ Stable | - |
| Video calls | ✅ Stable | [VOICE_ARCHITECTURE.md](VOICE_ARCHITECTURE.md) |
| Screen sharing | ✅ Stable | [VOICE_ARCHITECTURE.md](VOICE_ARCHITECTURE.md) |
| Video window controls | ✅ Stable | [VOICE_ARCHITECTURE.md](VOICE_ARCHITECTURE.md) |
| Thread support | ✅ Stable | [THREADS.md](THREADS.md) |
| Polls | ✅ Stable | - |
| Advanced Search | ✅ Stable | - |
| Message Templates | ✅ Stable | - |

---

## Recent Updates

### v1.10.0 - Advanced Search (March 2026)
- ✅ Filter by type: Channels, DMs, or All
- ✅ Date range filters (from/to)
- ✅ Workspace and channel filter dropdowns
- ✅ Has attachment filter
- ✅ Result counts per type (channels/DMs)
- ✅ Attachment preview in search results
- ✅ Collapsible advanced filter panel
- ✅ Active filter indicator on filter button
- ✅ Clear all filters action
- ✅ Full i18n support (English + Swedish)
- ✅ 13 new backend tests for search filters

### v1.9.2 - Message Templates (March 2026)
- ✅ Full CRUD for reusable message templates (max 50 per user)
- ✅ Template modal with list/create/edit views (Radix Dialog)
- ✅ One-click insert into channel or DM message input
- ✅ REST API: `GET/POST /templates`, `PATCH/DELETE /templates/:id`
- ✅ Rate limiting, Zod validation, ownership enforcement
- ✅ Duplicate name detection (case-insensitive)
- ✅ Inline delete confirmation overlay
- ✅ i18n: 17 translation keys (EN + SV)
- ✅ Database migration: `message_templates` table

### v1.8.0 - Polls (March 2026)
- ✅ Create polls in channels via `/poll` slash command or modal
- ✅ Single/multiple choice with 2-10 options
- ✅ Anonymous voting and timed poll expiry
- ✅ Vote toggle (click to vote, click again to remove)
- ✅ Real-time vote sync via WebSocket (`poll:voted`, `poll:created`, `poll:ended`, `poll:deleted`)
- ✅ Optimistic updates with server reconciliation
- ✅ Prisma cache bypass for poll models (`NEVER_CACHE_MODELS`)
- ✅ Race-safe voting with `deleteMany` + P2002 no-op
- ✅ Live results with progress bars and percentages
- ✅ Auto-end timer with live countdown
- ✅ Swedish error translations for vote errors
- ✅ Visibility change handler refreshes poll on tab focus
- ✅ Database migration: Poll, PollOption, PollVote tables

### v1.8.1 - Poll Fixes & Cache Hardening (March 2026)
- ✅ ETag collision fix — SHA-256 hash replaces truncated base64 (caused votes to vanish on refresh)
- ✅ Global `Cache-Control: no-cache` default for all API routes (19 routes were missing headers)
- ✅ Anonymous voter privacy — voter IDs omitted from WebSocket events for anonymous polls
- ✅ Poll deletion emits `poll:deleted` and `message:delete` socket events
- ✅ Duplicate option validation (case-insensitive)
- ✅ Whitespace trimming in Zod schemas for question and options
- ✅ End poll guard — already-ended polls return results without DB update
- ✅ Error feedback in UI for `handleEndPoll`
- ✅ setTimeout overflow clamp for polls >24 days

### v1.7.1 - Request Optimization (March 2026)
- ✅ Batch user fetching — single request replaces N+1 individual fetches
- ✅ React Query migration for threads with `staleTime: Infinity`
- ✅ Targeted WebSocket cache updates via `setQueryData`
- ✅ Derived bookmark status from cached list (no extra API call)
- ✅ Shared query hooks (`useSharedChannelQueries`)
- ✅ Centralized `api` service migration for all HTTP calls
- ✅ Debounced embed parsing (500ms)
- ✅ ForwardMessageModal N+1 fix
- ✅ AuditLogViewer auth header fix
- ✅ staleTime additions for voice, bookmarks, permissions, embeds

### v1.7.0 - Thread Enhancements (February 2026)
- ✅ Required thread title on creation with CreateThreadModal dialog
- ✅ Thread search with server-side API and client-side filtering
- ✅ Thread archiving/resolving with DB migration and full UI
- ✅ Thread analytics panel (per-thread and channel-level stats)
- ✅ Thread notification panel with bell icon and real-time updates
- ✅ @mention support in thread replies with push notifications
- ✅ Wider thread sidebar (480px) for better readability
- ✅ Unified sidebar section headers (Channels/DMs/Threads)
- ✅ New icons: ArchiveIcon, CheckCircleIcon, BellIcon
- ✅ Full i18n support for all new features (English + Swedish)

### v1.6.0 - Thread Support
- ✅ Create threads from any channel message
- ✅ Thread sidebar with replies, reactions, and file attachments
- ✅ Real-time WebSocket updates for thread events
- ✅ Follow/unfollow threads with unread count tracking
- ✅ Thread reply CRUD (create, edit, delete)
- ✅ Thread reply reactions with optimistic updates
- ✅ Keyboard shortcut reactions route to threads when sidebar open
- ✅ Thread locking for admins/moderators
- ✅ Following threads list panel
- ✅ Thread context menu
- ✅ Notification sounds for thread replies
- ✅ Thread deletion cleans up all replies and reactions

### v1.5.0 - Bug Fixes & Polish
- ✅ Call hangup sounds for all scenarios
- ✅ Real-time socket events for channel message pin/unpin
- ✅ Optimized DM channel cache
- ✅ Theme and font size persistence fixes

### v1.4.0 - Custom Keyboard Shortcuts (#227)
- ✅ Fully customizable keyboard shortcuts (17 actions)
- ✅ Visual shortcut recorder with key combination display
- ✅ Real-time conflict detection and warnings
- ✅ Quick emoji reactions (1-5 keys)
- ✅ Channel navigation shortcuts (Alt+↑/↓)
- ✅ Category-based shortcut organization
- ✅ Reset individual or all shortcuts to defaults
- ✅ Persistent storage with localStorage

### v1.3.0 - Audio & Notification Settings (#226)
- ✅ Audio quality presets (Low/Balanced/High/Studio)
- ✅ Notification sound customization (5 sound types)
- ✅ Sound preview functionality
- ✅ Unified settings UI with gradient buttons
- ✅ Persistent audio/notification preferences

### v1.2.0 - Appearance Settings (#225)
- ✅ Message density selector (Compact/Cozy/Spacious)
- ✅ Medium theme option (Dark/Medium/Light)
- ✅ High contrast mode for accessibility
- ✅ Reduced motion mode for accessibility
- ✅ Modern theme colors
- ✅ Dynamic CSS variable system

---

**Last Updated:** March 9, 2026
