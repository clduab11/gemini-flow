/**
 * Prometheus Metrics Configuration
 * 
 * Defines and exports all metrics for the Gemini Flow backend.
 * Metrics are collected and exposed for Prometheus scraping.
 */

import client from 'prom-client';

// Enable default metrics (CPU, memory, event loop lag)
client.collectDefaultMetrics({
  prefix: 'gemini_flow_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// HTTP Request Duration Histogram
export const httpRequestDuration = new client.Histogram({
  name: 'gemini_flow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// HTTP Request Counter
export const httpRequestTotal = new client.Counter({
  name: 'gemini_flow_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Error Counter
export const errorsTotal = new client.Counter({
  name: 'gemini_flow_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'path']
});

// Gemini API Request Duration (specific to our use case)
export const geminiApiDuration = new client.Histogram({
  name: 'gemini_flow_gemini_api_duration_seconds',
  help: 'Duration of Gemini API requests in seconds',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// Gemini API Request Counter
export const geminiApiTotal = new client.Counter({
  name: 'gemini_flow_gemini_api_requests_total',
  help: 'Total number of Gemini API requests',
  labelNames: ['status']
});

// Flow Execution Metrics
export const flowNodesProcessed = new client.Histogram({
  name: 'gemini_flow_nodes_processed',
  help: 'Distribution of node counts in executed flows',
  buckets: [0, 5, 10, 25, 50, 100, 250, 500]
});

export const flowEdgesProcessed = new client.Histogram({
  name: 'gemini_flow_edges_processed',
  help: 'Distribution of edge counts in executed flows',
  buckets: [0, 5, 10, 25, 50, 100, 250, 500]
});

// Registry for all metrics
export const register = client.register;
