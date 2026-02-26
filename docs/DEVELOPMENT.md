# Development Guide

Complete guide for setting up and running Boxcord locally.

## 📋 Prerequisites

- **Node.js** >= 20.0.0
- **Yarn** (package manager)
- **Docker & Docker Compose** (for PostgreSQL and Redis)
- **Git**

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/BoxflowIT/boxcord.git
cd boxcord
yarn install
cd client && yarn install && cd ..
```

### 2. Setup Environment

```bash
# Copy local development environment file
cp .env.local.example .env

# Or if you have production access:
# cp .env .env.backup  # Backup production config
# cp .env.local.example .env
```

⚠️ **IMPORTANT:** Never develop against production database!

### 3. Start Database & Redis

```bash
# Start Docker containers
yarn docker:up

# Verify containers are running
docker ps

# Should show:
# - boxcord-db (PostgreSQL on port 5433)
# - boxcord-redis (Redis on port 6379)
```

### 4. Setup Database

```bash
# Run migrations
yarn db:migrate

# Seed with comprehensive test data
yarn seed
```

This creates:
- **11 users** (1 super admin, 1 admin, 8 staff, 1 bot)
- **2 workspaces** with channels
- **20+ messages** with realistic conversations
- **Reactions, bookmarks, DMs, and pinned messages**

### 5. Get Authentication Token

For local development, we use **mock JWT tokens** (no Cognito login needed):

```bash
# Generate tokens for all seeded users
node scripts/generate-dev-tokens.cjs
```

**Quick Login (SUPER_ADMIN):**
1. Open http://localhost:5173 in browser
2. Open DevTools (F12) → Application → Local Storage
3. Add key: `auth-token`
4. Value: Token from script output (admin@boxflow.se)
5. Refresh page → You're logged in! 🎉

See [Authentication section](#-authentication-local-development) for details.

### 6. Start Development Server

```bash
# Terminal 1: Backend
yarn dev

# Terminal 2: Frontend
cd client
yarn dev
```

**Or start everything at once:**

```bash
yarn dev:full  # Starts Docker + Backend (add frontend separately)
```

### 7. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/docs
- **Prisma Studio:** `yarn db:studio` → http://localhost:5555

---

## 🔐 Authentication (Local Development)

### Mock JWT Tokens

For local development, **authentication is simplified** using mock tokens. No Cognito login required!

### Generate Tokens

```bash
node scripts/generate-dev-tokens.cjs
```

This generates tokens for all 10 seeded users.

### Login Method 1: Browser localStorage

**Easiest method for frontend development:**

1. Start frontend: `cd client && yarn dev`
2. Open http://localhost:5173
3. Open DevTools (F12)
4. Navigate to: **Application** → **Local Storage** → `http://localhost:5173`
5. Click **+** to add new key
6. Key: `auth-token`
7. Value: Copy token from script output
8. Refresh page (F5)

**Recommended starter user:**
- Email: `admin@boxflow.se`
- Role: `SUPER_ADMIN`
- Full access to all features

### Login Method 2: API Requests

For backend testing or scripts:

```bash
# Test API with mock token
TOKEN="mock.eyJzdWIiOiJ1c2VyLWFkbWluIi..."

curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/v1/users/me
```

### Available Test Users

After running `yarn seed`, these users are available:

| Email | Role | Description |
|-------|------|-------------|
| admin@boxflow.se | SUPER_ADMIN | Full system access |
| erik.johansson@boxflow.se | ADMIN | Workspace management |
| anna.andersson@boxflow.se | STAFF | Backend Developer |
| maria.svensson@boxflow.se | STAFF | Frontend Developer |
| jonas.berg@boxflow.se | STAFF | DevOps Engineer |
| lisa.karlsson@boxflow.se | STAFF | UX Designer |
| david.nilsson@boxflow.se | STAFF | Product Manager |
| sofia.larsson@boxflow.se | STAFF | QA Engineer |
| peter.olsson@boxflow.se | STAFF | Staff member |
| emma.gustafsson@boxflow.se | STAFF | Customer Success |

### Production Authentication

In production, Boxcord uses **AWS Cognito** for authentication:
- Users log in with email/password through Cognito
- Real JWT tokens are issued
- Mock tokens are **disabled** in production

---

## 🌱 Database Seeding

### Comprehensive Test Data

The seed script (`prisma/seed.ts`) creates realistic development data:

```bash
yarn seed
```

**What gets created:**
- ✅ 11 users with realistic Swedish names
- ✅ 2 workspaces (Boxflow HQ, Development)
- ✅ 7 channels with descriptions
- ✅ 20+ messages with conversations
- ✅ 9 reactions on messages
- ✅ 2 pinned messages
- ✅ 3 bookmarks
- ✅ 2 DM channels with messages

### Reset and Re-seed

```bash
# Complete reset (deletes all data!)
yarn docker:reset

# Re-run migrations
yarn db:migrate

# Seed fresh data
yarn seed
```

### Why Seed Data?

**GDPR-Safe Development:**
- ❌ Never use production data locally (GDPR violation!)
- ✅ Use generated test data instead
- ✅ Realistic conversations without privacy concerns
- ✅ Consistent data across all developers

**Testing Features:**
- Test reactions, bookmarks, DMs
- See pinned messages in action
- Test with different user roles
- Realistic message threads

---

## 🐳 Docker Commands

### Basic Operations

```bash
# Start containers
yarn docker:up

# Stop containers
yarn docker:down

# View logs
yarn docker:logs

# Restart containers
yarn docker:restart

# Reset everything (⚠️ deletes all data!)
yarn docker:reset
```

### Database Commands

```bash
# Run migrations
yarn db:migrate

# Reset database (⚠️ deletes all data!)
yarn db:reset

# Open Prisma Studio
yarn db:studio

# Generate Prisma Client
yarn prisma:generate
```

---

## 📁 Project Structure

```
boxcord/
├── src/                    # Backend source code
│   ├── 00-core/           # Core utilities (logger, config, errors, constants)
│   ├── 01-domain/         # Domain entities
│   ├── 02-application/    # Business logic & services
│   │   └── services/      # thread.service, message.service, etc.
│   ├── 03-infrastructure/ # Database, cache, external APIs
│   └── apps/api/          # Fastify API server
│       └── routes/        # thread.routes, message.routes, etc.
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── thread/    # Thread sidebar, replies, composer, etc.
│   │   ├── hooks/         # Custom hooks (useThreadSocket, useThreads)
│   │   ├── services/      # API clients, WebSocket
│   │   ├── store/         # Zustand state management (thread.ts)
│   │   └── utils/         # Utilities
│   └── tests/             # Frontend tests
├── prisma/                 # Database schema & migrations
├── tests/                  # Backend tests
├── docs/                   # Documentation
└── docker-compose.yml      # Local development services
```

---

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage
```

### Frontend Tests

```bash
cd client

# Run all tests
yarn test

# Watch mode
yarn test:watch

# Coverage
yarn test:coverage
```

### E2E Tests

```bash
# Run E2E tests
yarn test:e2e

# Interactive mode
yarn test:e2e:ui
```

### Load Testing

```bash
# K6 load test
yarn test:load
```

---

## 🔧 Development Workflow

### Feature Development

1. **Create feature branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test:**
   ```bash
   # Run type checking
   yarn typecheck
   
   # Run linting
   yarn lint
   
   # Run tests
   yarn test
   ```

3. **Commit using conventional commits:**
   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   ```

4. **Push and create PR:**
   ```bash
   git push -u origin feature/your-feature-name
   ```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🐛 Troubleshooting

### Docker Issues

**Containers won't start:**
```bash
# Check if ports are in use
lsof -i :5433  # PostgreSQL
lsof -i :6379  # Redis

# Stop conflicting services or change ports in docker-compose.yml
```

**Database connection errors:**
```bash
# Check if containers are healthy
docker ps

# View logs
docker compose logs postgres
docker compose logs redis

# Restart containers
yarn docker:restart
```

**Reset everything:**
```bash
# Nuclear option - removes all data!
yarn docker:reset
yarn db:migrate
yarn seed
```

### Database Migration Issues

**Migrations out of sync:**
```bash
# Reset and re-run
yarn db:reset

# Or mark as applied without running
npx prisma migrate resolve --applied <migration_name>
```

**Prisma Client out of sync:**
```bash
yarn prisma:generate
```

### Port Conflicts

**Change backend port:**
```env
# .env
PORT=3002  # Instead of 3001
```

**Change frontend port:**
```bash
# client/vite.config.ts
server: {
  port: 5174  # Instead of 5173
}
```

### Redis Connection Issues

**Connection refused:**
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec -it boxcord-redis redis-cli ping
# Should return: PONG
```

---

## 🌍 Environment Variables

### Required for Development

```env
DATABASE_URL="postgresql://boxcord:boxcord@localhost:5433/boxcord"
PORT=3001
NODE_ENV=development
JWT_SECRET=local-dev-secret-minimum-twenty-characters-long
```

### Optional but Recommended

```env
REDIS_URL=redis://localhost:6379
BOXTIME_API_URL=http://localhost:3000
VITE_GIPHY_API_KEY=your_key_here
```

### Production Only

```env
SENTRY_DSN=
AWS_ACCESS_KEY_ID=
SENDGRID_API_KEY=
```

See [.env.local.example](.env.local.example) for complete list.

---

## 📚 Additional Resources

- [Contributing Guidelines](CONTRIBUTING.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Testing Guide](docs/TESTING.md)
- [Production Deployment](docs/PRODUCTION.md)

---

## 🤝 Getting Help

- **Questions?** See [docs/](docs/) or open a discussion
- **Found a bug?** Create an issue with reproduction steps
- **Security issue?** Email security@boxflow.se

---

**Happy coding! 🎉**
