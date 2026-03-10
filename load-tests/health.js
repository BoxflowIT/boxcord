import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const healthErrors = new Rate('health_errors');
const healthDuration = new Trend('health_duration', true);

const BASE_URL = __ENV.BASE_URL || 'https://staging.boxcord.boxflow.com';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up
    { duration: '30s', target: 10 },   // Steady
    { duration: '10s', target: 50 },   // Push harder
    { duration: '30s', target: 50 },   // Steady at peak
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    health_errors: ['rate<0.01'],       // <1% errors
    health_duration: ['p(95)<200'],
  },
};

export default function () {
  // GET /health
  const healthRes = http.get(`${BASE_URL}/health`);
  healthDuration.add(healthRes.timings.duration);

  const healthOk = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health body contains status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'healthy' || body.status === 'ok';
      } catch {
        return false;
      }
    },
    'health response < 500ms': (r) => r.timings.duration < 500,
  });

  healthErrors.add(!healthOk);

  // Verify health response includes subsystem checks
  check(healthRes, {
    'health includes database check': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.checks?.database?.status === 'healthy';
      } catch {
        return false;
      }
    },
    'health includes redis check': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.checks?.redis?.status === 'healthy';
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);
}

export function handleSummary(data) {
  console.log('\n=== Health Check Load Test Summary ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(1)}ms`);
  console.log(`p95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(1)}ms`);
  console.log(`p99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(1)}ms`);
  console.log(`Error rate: ${(data.metrics.health_errors.values.rate * 100).toFixed(2)}%`);
  console.log('=====================================\n');

  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'load-tests/results/health-summary.json': JSON.stringify(data, null, 2),
  };
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';
