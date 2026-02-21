// ==================================================
// Load Testing Configuration - K6
// ==================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 500 },  // Ramp up to 500 users (peak)
    { duration: '1m', target: 500 },   // Stay at 500 users
    { duration: '30s', target: 1000 }, // Ramp up to 1000 users (stress)
    { duration: '1m', target: 1000 },  // Stay at 1000 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    errors: ['rate<0.1'],              // Custom error rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };

  // Test 1: Get workspaces
  const workspacesRes = http.get(`${BASE_URL}/api/v1/workspaces`, { headers });
  check(workspacesRes, {
    'get workspaces status is 200': (r) => r.status === 200,
    'get workspaces response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get channels
  const channelsRes = http.get(`${BASE_URL}/api/v1/channels?workspaceId=ws-1`, { headers });
  check(channelsRes, {
    'get channels status is 200': (r) => r.status === 200,
    'get channels response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get messages
  const messagesRes = http.get(`${BASE_URL}/api/v1/messages?channelId=test-channel`, { headers });
  check(messagesRes, {
    'get messages status is 200': (r) => r.status === 200,
    'get messages response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}
