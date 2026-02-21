// ==================================================
// Load Testing Configuration - K6
// ==================================================
/**
 * Run with:
 *   k6 run tests/load/api-load-test.js
 * 
 * Or with env vars:
 *   API_URL=http://localhost:3001 k6 run tests/load/api-load-test.js
 * 
 * Generate HTML report:
 *   k6 run --out json=test-results.json tests/load/api-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm up: 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users (normal load)
    { duration: '30s', target: 200 },  // Ramp up to 200 users
    { duration: '1m', target: 200 },   // Stay at 200 users (high load)
    { duration: '30s', target: 500 },  // Spike to 500 users (stress test)
    { duration: '30s', target: 500 },  // Stay at 500 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
    errors: ['rate<0.05'],                          // Custom error rate < 5%
    'http_req_duration{endpoint:health}': ['p(95)<100'], // Health should be fast
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Simulate different user behaviors
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Health check monitoring (lightweight)
    testHealthCheck();
  } else if (scenario < 0.6) {
    // 30% - Read-heavy user (browsing messages)
    testReadOperations();
  } else if (scenario < 0.9) {
    // 30% - Active user (reading and some writes)
    testMixedOperations();
  } else {
    // 10% - Heavy user (lots of interactions)
    testHeavyOperations();
  }
  
  sleep(1 + Math.random() * 2); // Random sleep 1-3 seconds
}

// ========== Test Scenarios ==========

function testHealthCheck() {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health' }
  });
  
  const passed = check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check has status field': (r) => {
      try {
        return JSON.parse(r.body).status === 'healthy';
      } catch {
        return false;
      }
    },
  });
  
  if (!passed) errorRate.add(1);
  healthCheckDuration.add(res.timings.duration);
}

function testReadOperations() {
  // Simulate user browsing and reading
  
  // 1. Check health
  const health = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health', operation: 'read' }
  });
  check(health, { 'health ok': (r) => r.status === 200 }) || errorRate.add(1);
  apiResponseTime.add(health.timings.duration);
  
  sleep(0.5);
  
  // 2. Visit metrics
  const metrics = http.get(`${BASE_URL}/metrics`, {
    tags: { endpoint: 'metrics', operation: 'read' }
  });
  check(metrics, { 'metrics ok': (r) => r.status === 200 }) || errorRate.add(1);
  
  sleep(1);
}

function testMixedOperations() {
  // Simulate active user with mixed read/write
  
  // Health check
  const health = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health' }
  });
  check(health, { 'health ok': (r) => r.status === 200 }) || errorRate.add(1);
  
  sleep(0.3);
  
  // Check Swagger docs (development feature test)
  const docs = http.get(`${BASE_URL}/api/docs`, {
    tags: { endpoint: 'docs', operation: 'read' }
  });
  check(docs, { 'docs accessible': (r) => r.status === 200 }) || errorRate.add(1);
  
  sleep(0.5);
}

function testHeavyOperations() {
  // Simulate power user with many requests
  
  const endpoints = [
    { url: '/health', tag: 'health' },
    { url: '/metrics', tag: 'metrics' },
    { url: '/api/docs', tag: 'docs' },
  ];
  
  endpoints.forEach(endpoint => {
    const res = http.get(`${BASE_URL}${endpoint.url}`, {
      tags: { endpoint: endpoint.tag, operation: 'read' }
    });
    
    check(res, {
      [`${endpoint.tag} status ok`]: (r) => r.status === 200 || r.status === 401,
      [`${endpoint.tag} response time ok`]: (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
    
    apiResponseTime.add(res.timings.duration);
    sleep(0.2);
  });
}
