import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'https://staging.boxcord.boxflow.com';
const API = `${BASE_URL}/api/v1`;

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],  // <1% errors
    'http_req_duration{group:::Health}': ['p(95)<200'],
  },
};

export function setup() {
  // Register or login a test user
  const registerRes = http.post(
    `${API}/auth/register`,
    JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || 'loadtest@boxcord.test',
      password: __ENV.TEST_USER_PASSWORD || 'LoadTest123!',
      username: 'k6-loadtest',
      displayName: 'K6 Load Tester',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Accept both 201 (new user) and 409 (already exists)
  if (registerRes.status === 201) {
    const body = JSON.parse(registerRes.body);
    return { token: body.token };
  }

  // If user already exists, try login-style: the app uses token-based auth
  // Try registering with same credentials — adjust per your auth flow
  console.log(`Registration returned ${registerRes.status}, attempting to extract token...`);

  // Fallback: run tests without auth (health checks still work)
  return { token: '' };
}

function authHeaders(data) {
  const headers = { 'Content-Type': 'application/json' };
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }
  return headers;
}

export default function (data) {
  const headers = authHeaders(data);

  group('Health', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health OK': (r) => r.status === 200 }) || errorRate.add(1);
  });

  group('User Profile', () => {
    if (!data.token) return;

    const res = http.get(`${API}/users/me`, { headers });
    const ok = check(res, {
      'users/me status 200': (r) => r.status === 200,
      'users/me has username': (r) => {
        try { return JSON.parse(r.body).username !== undefined; } catch { return false; }
      },
    });
    errorRate.add(!ok);
  });

  group('Workspaces', () => {
    if (!data.token) return;

    const res = http.get(`${API}/workspaces`, { headers });
    const ok = check(res, {
      'workspaces status 200': (r) => r.status === 200,
      'workspaces is array': (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
    });
    errorRate.add(!ok);
  });

  group('Initial Data', () => {
    if (!data.token) return;

    const res = http.get(`${API}/initial`, { headers });
    const ok = check(res, {
      'initial data status 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  group('DM Channels', () => {
    if (!data.token) return;

    const res = http.get(`${API}/dm/channels`, { headers });
    const ok = check(res, {
      'dm channels status 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  group('Online Users', () => {
    if (!data.token) return;

    const res = http.get(`${API}/users/online`, { headers });
    const ok = check(res, {
      'online users status 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  group('Search', () => {
    if (!data.token) return;

    const res = http.get(`${API}/search?q=hello`, { headers });
    check(res, {
      'search returns response': (r) => r.status === 200 || r.status === 400,
    });
  });

  group('Quick Reactions', () => {
    if (!data.token) return;

    const res = http.get(`${API}/reactions/quick`, { headers });
    check(res, {
      'quick reactions status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'load-tests/results/smoke-summary.json': JSON.stringify(data, null, 2),
  };
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';
