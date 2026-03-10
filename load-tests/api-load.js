import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';

// ─── Configuration ───────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://staging.boxcord.boxflow.com';
const API = `${BASE_URL}/api/v1`;
const TARGET_VUS = parseInt(__ENV.VUS) || 50;

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const messagesSent = new Counter('messages_sent');
const readOps = new Trend('read_operations', true);
const writeOps = new Trend('write_operations', true);

// ─── Test Options ────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '2m', target: 20 },                // Ramp up to 20 VUs
    { duration: '5m', target: 20 },                // Hold at 20
    { duration: '3m', target: TARGET_VUS },         // Ramp to target
    { duration: '5m', target: TARGET_VUS },         // Hold at target
    { duration: '2m', target: 0 },                 // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{group:::Read Operations}': ['p(95)<300'],
    'http_req_duration{group:::Write Operations}': ['p(95)<1000'],
    errors: ['rate<0.05'],                           // <5% error rate
    http_req_failed: ['rate<0.05'],
  },
};

// ─── Setup: Create test user and gather resource IDs ─────────────────────────
export function setup() {
  const vuId = `k6-${randomString(8)}`;

  // Register test user
  const registerRes = http.post(
    `${API}/auth/register`,
    JSON.stringify({
      email: `${vuId}@loadtest.boxcord.test`,
      password: 'LoadTest123!',
      username: vuId,
      displayName: `Load Tester ${vuId}`,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = '';
  if (registerRes.status === 201) {
    try {
      token = JSON.parse(registerRes.body).token;
    } catch (e) {
      console.log('Failed to parse register response');
    }
  }

  if (!token) {
    console.log(`Setup: Registration returned ${registerRes.status}. Running unauthenticated tests only.`);
    return { token: '', workspaceId: '', channelId: '' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Get workspaces
  const wsRes = http.get(`${API}/workspaces`, { headers });
  let workspaceId = '';
  let channelId = '';

  try {
    const workspaces = JSON.parse(wsRes.body);
    if (Array.isArray(workspaces) && workspaces.length > 0) {
      workspaceId = workspaces[0].id;

      // Get channels for this workspace
      const chRes = http.get(`${API}/channels?workspaceId=${workspaceId}`, { headers });
      const channels = JSON.parse(chRes.body);
      if (Array.isArray(channels) && channels.length > 0) {
        channelId = channels[0].id;
      }
    }
  } catch (e) {
    console.log('Setup: Failed to discover workspace/channel IDs');
  }

  return { token, workspaceId, channelId };
}

function authHeaders(data) {
  const headers = { 'Content-Type': 'application/json' };
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }
  return headers;
}

// ─── Main Test Scenario ──────────────────────────────────────────────────────
export default function (data) {
  const headers = authHeaders(data);

  // ─── Health (always runs) ────────────────────────────────────────────────
  group('Health', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health OK': (r) => r.status === 200 }) || errorRate.add(1);
  });

  if (!data.token) {
    sleep(1);
    return;
  }

  // ─── Read Operations (80% of iterations - simulating typical browse pattern) ─
  group('Read Operations', () => {
    // User profile
    {
      const res = http.get(`${API}/users/me`, { headers });
      readOps.add(res.timings.duration);
      const ok = check(res, { 'users/me OK': (r) => r.status === 200 });
      errorRate.add(!ok);
    }

    // Workspace list
    {
      const res = http.get(`${API}/workspaces`, { headers });
      readOps.add(res.timings.duration);
      const ok = check(res, { 'workspaces OK': (r) => r.status === 200 });
      errorRate.add(!ok);
    }

    // Channels (if workspace available)
    if (data.workspaceId) {
      const res = http.get(`${API}/channels?workspaceId=${data.workspaceId}`, { headers });
      readOps.add(res.timings.duration);
      check(res, { 'channels OK': (r) => r.status === 200 });
    }

    // Messages (if channel available)
    if (data.channelId) {
      const res = http.get(`${API}/messages?channelId=${data.channelId}&limit=50`, { headers });
      readOps.add(res.timings.duration);
      check(res, { 'messages OK': (r) => r.status === 200 });
    }

    // DM channels
    {
      const res = http.get(`${API}/dm/channels`, { headers });
      readOps.add(res.timings.duration);
      check(res, { 'dm channels OK': (r) => r.status === 200 });
    }

    // Online users
    {
      const res = http.get(`${API}/users/online`, { headers });
      readOps.add(res.timings.duration);
      check(res, { 'online users OK': (r) => r.status === 200 });
    }

    // Initial data fetch (simulates app load)
    if (randomIntBetween(1, 5) === 1) {  // 20% of iterations
      const res = http.get(`${API}/initial`, { headers });
      readOps.add(res.timings.duration);
      check(res, { 'initial data OK': (r) => r.status === 200 });
    }
  });

  // ─── Write Operations (20% of iterations - simulating message sends) ─────
  if (randomIntBetween(1, 5) === 1 && data.channelId) {
    group('Write Operations', () => {
      // Send a message
      const msgContent = `Load test message ${Date.now()} - ${randomString(20)}`;
      const res = http.post(
        `${API}/messages`,
        JSON.stringify({
          channelId: data.channelId,
          content: msgContent,
        }),
        { headers }
      );
      writeOps.add(res.timings.duration);

      const ok = check(res, {
        'send message OK': (r) => r.status === 200 || r.status === 201,
      });
      if (ok) messagesSent.add(1);
      errorRate.add(!ok);

      // Mark channel as read
      http.post(`${API}/channels/${data.channelId}/read`, null, { headers });
    });
  }

  // ─── Search (10% of iterations) ─────────────────────────────────────────
  if (randomIntBetween(1, 10) === 1) {
    group('Search', () => {
      const queries = ['hello', 'test', 'meeting', 'update', 'please'];
      const q = queries[randomIntBetween(0, queries.length - 1)];
      const res = http.get(`${API}/search/messages?q=${q}`, { headers });
      readOps.add(res.timings.duration);
      check(res, { 'search OK': (r) => r.status === 200 || r.status === 400 });
    });
  }

  // ─── Presence update (every iteration) ──────────────────────────────────
  http.post(
    `${API}/users/me/presence`,
    JSON.stringify({ status: 'online' }),
    { headers }
  );

  // Realistic think time (1-3 seconds between actions)
  sleep(randomIntBetween(1, 3));
}

// ─── Summary ─────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  console.log('\n=== Boxcord Load Test Summary ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Peak VUs: ${TARGET_VUS}`);
  console.log(`Total HTTP requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(1)}ms`);
  console.log(`p95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(1)}ms`);
  console.log(`p99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(1)}ms`);
  if (data.metrics.messages_sent) {
    console.log(`Messages sent: ${data.metrics.messages_sent.values.count}`);
  }
  console.log(`Error rate: ${(data.metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%`);
  console.log('=================================\n');

  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'load-tests/results/load-summary.json': JSON.stringify(data, null, 2),
  };
}
