# Prometheus Metrics Monitoring

This directory contains configuration and documentation for monitoring the Gemini Flow backend with Prometheus.

## Overview

The Gemini Flow backend exposes Prometheus metrics at the `/metrics` endpoint, providing comprehensive observability into:

- **HTTP Request Metrics**: Duration, count, and status codes
- **Gemini API Metrics**: API call duration and success/error rates
- **Flow Execution Metrics**: Node and edge counts in executed flows
- **Error Tracking**: Error counts by type and path
- **System Metrics**: CPU, memory, event loop lag, and garbage collection

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

The server will start on port 3001 and expose metrics at `http://localhost:3001/metrics`.

### 2. Test Metrics Endpoint

```bash
curl http://localhost:3001/metrics
```

You should see Prometheus-formatted metrics output.

### 3. Run Prometheus

Using Docker:
```bash
docker run -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

Using local Prometheus installation:
```bash
prometheus --config.file=monitoring/prometheus.yml
```

Access Prometheus UI at `http://localhost:9090`

## Available Metrics

### HTTP Request Metrics

**`gemini_flow_http_request_duration_seconds`** (Histogram)
- Duration of HTTP requests in seconds
- Labels: `method`, `route`, `status_code`
- Buckets: 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5

**`gemini_flow_http_requests_total`** (Counter)
- Total number of HTTP requests
- Labels: `method`, `route`, `status_code`

### Gemini API Metrics

**`gemini_flow_gemini_api_duration_seconds`** (Histogram)
- Duration of Gemini API requests in seconds
- Labels: `status` (success/error)
- Buckets: 0.1, 0.5, 1, 2, 5, 10, 30

**`gemini_flow_gemini_api_requests_total`** (Counter)
- Total number of Gemini API requests
- Labels: `status` (success/error)

### Flow Execution Metrics

**`gemini_flow_nodes_processed`** (Histogram)
- Distribution of node counts in executed flows
- Buckets: 0, 5, 10, 25, 50, 100, 250, 500

**`gemini_flow_edges_processed`** (Histogram)
- Distribution of edge counts in executed flows
- Buckets: 0, 5, 10, 25, 50, 100, 250, 500

### Error Metrics

**`gemini_flow_errors_total`** (Counter)
- Total number of errors
- Labels: `type`, `path`

### System Metrics (Default Metrics)

All default Node.js metrics with `gemini_flow_` prefix:
- `gemini_flow_process_cpu_user_seconds_total`
- `gemini_flow_process_cpu_system_seconds_total`
- `gemini_flow_process_resident_memory_bytes`
- `gemini_flow_process_heap_bytes`
- `gemini_flow_nodejs_eventloop_lag_seconds`
- `gemini_flow_nodejs_gc_duration_seconds`
- And more...

## Example PromQL Queries

### Average HTTP Request Duration by Route

```promql
rate(gemini_flow_http_request_duration_seconds_sum[5m]) 
/ 
rate(gemini_flow_http_request_duration_seconds_count[5m])
```

### HTTP Request Rate (requests per second)

```promql
rate(gemini_flow_http_requests_total[1m])
```

### 95th Percentile Request Latency

```promql
histogram_quantile(0.95, 
  rate(gemini_flow_http_request_duration_seconds_bucket[5m])
)
```

### Error Rate Percentage

```promql
100 * rate(gemini_flow_errors_total[5m]) 
/ 
rate(gemini_flow_http_requests_total[5m])
```

### Gemini API Success Rate

```promql
rate(gemini_flow_gemini_api_requests_total{status="success"}[5m])
/
rate(gemini_flow_gemini_api_requests_total[5m])
* 100
```

### Average Gemini API Response Time

```promql
rate(gemini_flow_gemini_api_duration_seconds_sum[5m])
/
rate(gemini_flow_gemini_api_duration_seconds_count[5m])
```

### Average Flow Size (Nodes)

```promql
rate(gemini_flow_nodes_processed_sum[5m])
/
rate(gemini_flow_nodes_processed_count[5m])
```

### Memory Usage

```promql
gemini_flow_process_resident_memory_bytes / 1024 / 1024
```

### CPU Usage

```promql
rate(gemini_flow_process_cpu_seconds_total[1m]) * 100
```

## Grafana Dashboard

For visualization, import the provided Grafana dashboard:

```bash
# Import the dashboard
# File: monitoring/grafana-dashboard.json
```

### Dashboard Panels Include:

1. **Request Throughput**: Requests per second by route
2. **Request Latency**: p50, p95, p99 percentiles
3. **Error Rate**: Percentage of failed requests
4. **Gemini API Performance**: API call duration and success rate
5. **Flow Execution Stats**: Average nodes and edges processed
6. **System Resources**: CPU and memory usage
7. **Event Loop Lag**: Node.js event loop performance

## Alerting

Example alert rules (create `alerts.yml`):

```yaml
groups:
  - name: gemini_flow_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          100 * rate(gemini_flow_errors_total[5m])
          /
          rate(gemini_flow_http_requests_total[5m])
          > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% over the last 5 minutes"
      
      # Slow API responses
      - alert: SlowGeminiAPI
        expr: |
          rate(gemini_flow_gemini_api_duration_seconds_sum[5m])
          /
          rate(gemini_flow_gemini_api_duration_seconds_count[5m])
          > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Gemini API responding slowly"
          description: "Average response time is {{ $value }}s"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          gemini_flow_process_resident_memory_bytes / 1024 / 1024 > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB"
```

## Integration with Existing Infrastructure

### Docker Compose

```yaml
version: '3.8'

services:
  gemini-flow-backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
  
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/gemini-flow.json
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus-data:
  grafana-data:
```

### Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gemini-flow-backend
  labels:
    app: gemini-flow
spec:
  ports:
    - port: 3001
      name: http
  selector:
    app: gemini-flow
  
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: gemini-flow-backend
  labels:
    app: gemini-flow
spec:
  selector:
    matchLabels:
      app: gemini-flow
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

## Troubleshooting

### Metrics Not Appearing

1. Check if the backend is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Verify metrics endpoint:
   ```bash
   curl http://localhost:3001/metrics
   ```

3. Check Prometheus targets:
   - Go to `http://localhost:9090/targets`
   - Ensure `gemini-flow-backend` is UP

### High Cardinality Warnings

If you see high cardinality warnings, consider:
- Limiting dynamic route labels
- Aggregating less common status codes
- Using recording rules for complex queries

## Best Practices

1. **Set Appropriate Scrape Intervals**: 15s is generally good for most applications
2. **Use Recording Rules**: Pre-compute expensive queries
3. **Alert on SLOs**: Define Service Level Objectives and alert when they're violated
4. **Monitor System Metrics**: CPU, memory, and event loop are critical for Node.js
5. **Track Business Metrics**: Flow execution counts and sizes provide business insights

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [prom-client GitHub](https://github.com/siimon/prom-client)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Node.js Monitoring Best Practices](https://prometheus.io/docs/practices/naming/)
