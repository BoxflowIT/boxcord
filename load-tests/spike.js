import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js';

// ─── Configuration ───────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://staging.boxcord.boxflow.com';
const SPIKE_VUS = parseInt(__ENV.SPIKE_VUS) || 100;

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const spikeLatency = new Trend('spike_latency', true);
const recoveryLatency = new Trend('recovery_latency', true);

// ─── Test Options ────────────────────────────────────────────────────────────
// This test validates auto-scaling behavior:
// 1. Baseline load (10 VUs)
// 2. Sudden spike (→ 100 VUs in 30 seconds)
// 3. Sustained high load (2 minutes at 100 VUs)
// 4. Drop back to baseline (10 VUs)
// 5. Recovery period (verify system stabilizes)
export const options = {
  stages: [
    { duration: '1m', target: 10 },                // Baseline ramp-up
    { duration: '1m', target: 10 },                // Steady baseline
    { duration: '30s', target: SPIKE_VUS },         // SPIKE! Sudden ramp
    { duration: '2m', target: SPIKE_VUS },          // Sustained spike
    { duration: '30s', target: 10 },               // Drop back
    { duration: '2m', target: 10 },                // Recovery observation
    { duration: '30s', target: 0 },                // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],  // More lenient for spike
    errors: ['rate<0.10'],                              // Allow up to 10% errors during spike
    http_req_failed: ['rate<0.10'],
  },
};

// ─── Main Test ───────────────────────────────────────────────────────────────
export default function () {
  // Health check — core availability metric
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    const ok = check(res, {
      'health returns 200': (r) => r.status === 200,
      'health body valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy' || body.status === 'ok';
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!ok);

    // Track latency by phase
    if (__VU > 50) {
      spikeLatency.add(res.timings.duration);
    } else {
      recoveryLatency.add(res.timings.duration);
    }
  });

  // Verify subsystems are healthy under load
  group('Subsystem Health', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'database healthy': (r) => {
        try { return JSON.parse(r.body).checks?.database?.status === 'healthy'; } catch { return false; }
      },
      'redis healthy': (r) => {
        try { return JSON.parse(r.body).checks?.redis?.status === 'healthy'; } catch { return false; }
      },
    });
  });

  // Simulate varied think time
  // During spike phase: faster requests (simulates real flood)
  // During normal phase: slower requests (simulates normal users)
  if (__VU > 50) {
    sleep(randomIntBetween(0, 1));  // Aggressive during spike
  } else {
    sleep(randomIntBetween(1, 2));  // Normal pace otherwise
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  console.log('\n=== Boxcord Spike Test Summary ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Spike VUs: ${SPIKE_VUS}`);
  console.log(`Total HTTP requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(1)}ms`);
  console.log(`p95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(1)}ms`);
  console.log(`p99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(1)}ms`);
  console.log(`Error rate: ${(data.metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%`);

  if (data.metrics.spike_latency) {
    console.log(`\nSpike phase avg latency: ${data.metrics.spike_latency.values.avg.toFixed(1)}ms`);
  }
  if (data.metrics.recovery_latency) {
    console.log(`Recovery phase avg latency: ${data.metrics.recovery_latency.values.avg.toFixed(1)}ms`);
  }
  console.log('==================================\n');

  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'load-tests/results/spike-summary.json': JSON.stringify(data, null, 2),
  };
}
