# Boxcord

Discord-like real-time chat application for Boxflow, soon integrated with Boxtime.

**Latest version:** 1.12.0 | [View Changelog](CHANGELOG.md)

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/BoxflowIT/boxcord.git
cd boxcord
yarn install
cd client && yarn install && cd ..

# 2. Setup local environment (Docker required)
./scripts/dev-setup.sh

# 3. Generate authentication tokens
node scripts/generate-dev-tokens.cjs

# 4. Start development
yarn dev              # Backend (Terminal 1)
cd client && yarn dev # Frontend (Terminal 2)
```

**Open:** http://localhost:5173

**🔐 Login:** Use mock token from step 3 in browser localStorage (see [DEVELOPMENT.md](docs/DEVELOPMENT.md#-authentication-local-development))

**📚 Full guide:** [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## ✨ Features

### 💬 Messaging & Communication
- **Real-time messaging** via WebSocket (Socket.io)
- **Direct Messages (DMs)** - Private 1-on-1 conversations
- **@Mentions** - Tag users with autocomplete
- **Emoji reactions** - React with 1000+ emojis via full emoji picker
- **Quick reactions** - 5 common reactions (👍 ❤️ 😂 🎉 🔥) plus custom picker
- **Message formatting** - Markdown support with code blocks
- **File attachments** - Upload images, documents, videos
- **GIF support** - Search and send GIFs via Giphy (client-side)
- **Message editing & deletion** - Full message history tracking
- **Message forwarding** - Forward messages to other channels/DMs
- **Message pinning** - Pin important messages with real-time updates (#6)
- **Bookmarks/Saved messages** - Save messages for later with optimized cache (#6)
- **Rich media embeds** - OpenGraph/oEmbed for links
- **Typing indicators** - See when users are typing
- **Read receipts** - Track message read status
- **Slash commands** - Quick actions with `/` commands
- **Polls** - Create polls in channels with vote toggle, anonymous voting, and timed expiry
- **Channel Webhooks** - Bot integration with token-based message posting and management UI

### 🎤 Voice & Video
- **Voice channels** - Real-time voice communication with text chat
- **WebRTC peer-to-peer** - Direct audio/video streaming
- **AI noise suppression** - RNNoise AI for crystal-clear audio
- **Echo cancellation** - Automatic echo removal
- **Voice activity detection (VAD)** - Automatic noise gating
- **Professional audio pipeline** - Compression, limiting, gain control
- **Audio quality presets** - Low/Balanced/High/Studio quality presets (#226)
- **Device selection** - Choose input/output devices
- **Mic testing** - Test audio with real-time level monitoring
- **Video calls** - DM and group video with screen sharing
- **Call sounds** - Hangup sounds for all call end scenarios (reject, hangup, timeout) (#6)
- **Video quality switching** - Dynamic 360p/480p/720p/1080p selection
- **Flexible video windows** - Minimize, float, resize, drag, Picture-in-Picture
- **Voice channel text chat** - Integrated messaging in voice channels

**📖 See:** [docs/VOICE_ARCHITECTURE.md](docs/VOICE_ARCHITECTURE.md)

### 🧵 Threads
- **Thread conversations** - Create threads from any channel message
- **Thread search** - Server-side and client-side thread search
- **Thread archiving/resolving** - Mark threads as archived or resolved
- **Thread analytics** - Per-thread and channel-level statistics
- **Thread notifications** - Bell icon with real-time notification panel
- **Thread mentions** - @mention users in thread replies with push notifications
- **Thread file attachments** - Upload files in thread replies
- **Thread follow/unfollow** - Auto-follow on reply, unread count badges

**📖 See:** [docs/THREADS.md](docs/THREADS.md)

### 🌍 Workspaces & Channels
- **Multiple workspaces** - Organize teams separately
- **Text channels** - Topic-specific conversations
- **Voice channels** - Real-time audio rooms
- **Channel permissions** - Granular access control
- **Workspace invites** - Invite users via shareable links

### 👥 User Management
- **User profiles** - Customizable with bio, avatar, status
- **Online status** - Real-time presence tracking (Online/Away/DND/Offline)
- **Custom status** - Set status text and emoji
- **Member list** - See all workspace members with status
- **User search** - Find users quickly
- **Role-based permissions** - Admin, Staff, Member roles

### 🛡️ Moderation & Admin
- **Kick users** - Remove users from workspace
- **Ban users** - Permanently ban with reason tracking
- **Role management** - Promote/demote users
- **Audit logs** - Track all moderation actions
- **Channel permissions** - Control who can access channels

### 🌐 Internationalization (i18n)
- **Multi-language support** - English 🇬🇧 and Swedish 🇸🇪
- **Live language switching** - Change language on the fly
- **Persistent preferences** - Saves language choice

**📖 See:** [docs/I18N.md](docs/I18N.md)

### 🔔 Notifications
- **Web Push Notifications** - Browser notifications for mentions/DMs
- **Email notifications** - Via SendGrid (optional)
- **Notification settings** - Granular control per channel
- **Sound effects** - Audio cues for events
- **Custom notification sounds** - 5 sound types: Default, Chime, Bell, Pop, Ding (#226)
- **Sound preview** - Test notification sounds before selecting (#226)

### ⚡ Performance & Optimization
- **Redis caching** - 70-90% faster cached queries (optional)
- **Prisma 6** - 30-50% faster database queries
- **Connection pooling** - Efficient database connections
- **WebSocket-first architecture** - Minimal HTTP overhead
- **React Query caching** - Discord-style Infinity staleTime with WebSocket cache updates
- **Batch user fetching** - `POST /users/batch` replaces N+1 individual user requests
- **Derived data** - Bookmark status derived from list, no per-message API calls
- **Centralized API service** - All HTTP through `api.ts` with auto auth and 401 logout
- **Targeted cache updates** - Socket events use `setQueryData` instead of refetch
- **Debounced embeds** - 500ms debounce on embed parsing requests
- **Optimistic updates** - Instant UI feedback
- **Infinite scroll** - Efficient message pagination

**📖 See:** [docs/PERFORMANCE_OPTIMIZATIONS.md](docs/PERFORMANCE_OPTIMIZATIONS.md) | [docs/CACHING.md](docs/CACHING.md)

### 🔒 Security
- **AWS Cognito authentication** - Enterprise-grade auth
- **JWT tokens** - Secure session management
- **XSS protection** - Sanitized user input
- **CORS configuration** - Controlled cross-origin access
- **Rate limiting** - API abuse protection
- **Content Security Policy** - Browser-level security

### 🎨 UI/UX
- **Discord-inspired design** - Familiar and intuitive
- **Theme customization** - Dark/Medium/Light themes with persistent settings (#225, #6)
- **Message density** - Compact/Cozy/Spacious spacing (#225)
- **Responsive layout** - Mobile, tablet, desktop
- **Keyboard shortcuts** - 17+ customizable shortcuts (#227)
  - Navigation: Alt+↑/↓ (channel navigation), Ctrl+K (search)
  - Voice: Ctrl+Shift+M/D/V/S/L (mute/deafen/video/screen/leave)
  - Messaging: Ctrl+U/E/P (upload/emoji/pin)
  - Quick reactions: 1-5 keys (👍❤️😂🎉🔥)
- **Custom keyboard shortcuts** - Fully customizable with conflict detection (#227)
- **Advanced settings** - Appearance, Audio, Video, Notifications, Privacy, Keybinds, Account tabs
- **High contrast mode** - Enhanced contrast for accessibility (#225)
- **Reduced motion** - Minimize animations for accessibility (#225)
- **Smooth animations** - Polished interactions
- **TailwindCSS** - Modern utility-first styling

**📖 See:** [docs/SETTINGS_AND_SHORTCUTS.md](docs/SETTINGS_AND_SHORTCUTS.md)

## Tech Stack

- **Backend:** Fastify, Socket.io, Prisma, PostgreSQL
- **Frontend:** React 18, Vite, TailwindCSS, Zustand
- **Auth:** AWS Cognito (shared with Boxtime)
- **Real-time:** WebSocket (Socket.io) with optimistic updates
- **Caching:** Redis (optional) + React Query
- **Voice:** WebRTC with RNNoise AI
- **Files:** AWS S3 or local storage
- **i18n:** react-i18next (English, Swedish)
- **Architecture:** Onion Architecture (same as Boxtime)

## Structure

```text
boxcord/
├── src/                      # Backend
│   ├── 00-core/              # Shared types, constants, errors
│   ├── 01-domain/            # Entities, domain logic
│   ├── 02-application/       # Services, use cases
│   ├── 03-infrastructure/    # Database, external APIs
│   └── apps/api/             # Fastify API + Socket.io
├── client/                   # React frontend
├── prisma/                   # Database schema
└── docker-compose.yml        # Local PostgreSQL
```

## Getting Started

### 1. Start Database

```bash
docker compose up -d
```

### 2. Backend

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma:generate

# Run migrations
yarn prisma:migrate-dev

# Start development server
yarn dev
```

Backend runs on <http://localhost:3001>

### 3. Frontend

```bash
cd client

# Install dependencies
yarn install

# Start development server
yarn dev
```

Frontend runs on <http://localhost:5173>

## Production Deployment

For production setup including Sentry, S3, email notifications, and scaling:

**📖 See:** [docs/PRODUCTION.md](docs/PRODUCTION.md)

| Environment | URL | Deploy trigger |
|-------------|-----|----------------|
| **Production** | `https://boxcord.boxflow.com` | Push to `main` |
| **Staging** | `https://staging.boxcord.boxflow.com` | Push to `develop` |

Quick production checklist:

- ✅ Configure all required environment variables
- ✅ Enable HTTPS
- ✅ Setup Sentry for error tracking
- ✅ Configure S3 for file storage (multi-server)
- ✅ Enable Redis caching
- ✅ Setup monitoring and alerts

## Documentation

### Quick Links
- 🎯 [**Features Overview**](docs/FEATURES.md) - Complete list of all features
- 📐 [Architecture Overview](docs/ARCHITECTURE.md) - WebSocket-first design, data flow
- 🧪 [Testing Guide](docs/TESTING.md) - Unit tests, E2E, load testing (K6)
- 🚀 [Production Deployment](docs/PRODUCTION.md) - AWS, Docker, environment setup

### Architecture & Design
- 📐 [Architecture Overview](docs/ARCHITECTURE.md) - WebSocket-first design, data flow
- 🎤 [Voice Architecture](docs/VOICE_ARCHITECTURE.md) - WebRTC, RNNoise AI, audio pipeline
- 💾 [Caching Strategy](docs/CACHING.md) - React Query, Redis, optimization

### Features & Integrations
- 🎯 [**Features Overview**](docs/FEATURES.md) - Complete list of all features
- 🎨 [GIF Support](docs/GIF_SUPPORT.md) - Giphy integration setup and usage
- 🌍 [Internationalization](docs/I18N.md) - Multi-language support (en, sv)

### Performance & Testing
- ⚡ [Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md) - Prisma 6, Redis, benchmarks
- 🧪 [Testing Guide](docs/TESTING.md) - Unit tests, E2E, load testing (K6)

### Production & Operations
- 🚀 [Production Deployment](docs/PRODUCTION.md) - AWS, Docker, environment setup
- 📊 [Scaling Strategy](docs/SCALING_STRATEGY.md) - Horizontal scaling, load balancing
- 💾 [Database Optimization](docs/DATABASE_INDEX_OPTIMIZATION.md) - Indexes, query optimization
- 🔄 [Backup & Recovery](docs/BACKUP_RECOVERY.md) - Database backups, disaster recovery

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Required
DATABASE_URL="postgresql://boxcord:boxcord@localhost:5433/boxcord"
PORT=3001
JWT_SECRET=your-secret-key-here
BOXTIME_API_URL=http://localhost:3000
COGNITO_USER_POOL_ID=eu-north-1_xxxxx
COGNITO_CLIENT_ID=your-client-id
VAPID_PUBLIC_KEY=your-vapid-key
VAPID_PRIVATE_KEY=your-vapid-key
VAPID_SUBJECT=mailto:support@boxflow.com

# Optional - Production Features
REDIS_URL=redis://localhost:6379           # Enable Redis caching
SENTRY_DSN=https://...                     # Backend error tracking
AWS_S3_BUCKET=boxcord-uploads              # Cloud file storage
AWS_ACCESS_KEY_ID=...                      # AWS credentials
AWS_SECRET_ACCESS_KEY=...
SENDGRID_API_KEY=...                       # Email notifications
SENDGRID_FROM_EMAIL=noreply@boxflow.com
```

## Boxtime Integration

The chat uses the same Cognito pool as Boxtime for authentication. Users log in with their existing Boxtime accounts.

### Fetch User Info from Boxtime

```typescript
import { boxtimeService } from './02-application/services/boxtime.service';

// Get current user
const user = await boxtimeService.getCurrentUser(token);

// Search users for @mentions
const users = await boxtimeService.searchUsers('john', token);
```

## WebSocket Events

### Client → Server

#### Channel Events
- `channel:join` - Join a channel room
- `channel:leave` - Leave a channel room
- `message:send` - Send message to channel
- `message:edit` - Edit existing message
- `message:delete` - Delete message
- `message:typing` - Typing indicator
- `message:reaction:add` - Add emoji reaction
- `message:reaction:remove` - Remove emoji reaction
- `message:pin` - Pin message to channel
- `message:unpin` - Unpin message

#### DM Events
- `dm:join` - Join DM room
- `dm:leave` - Leave DM room
- `dm:send` - Send direct message
- `dm:edit` - Edit DM
- `dm:delete` - Delete DM
- `dm:typing` - DM typing indicator

#### Voice Events
- `voice:join` - Join voice channel
- `voice:leave` - Leave voice channel
- `voice:signal` - WebRTC signaling
- `voice:speaking` - Voice activity status

### Server → Client

#### Message Events
- `message:new` - New message received
- `message:updated` - Message was edited
- `message:deleted` - Message was deleted
- `message:pinned` - Message was pinned
- `message:unpinned` - Message was unpinned
- `message:typing` - User is typing
- `message:reaction:added` - Reaction added
- `message:reaction:removed` - Reaction removed

#### Channel/Workspace Events
- `channel:created` - New channel created
- `channel:updated` - Channel settings changed
- `channel:deleted` - Channel removed
- `workspace:updated` - Workspace settings changed

#### User Events
- `user:presence` - User online status changed
- `user:status` - User status updated
- `user:joined` - User joined workspace
- `user:left` - User left workspace

#### Voice Events
- `voice:user:joined` - User joined voice channel
- `voice:user:left` - User left voice channel
- `voice:signal` - WebRTC signaling data
- `voice:speaking:start` - User started speaking
- `voice:speaking:stop` - User stopped speaking

#### Poll Events
- `poll:created` - New poll created in channel
- `poll:voted` - Vote cast/toggled on poll (includes voter IDs for per-user hasVoted; omitted for anonymous polls)
- `poll:ended` - Poll ended (by creator or expiry)
- `poll:deleted` - Poll deleted (also emits `message:delete` to remove the poll message)

## API Endpoints

### Authentication & Users
| Method | Path                      | Description                  |
| ------ | ------------------------- | ---------------------------- |
| GET    | /api/v1/health           | Health check                 |
| GET    | /api/v1/users/me         | Get current user             |
| GET    | /api/v1/users/:id        | Get user by ID               |
| PATCH  | /api/v1/users/me         | Update profile               |
| DELETE | /api/v1/users/me         | Delete account               |
| GET    | /api/v1/users/search     | Search users                 |
| PATCH  | /api/v1/users/:id/role   | Update user role (admin)     |

### Workspaces
| Method | Path                           | Description                  |
| ------ | ------------------------------ | ---------------------------- |
| GET    | /api/v1/workspaces            | List user's workspaces       |
| POST   | /api/v1/workspaces            | Create workspace             |
| GET    | /api/v1/workspaces/:id        | Get workspace details        |
| PATCH  | /api/v1/workspaces/:id        | Update workspace             |
| DELETE | /api/v1/workspaces/:id        | Delete workspace             |
| GET    | /api/v1/workspaces/:id/members| List workspace members       |

### Channels
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/channels                 | List channels (by workspace) |
| POST   | /api/v1/channels                 | Create channel               |
| GET    | /api/v1/channels/:id             | Get channel details          |
| PATCH  | /api/v1/channels/:id             | Update channel               |
| DELETE | /api/v1/channels/:id             | Delete channel               |
| POST   | /api/v1/channels/:id/read        | Mark channel as read         |

### Messages
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/messages                 | Fetch messages (paginated)   |
| POST   | /api/v1/messages                 | Create message               |
| PATCH  | /api/v1/messages/:id             | Edit message                 |
| DELETE | /api/v1/messages/:id             | Delete message               |
| POST   | /api/v1/messages/:id/forward     | Forward message              |
| POST   | /api/v1/messages/:id/pin         | Pin message                  |
| DELETE | /api/v1/messages/:id/pin         | Unpin message                |
| GET    | /api/v1/messages/search          | Search messages              |

### Direct Messages (DMs)
| Method | Path                                   | Description                  |
| ------ | -------------------------------------- | ---------------------------- |
| GET    | /api/v1/dm/channels                   | List DM channels             |
| POST   | /api/v1/dm/channels                   | Create/get DM channel        |
| GET    | /api/v1/dm/channels/:id/messages      | Fetch DM messages            |
| POST   | /api/v1/dm/channels/:id/messages      | Send DM                      |
| PATCH  | /api/v1/dm/messages/:id               | Edit DM                      |
| DELETE | /api/v1/dm/messages/:id               | Delete DM                    |
| POST   | /api/v1/dm/channels/:id/read          | Mark DM as read              |

### Reactions
| Method | Path                                   | Description                  |
| ------ | -------------------------------------- | ---------------------------- |
| POST   | /api/v1/reactions/messages/:id        | Add reaction to message      |
| DELETE | /api/v1/reactions/messages/:id/:emoji | Remove reaction              |
| GET    | /api/v1/reactions/messages/:id        | Get message reactions        |
| GET    | /api/v1/reactions/quick               | Get quick reaction emojis    |

### Bookmarks
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/bookmarks                | List user's bookmarks        |
| POST   | /api/v1/bookmarks                | Add bookmark                 |
| DELETE | /api/v1/bookmarks/:id            | Remove bookmark              |
| GET    | /api/v1/bookmarks/count          | Get bookmark count           |
| PATCH  | /api/v1/bookmarks/:id/note       | Update bookmark note         |

### Polls
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | /api/v1/polls                    | Create poll (with message)   |
| GET    | /api/v1/polls/:id                | Get poll by ID               |
| GET    | /api/v1/polls/message/:messageId | Get poll by message ID       |
| POST   | /api/v1/polls/:id/vote           | Vote/toggle vote on poll     |
| POST   | /api/v1/polls/:id/end            | End poll early (creator only)|
| DELETE | /api/v1/polls/:id                | Delete poll (creator only)   |

### Invites
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/invites                  | List workspace invites       |
| POST   | /api/v1/invites                  | Create invite link           |
| DELETE | /api/v1/invites/:code            | Revoke invite                |
| GET    | /api/v1/invites/:code/preview    | Preview invite               |
| POST   | /api/v1/invites/:code/accept     | Accept invite                |

### Moderation
| Method | Path                                   | Description                  |
| ------ | -------------------------------------- | ---------------------------- |
| POST   | /api/v1/workspaces/:id/kick           | Kick user from workspace     |
| POST   | /api/v1/workspaces/:id/ban            | Ban user from workspace      |
| POST   | /api/v1/workspaces/:id/unban          | Unban user                   |
| GET    | /api/v1/workspaces/:id/audit-logs     | Get audit logs               |

### File Uploads
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | /api/v1/upload                   | Upload file (multipart)      |
| POST   | /api/v1/files                    | Generic file upload          |
| POST   | /api/v1/files/messages/:id       | Message file upload          |
| POST   | /api/v1/files/dm/:id             | DM file upload               |
| GET    | /uploads/:filename               | Get uploaded file            |

### Users (additional)
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | /api/v1/users/batch              | Batch fetch users by IDs     |
| GET    | /api/v1/users/online             | Get online users list        |
| PATCH  | /api/v1/users/me/status          | Update custom status         |
| PATCH  | /api/v1/users/me/dnd             | Update DND mode              |

### Voice
| Method | Path                                        | Description                  |
| ------ | ------------------------------------------- | ---------------------------- |
| GET    | /api/v1/voice/channels/:id/users           | Get voice channel users      |
| GET    | /api/v1/voice/workspaces/:id/voice-users   | Get workspace voice users    |

### Permissions
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/permissions               | Get channel permissions      |
| GET    | /api/v1/permissions/me            | Get current user permissions |
| GET    | /api/v1/permissions/check         | Check specific permission    |
| POST   | /api/v1/permissions               | Set permissions              |
| DELETE | /api/v1/permissions               | Reset permissions            |

### Embeds
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | /api/v1/embeds/parse             | Parse URL embeds from content|

### Search
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/search                   | Global search (advanced)     |
| GET    | /api/v1/search/messages          | Search channel messages      |
| GET    | /api/v1/search/dms               | Search DMs                   |

**Search query parameters:**
| Parameter      | Type    | Description                        |
| -------------- | ------- | ---------------------------------- |
| q              | string  | Search query (2-200 chars)         |
| type           | string  | `channel`, `dm`, or `all`          |
| channelId      | uuid    | Filter by specific channel         |
| workspaceId    | uuid    | Filter by workspace                |
| authorId       | string  | Filter by author                   |
| before         | ISO8601 | Messages before date               |
| after          | ISO8601 | Messages after date                |
| hasAttachment  | boolean | Only messages with attachments     |
| cursor         | string  | Pagination cursor                  |
| limit          | number  | Results per page (1-100)           |

### Message Templates
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | /api/v1/templates                | List user's templates        |
| POST   | /api/v1/templates                | Create template              |
| PATCH  | /api/v1/templates/:id            | Update template              |
| DELETE | /api/v1/templates/:id            | Delete template              |

### Channel Webhooks
| Method | Path                                            | Description                  |
| ------ | ----------------------------------------------- | ---------------------------- |
| GET    | /api/v1/channel-webhooks/:channelId             | List channel webhooks        |
| POST   | /api/v1/channel-webhooks/:channelId             | Create webhook               |
| PATCH  | /api/v1/channel-webhooks/manage/:id             | Update webhook               |
| DELETE | /api/v1/channel-webhooks/manage/:id             | Delete webhook               |
| POST   | /api/v1/channel-webhooks/manage/:id/regenerate  | Regenerate token             |
| POST   | /api/webhooks/execute/:token                    | Execute webhook (no auth)    |

### Push Notifications
| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| POST   | /api/v1/push/subscribe           | Subscribe to push            |
| POST   | /api/v1/push/unsubscribe         | Unsubscribe from push        |

## Code Quality

### Production Features 🚀

All production-ready features are **optional** and automatically enabled when configured:

#### **Structured Logging** (Pino)

- JSON logs in production, pretty-printed in development
- Automatic request/response logging
- Slow query detection
- Error context tracking

#### **Error Tracking** (Sentry)

- Backend error monitoring and alerting
- Performance monitoring with traces
- User context and breadcrumbs
- Automatic error deduplication

**Setup:**

```bash
# Set in .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

#### **Cloud File Storage** (AWS S3)

- Scalable file uploads for multi-server deployments
- Automatic file cleanup
- Presigned URLs for secure access
- Falls back to local storage if not configured

**Setup:**

```bash
# Set in .env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=boxcord-uploads
```

#### **Email Notifications** (SendGrid)

- @mention notifications
- Direct message alerts
- Workspace invitations
- Customizable templates

**Setup:**

```bash
# Set in .env
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@boxflow.com
```

#### **Graceful Shutdown**

- Handles SIGTERM/SIGINT for Kubernetes/ECS
- Closes connections cleanly
- Prevents data loss during deployments
- 30-second timeout for force exit

#### **CI/CD Pipeline**

Full automated pipeline with parallel jobs for fast feedback (~3 min):

| Job | Time | What it checks |
|-----|------|----------------|
| **Test & Lint** | ~2 min | TypeScript, ESLint, 174 unit/integration tests (backend + frontend) |
| **E2E Tests** | ~3 min | Playwright browser tests (health, API, Swagger) |
| **Security Audit** | ~8 sec | `yarn audit` for known vulnerabilities |

**Workflows:**
- **CI** ([ci.yml](.github/workflows/ci.yml)) — Runs on push to `main`/`develop` and PRs
- **Deploy Staging** ([deploy-staging.yml](.github/workflows/deploy-staging.yml)) — Auto-deploy to AWS staging on `develop` push
- **Deploy Preview** ([deploy-preview.yml](.github/workflows/deploy-preview.yml)) — Preview environments for PRs
- **Smoke Test** ([smoke-test.yml](.github/workflows/smoke-test.yml)) — Post-deploy health checks (5 checks)
- **Version Bump** — Auto-bump on merge to `main`

**Git Hooks (Husky):**
- `pre-commit` — lint-staged (fast, <2s)
- `commit-msg` — conventional commit format enforcement
- `pre-push` — full validation: typecheck + lint + tests + client build

**Optimizations:**
- E2E runs in parallel with Test & Lint (not sequential)
- Playwright browser cache (~300MB saved per run)
- Yarn dependency cache

**Run all checks locally before pushing:**

```bash
yarn validate
```

**See:** [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | [.github/workflows/](.github/workflows/)

### Recent Improvements

#### CI/CD Pipeline Overhaul (v1.9.0) 🔧

- ✅ **Parallel CI jobs** — E2E runs alongside Test & Lint (~3 min total vs ~5 min sequential)
- ✅ **Playwright browser caching** — ~300MB chromium cached between runs
- ✅ **E2E tests in CI** — Health check, API, Swagger UI tests with auth-test exclusion
- ✅ **Deploy staging workflow** — Auto-deploy to AWS staging on develop push
- ✅ **Deploy preview environments** — PR-based preview deployments with auto-cleanup
- ✅ **Post-deploy smoke tests** — 5-check health verification after production deploys
- ✅ **Slimmed pre-commit** — Only lint-staged (no tests), faster commits
- ✅ **Pre-push validation** — Full typecheck + lint + tests + client build
- ✅ **Branch protection script** — Automated setup for main/develop rules

#### Client-Side Request Optimization (v1.7.1) 🚀

- ✅ **Batch user fetching** — `POST /users/batch` replaces N+1 individual requests
- ✅ **React Query for threads** — 18 thread functions migrated to `api` service
- ✅ **Targeted cache updates** — Socket `user:update` uses `setQueryData` (not `invalidateQueries`)
- ✅ **Derived bookmark status** — No per-message `GET /bookmarks/check` calls
- ✅ **ForwardMessageModal fix** — Uses cached React Query hooks (no N+1 `getChannels` loop)
- ✅ **staleTime additions** — Bookmarks (30s), Permissions (30s), Voice (10s), Pinned (30s)
- ✅ **API service migration** — All hooks use centralized `api.ts` (auth, 401 logout)
- ✅ **Debounced embeds** — 500ms debounce on `POST /embeds/parse`
- ✅ **Overall:** 60-75% fewer API calls on navigation

**📖 See:** [docs/CACHING.md](docs/CACHING.md)

#### Server-Side Performance Optimizations 🚀

- ✅ **Prisma 6 Upgrade:** 30-50% faster queries
- ✅ **Redis Caching:** 70-90% faster for cached queries (optional, falls back to in-memory)
- ✅ **Connection Pooling:** 30-50% reduction in connection overhead
- ✅ **Selective Field Fetching:** 30-40% less data transfer
- ✅ **Overall:** 50-85% server-side performance improvement

**Quick Start with Redis:**

```bash
# Start PostgreSQL + Redis
docker-compose -f docker-compose.dev.yml up -d

# Configure in .env
REDIS_URL=redis://localhost:6379
PRISMA_QUERY_CACHE_TTL=60
```

**📖 Full Documentation:** [docs/PERFORMANCE_OPTIMIZATIONS.md](docs/PERFORMANCE_OPTIMIZATIONS.md)

#### className Refactoring (Completed)

- ✅ All 61 components migrated from template literals to `cn()` utility
- ✅ Consistent className composition across entire codebase
- ✅ Improved code readability and maintainability
- ✅ Zero TypeScript/ESLint errors maintained
- ✅ 61/61 tests passing (100% coverage maintained)

**Pattern Example:**

```typescript
// Before:
className={`base ${condition ? 'true' : 'false'} ${className}`}

// After:
className={cn('base', condition && 'true', !condition && 'false', className)}
```

**📖 Component Documentation:** [client/COMPONENTS.md](client/COMPONENTS.md)

**📖 Testing Guide:** [docs/TESTING.md](docs/TESTING.md)
