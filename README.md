# Boxcord

Discord-like chat application for Boxflow, integrated with Boxtime.

## Tech Stack

- **Backend:** Fastify, Socket.io, Prisma, PostgreSQL
- **Frontend:** React, Vite, TailwindCSS, Zustand
- **Auth:** AWS Cognito (shared with Boxtime)
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

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="postgresql://boxcord:boxcord@localhost:5433/boxcord"
PORT=3001
JWT_SECRET=your-secret-key-here
BOXTIME_API_URL=http://localhost:3000
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

- `channel:join` - Join channel
- `channel:leave` - Leave channel
- `message:send` - Send message
- `message:edit` - Edit message
- `message:delete` - Delete message
- `channel:typing` - Typing indicator

### Server → Client

- `message:new` - New message
- `message:edit` - Message updated
- `message:delete` - Message deleted
- `channel:typing` - User typing
- `user:online` - User online
- `user:offline` - User offline

## API Endpoints

| Method | Path                 | Description           |
| ------ | -------------------- | --------------------- |
| GET    | /api/v1/workspaces   | List workspaces       |
| POST   | /api/v1/workspaces   | Create workspace      |
| GET    | /api/v1/channels     | List channels         |
| POST   | /api/v1/channels     | Create channel        |
| GET    | /api/v1/messages     | Fetch messages        |
| POST   | /api/v1/messages     | Create message        |
| GET    | /api/v1/users/me     | Current user          |
| GET    | /api/v1/users/search | Search users          |

## Code Quality

### Recent Improvements

**🎨 className Refactoring (Completed)**
- ✅ All 61 components migrated from template literals to `cn()` utility
- ✅ Consistent className composition across entire codebase
- ✅ Improved code readability and maintainability
- ✅ Zero TypeScript/ESLint errors maintained
- ✅ 34/34 tests passing (100% coverage maintained)

**Pattern Example:**
```typescript
// Before:
className={`base ${condition ? 'true' : 'false'} ${className}`}

// After:
className={cn('base', condition && 'true', !condition && 'false', className)}
```

See [COMPONENTS.md](client/COMPONENTS.md) for detailed component documentation.

## Next Steps

- [ ] Implement Cognito callback for production auth
- [ ] Add file upload (S3)
- [x] Implement @mentions with Boxtime users
- [x] Add push notifications
- [x] Integrate with Boxtime webhooks for automatic messages
- [x] Add chatbot support
- [x] Refactor all components to use cn() utility
