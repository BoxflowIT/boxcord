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

# Seed with test data (optional)
yarn seed
```

### 5. Start Development Server

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

### 6. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Docs:** http://localhost:3001/docs
- **Prisma Studio:** `yarn db:studio` → http://localhost:5555

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
│   ├── 00-core/           # Core utilities (logger, config, errors)
│   ├── 01-domain/         # Domain entities
│   ├── 02-application/    # Business logic & services
│   ├── 03-infrastructure/ # Database, cache, external APIs
│   └── apps/api/          # Fastify API server
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API clients, WebSocket
│   │   ├── store/         # Zustand state management
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
