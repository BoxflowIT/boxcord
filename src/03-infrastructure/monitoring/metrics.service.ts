// Prometheus Metrics Service
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
collectDefaultMetrics({ prefix: 'boxcord_' });

// HTTP request counter
export const httpRequestCounter = new Counter({
  name: 'boxcord_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'boxcord_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10] // 1ms to 10s
});

// WebSocket connection counter
export const wsConnectionCounter = new Counter({
  name: 'boxcord_websocket_connections_total',
  help: 'Total number of WebSocket connections',
  labelNames: ['event'] // connect, disconnect
});

// WebSocket message counter
export const wsMessageCounter = new Counter({
  name: 'boxcord_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['event_type', 'direction'] // direction: inbound/outbound
});

// Database query counter
export const dbQueryCounter = new Counter({
  name: 'boxcord_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model']
});

// Database query duration
export const dbQueryDuration = new Histogram({
  name: 'boxcord_database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2] // 1ms to 2s
});

// Cache hit/miss counter
export const cacheCounter = new Counter({
  name: 'boxcord_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'] // operation: get/set/del, result: hit/miss/success
});

// Export the registry for /metrics endpoint
export { register };
