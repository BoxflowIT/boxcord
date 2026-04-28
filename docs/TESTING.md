# Testing Guide

This document describes how to run various tests for the Boxcord application.

## Test Types

### 1. Unit Tests
Tests individual functions and services.

```bash
# Run all unit tests
yarn test

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch
```

**Current Status:** ✅ 197 passing (113 backend + 84 frontend)  
**Coverage:** Backend services, store, hooks, components

### 2. E2E Tests (Playwright)
End-to-end tests that simulate real user interactions.

```bash
# Run E2E tests (headless)
yarn test:e2e

# Run E2E tests with UI
yarn test:e2e:ui

# Run E2E tests in debug mode
yarn test:e2e --debug

# Run only non-auth tests (same as CI)
yarn test:e2e --grep-invert @auth
```

**Prerequisites (local):**
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Test database with seed data

**Environment Variables (E2E):**
- `FRONTEND_URL` — Override frontend URL (default: `http://localhost:5173`)
- `TEST_TOKEN_SECRET` — Prefix for mock auth tokens (default: `e2e-test-only`)

**CI Behavior:**
- Auth-dependent tests are tagged with `{ tag: '@auth' }` and excluded in CI (`--grep-invert @auth`)
- CI builds backend + client, then serves static files via `serve`
- Playwright chromium browser is cached between CI runs
- Health check accepts `not_configured` Redis status (no Redis in CI)
- Swagger UI test uses API request assertions (not browser rendering)

**Test Coverage:**
- ✅ Health checks (backend & frontend)
- ✅ API documentation (Swagger — HTML + OpenAPI JSON spec)
- ✅ Authentication flow (`@auth` — local only)
- ✅ Workspace navigation (`@auth` — local only)
- ✅ Messaging functionality (`@auth` — local only)
- ✅ Search interface (`@auth` — local only)
- ✅ User settings (`@auth` — local only)
- ✅ XSS protection verification (`@auth` — local only)
- ✅ File upload flows (`@auth` — local only)
- ✅ WebSocket real-time events (`@auth` — local only)
- ✅ Video window controls (`@auth` — local only)

**Test Files:**
- [`tests/e2e/user-flows.spec.ts`](../tests/e2e/user-flows.spec.ts) — Core flows
- [`tests/e2e/auth-flows.spec.ts`](../tests/e2e/auth-flows.spec.ts) — Auth flows
- [`tests/e2e/file-upload.spec.ts`](../tests/e2e/file-upload.spec.ts) — File uploads
- [`tests/e2e/websocket-realtime.spec.ts`](../tests/e2e/websocket-realtime.spec.ts) — WebSocket
- [`tests/e2e/video-window-controls.spec.ts`](../tests/e2e/video-window-controls.spec.ts) — Video

### 3. Load Tests (K6)
Performance tests that simulate concurrent users.

```bash
# Install K6 (first time)
sudo snap install k6

# Production load test suite (targets staging)
# Required env vars: TEST_USER_EMAIL, TEST_USER_PASSWORD
k6 run load-tests/health.js        # Baseline health check
k6 run load-tests/api-smoke.js     # Smoke test (5 VUs, 1 min)
k6 run load-tests/api-load.js      # Full load test (ramp to 50 VUs)
k6 run load-tests/spike.js         # Spike test / auto-scaling validation (100 VUs)

# Legacy load test (targets custom URL)
k6 run tests/load/api-load-test.js
API_URL=https://staging.boxcord.boxflow.com k6 run tests/load/api-load-test.js
```

**Test Scenarios:**
- 30% Health check monitoring (lightweight)
- 30% Read-heavy users (browsing)
- 30% Active users (mixed operations)
- 10% Power users (heavy load)

**Load Profile:**
1. Warm up: 50 users (30s)
2. Normal load: 100 users (3m)
3. High load: 200 users (1.5m)
4. Stress test: 500 users (1m)

**Latest Results** (Full 7-minute test, up to 500 concurrent users, **AFTER OPTIMIZATIONS**):
- ✅ **99.98% success rate** (64,705/64,712 checks passed)
- ✅ **0% HTTP error rate** (0 failed requests)
- ✅ **115 req/s** sustained throughput (+77% vs baseline)
- ✅ **p95: 17.76ms** (target: <500ms) - **TARGET ACHIEVED** 🎉
- ✅ **p99: 364.29ms** (target: <1s) - **TARGET ACHIEVED** 🎉
- ✅ **Health endpoint p95: 44.36ms** (target: <100ms) - **TARGET ACHIEVED** 🎉

**Performance Metrics:**
```
Optimized Test (500 peak users):
  http_req_duration: avg=16.8ms, p95=17.76ms, p99=364.29ms
  http_reqs: 48,482 total (~115 req/s)
  checks: 99.98% passed (64,705/64,712)
  iterations: 26,892 completed

Normal Load (100-200 users):
  http_req_duration: avg=~5ms, p95=~12ms
  checks: 99.9%+ passed
```

**Comparison - Before vs After Optimization:**
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| p95 | 5.75s | 17.76ms | **99.69% faster** |
| p99 | 6.03s | 364.29ms | **93.96% faster** |
| Average | 914ms | 16.8ms | **98.16% faster** |
| Health p95 | 5.84s | 44.36ms | **99.24% faster** |
| Throughput | 65 req/s | 115 req/s | **+77%** |
| Success | 98.68% | 99.98% | **+1.3%** |

**Conclusion:** System is production-ready for extreme load (500+ concurrent users) with all performance targets achieved. 

**📖 For optimization details, see:** [docs/PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)

**Test File:** [`tests/load/api-load-test.js`](../tests/load/api-load-test.js)

### 4. XSS Filtering Tests
Validates that XSS sanitization is working correctly.

```bash
# Run XSS filtering verification
node scripts/test-xss-filtering.cjs
```

**Test Coverage:**
- ✅ Script tag injection
- ✅ IMG tag with onerror
- ✅ Iframe tag injection
- ✅ Safe HTML preservation (bold, links)
- ✅ Nested object sanitization

**Results:** All 6 tests passing

## Development Workflow

### Pre-commit Hook
Automatically runs on `git commit`:
- Formats code with Prettier
- Lints with ESLint
- Only checks staged files

### Pre-push Hook
Automatically runs on `git push`:
- TypeScript type checking
- Full linting (backend + client)
- All unit tests
- Client E2E tests

## CI/CD Pipeline

The GitHub Actions CI workflow (`ci.yml`) runs on a **self-hosted macOS ARM64 runner** with 4 parallel jobs:

1. **Test & Lint** — PostgreSQL via Homebrew (`scripts/setup-postgres.sh`), TypeScript check, ESLint, unit tests (backend + client), client build
2. **Desktop Typecheck** — TypeScript check for the Electron desktop app
3. **E2E Tests** — Playwright (Chromium) with seeded test database, runs non-auth tests (`--grep-invert @auth`)
4. **Security Audit** — `npm audit` (high/critical only)

**Runner security:** All PR-triggered jobs include fork protection — PRs from forks are skipped on self-hosted runners to prevent arbitrary code execution.

**PostgreSQL setup:** Uses `scripts/setup-postgres.sh` (Homebrew PostgreSQL 16) instead of Docker services (not available on macOS runners).

## Test Files Structure

```
tests/
├── e2e/
│   └── user-flows.spec.ts       # Playwright E2E tests
├── load/
│   └── api-load-test.js         # K6 load tests (legacy)
├── services/                     # Backend unit tests
│   ├── chatbot.service.test.ts
│   ├── push.service.test.ts
│   ├── reaction.service.test.ts
│   ├── user.service.test.ts
│   ├── webhook.service.test.ts
│   └── workspace.service.test.ts
└── setup.ts                      # Test setup/mocks

load-tests/                        # Production load test suite
├── health.js                     # Health check baseline
├── api-smoke.js                  # API smoke test (5 VUs)
├── api-load.js                   # Full load test (50 VUs)
├── spike.js                      # Spike/auto-scaling test (100 VUs)
├── results/                      # JSON results (gitignored)
└── README.md                     # Usage documentation

client/tests/
├── components/                   # Frontend component tests
├── hooks/
├── services/
└── store/                        # State management tests
```

## Performance Targets

### Response Time Targets
- Health checks: p95 < 100ms
- API endpoints: p95 < 500ms
- API endpoints: p99 < 1000ms

### Reliability Targets
- Uptime: 99.9%
- Error rate: < 1%
- Success rate: > 99%

### Load Targets
- Concurrent users: 500+
- Requests/second: 100+
- Sustained load: 100 users for 10+ minutes

## Current Status Summary

| Test Type | Status | Coverage | Notes |
|-----------|--------|----------|-------|
| Unit Tests | ✅ Passing | 197 tests (113+84) | Backend services + frontend components |
| E2E Tests | ✅ Ready | 42+ scenarios | Playwright configured (user flows, auth flows, file uploads, WebSocket) |
| Load Tests | ✅ **OPTIMIZED** | 4 scenarios | All targets achieved (500+ users) |
| XSS Tests | ✅ Passing | 6 payloads | Sanitization active |
| Code Coverage | ✅ Configured | 70% threshold | Using v8 |

## Next Steps

### Current Development

1. **Load Testing Enhancements**
   - [x] ~~Optimize for extreme load (500+ users)~~ ✅ COMPLETED
   - [ ] Run load tests on staging environment before production deployment
   - [ ] Test WebSocket concurrent connections under load
   - [ ] Stress test with 1000+ concurrent users (requires horizontal scaling)

2. **Test Coverage Expansion**
   - [x] ~~Add authenticated E2E flows~~ ✅ COMPLETED (auth-flows.spec.ts - 11 test cases)
   - [x] ~~Test file upload/download flows~~ ✅ COMPLETED (file-upload.spec.ts - 10 test cases)
   - [x] ~~Test WebSocket real-time features~~ ✅ COMPLETED (websocket-realtime.spec.ts - 9 test cases)

3. **Performance Enhancements**
   - [x] ~~Database query optimization and indexing~~ ✅ COMPLETED (see [DATABASE_INDEX_OPTIMIZATION.md](./DATABASE_INDEX_OPTIMIZATION.md))
   - [x] ~~Redis caching layer~~ ✅ PARTIALLY IMPLEMENTED (cache configured, works when Redis available)
   - [x] ~~Message queue for background jobs~~ ✅ COMPLETED (BullMQ implemented for webhooks, notifications, emails)
   - [ ] Implement database read replicas (for 2,000+ concurrent users)

### Future Deployment Considerations

*These are deployment/infrastructure tasks, not code changes:*

1. **Production Monitoring**
   - [x] Configure CloudWatch dashboards ✅ (`Boxcord-Production`, 22 widgets)
   - [x] Set up alerting ✅ (8 CloudWatch alarms → SNS `boxcord-alerts`)
   - [ ] Track real user metrics (RUM)
   - [ ] Monitor error rates and uptime (target: 99.9%)

2. **Infrastructure Scaling**
   - [ ] CDN for static assets (CloudFront) ✅
   - [ ] Load balancer with auto-scaling (ECS Fargate + ALB) ✅
   - [ ] Redis cluster for high availability
   - [ ] Geographic distribution for global users

## Troubleshooting

### Tests Fail Locally
```bash
# Clear caches and reinstall
rm -rf node_modules client/node_modules
yarn install
cd client && yarn install

# Reset test database
yarn prisma migrate reset --force
yarn prisma db seed
```

### E2E Tests Can't Connect
```bash
# Ensure both servers are running
yarn dev        # Terminal 1 (backend on :3001)
cd client && yarn dev  # Terminal 2 (frontend on :5173)

# Then run E2E tests
yarn test:e2e   # Terminal 3
```

### Load Tests Show High Error Rate
- Check server is running and healthy
- Verify database connections available
- Check Redis connection pool size
- Monitor system resources (CPU, memory)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [K6 Documentation](https://k6.io/docs/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
