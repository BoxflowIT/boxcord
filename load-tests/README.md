# Boxcord Load Tests

Load testing suite using [k6](https://k6.io/) targeting the **staging** environment.

## Prerequisites

```bash
# k6 should already be installed
k6 version
```

## Test Scripts

| Script | Description | Focus |
|--------|-------------|-------|
| `health.js` | Baseline health check test | Infra reliability |
| `api-smoke.js` | Smoke test of critical API flows | Functional under load |
| `api-load.js` | Full load test simulating real users | Capacity planning |
| `spike.js` | Spike test with sudden traffic burst | Auto-scaling validation |

## Quick Start

```bash
# 1. Health check baseline (always run first)
k6 run load-tests/health.js

# 2. Smoke test (light load, verify endpoints work)
k6 run load-tests/api-smoke.js

# 3. Full load test (ramp up to target VUs)
k6 run load-tests/api-load.js

# 4. Spike test (validate auto-scaling)
k6 run load-tests/spike.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://staging.boxcord.boxflow.com` | Target environment URL |
| `TEST_USER_EMAIL` | `loadtest@boxcord.test` | Test user email |
| `TEST_USER_PASSWORD` | `LoadTest123!` | Test user password |
| `VUS` | varies per script | Virtual users |
| `DURATION` | varies per script | Test duration |

Override example:
```bash
k6 run -e BASE_URL=https://staging.boxcord.boxflow.com -e VUS=50 load-tests/api-load.js
```

## Thresholds

All tests define pass/fail thresholds:

- **p(95) response time** < 500ms for reads, < 1000ms for writes
- **p(99) response time** < 1000ms for reads, < 2000ms for writes
- **Error rate** < 1% (smoke), < 5% (load), < 10% (spike)
- **Health endpoint** < 200ms p(95)

## Test Stages

### Smoke Test (`api-smoke.js`)
- 5 VUs for 1 minute
- Validates all endpoints respond correctly

### Load Test (`api-load.js`)
- Ramp: 0 → 20 VUs (2min) → hold 20 VUs (5min) → 50 VUs (3min) → hold 50 VUs (5min) → ramp down (2min)
- Simulates realistic usage patterns with mixed read/write

### Spike Test (`spike.js`)
- Ramp: 0 → 10 VUs (1min) → sudden spike to 100 VUs (30s) → hold 100 VUs (2min) → drop to 10 VUs → recover (2min) → ramp down
- Tests auto-scaling triggers and recovery

## Output to CloudWatch (optional)

```bash
# Install the CloudWatch output extension
k6 run --out statsd load-tests/api-load.js
```

## Important Notes

- **Always target staging** — never run load tests against production
- Test user must be pre-created in the staging database
- WebSocket connections are not tested (k6 WebSocket support is limited for Socket.IO)
- Results can be viewed in terminal or exported to JSON/CSV
