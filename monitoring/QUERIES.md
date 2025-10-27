# PromQL Example Queries for Gemini Flow Backend

This document contains useful PromQL queries for monitoring the Gemini Flow backend.

## HTTP Request Metrics

### Request Rate (requests per second)
```promql
# Total request rate
rate(gemini_flow_http_requests_total[1m])

# Request rate by route
rate(gemini_flow_http_requests_total[1m]) by (route)

# Request rate by status code
rate(gemini_flow_http_requests_total[1m]) by (status_code)

# Request rate by method
rate(gemini_flow_http_requests_total[1m]) by (method)
```

### Request Duration

```promql
# Average request duration (all routes)
rate(gemini_flow_http_request_duration_seconds_sum[5m])
/
rate(gemini_flow_http_request_duration_seconds_count[5m])

# Average request duration by route
rate(gemini_flow_http_request_duration_seconds_sum[5m]) by (route)
/
rate(gemini_flow_http_request_duration_seconds_count[5m]) by (route)

# 50th percentile (median) latency
histogram_quantile(0.50, 
  rate(gemini_flow_http_request_duration_seconds_bucket[5m])
)

# 95th percentile latency
histogram_quantile(0.95, 
  rate(gemini_flow_http_request_duration_seconds_bucket[5m])
)

# 99th percentile latency
histogram_quantile(0.99, 
  rate(gemini_flow_http_request_duration_seconds_bucket[5m])
)

# P95 latency by route
histogram_quantile(0.95,
  rate(gemini_flow_http_request_duration_seconds_bucket[5m]) by (route, le)
) by (route)
```

### Success vs Error Rates

```promql
# Success rate (2xx and 3xx responses)
sum(rate(gemini_flow_http_requests_total{status_code=~"[23].."}[5m]))
/
sum(rate(gemini_flow_http_requests_total[5m]))
* 100

# Error rate percentage
100 * sum(rate(gemini_flow_http_requests_total{status_code=~"[45].."}[5m]))
/
sum(rate(gemini_flow_http_requests_total[5m]))

# 4xx error rate
rate(gemini_flow_http_requests_total{status_code=~"4.."}[5m])

# 5xx error rate
rate(gemini_flow_http_requests_total{status_code=~"5.."}[5m])
```

## Gemini API Metrics

### API Call Rates

```promql
# Total Gemini API request rate
rate(gemini_flow_gemini_api_requests_total[5m])

# Success rate
rate(gemini_flow_gemini_api_requests_total{status="success"}[5m])

# Error rate
rate(gemini_flow_gemini_api_requests_total{status="error"}[5m])

# Success percentage
rate(gemini_flow_gemini_api_requests_total{status="success"}[5m])
/
rate(gemini_flow_gemini_api_requests_total[5m])
* 100
```

### API Response Time

```promql
# Average Gemini API response time
rate(gemini_flow_gemini_api_duration_seconds_sum[5m])
/
rate(gemini_flow_gemini_api_duration_seconds_count[5m])

# Average response time for successful calls
rate(gemini_flow_gemini_api_duration_seconds_sum{status="success"}[5m])
/
rate(gemini_flow_gemini_api_duration_seconds_count{status="success"}[5m])

# Average response time for failed calls
rate(gemini_flow_gemini_api_duration_seconds_sum{status="error"}[5m])
/
rate(gemini_flow_gemini_api_duration_seconds_count{status="error"}[5m])

# P95 API response time
histogram_quantile(0.95,
  rate(gemini_flow_gemini_api_duration_seconds_bucket[5m])
)
```

## Flow Execution Metrics

### Flow Size Statistics

```promql
# Average number of nodes per flow
rate(gemini_flow_nodes_processed_sum[5m])
/
rate(gemini_flow_nodes_processed_count[5m])

# Average number of edges per flow
rate(gemini_flow_edges_processed_sum[5m])
/
rate(gemini_flow_edges_processed_count[5m])

# P95 flow size (nodes)
histogram_quantile(0.95,
  rate(gemini_flow_nodes_processed_bucket[5m])
)

# P95 flow size (edges)
histogram_quantile(0.95,
  rate(gemini_flow_edges_processed_bucket[5m])
)

# Flow execution rate
rate(gemini_flow_nodes_processed_count[5m])
```

## Error Metrics

### Error Tracking

```promql
# Total error rate
rate(gemini_flow_errors_total[5m])

# Errors by type
rate(gemini_flow_errors_total[5m]) by (type)

# Errors by path
rate(gemini_flow_errors_total[5m]) by (path)

# Top 5 error types
topk(5, rate(gemini_flow_errors_total[5m]) by (type))

# Error rate as percentage of total requests
100 * rate(gemini_flow_errors_total[5m])
/
rate(gemini_flow_http_requests_total[5m])
```

## System Resource Metrics

### CPU Usage

```promql
# CPU usage percentage
rate(gemini_flow_process_cpu_seconds_total[1m]) * 100

# CPU user time
rate(gemini_flow_process_cpu_user_seconds_total[1m]) * 100

# CPU system time
rate(gemini_flow_process_cpu_system_seconds_total[1m]) * 100
```

### Memory Usage

```promql
# Resident memory in MB
gemini_flow_process_resident_memory_bytes / 1024 / 1024

# Heap memory in MB
gemini_flow_process_heap_bytes / 1024 / 1024

# Virtual memory in MB
gemini_flow_process_virtual_memory_bytes / 1024 / 1024

# Memory growth rate (MB per minute)
rate(gemini_flow_process_resident_memory_bytes[5m]) * 60 / 1024 / 1024
```

### Event Loop Performance

```promql
# Current event loop lag
gemini_flow_nodejs_eventloop_lag_seconds

# Average event loop lag
gemini_flow_nodejs_eventloop_lag_mean_seconds

# Maximum event loop lag
gemini_flow_nodejs_eventloop_lag_max_seconds

# Minimum event loop lag
gemini_flow_nodejs_eventloop_lag_min_seconds
```

### Garbage Collection

```promql
# GC duration (if available)
rate(gemini_flow_nodejs_gc_duration_seconds_sum[5m])
/
rate(gemini_flow_nodejs_gc_duration_seconds_count[5m])

# GC rate (collections per second)
rate(gemini_flow_nodejs_gc_duration_seconds_count[5m])
```

### File Descriptors

```promql
# Open file descriptors
gemini_flow_process_open_fds

# File descriptor usage percentage
gemini_flow_process_open_fds / gemini_flow_process_max_fds * 100
```

## Service Level Objectives (SLOs)

### Availability SLO (99.9% uptime)

```promql
# Availability percentage (last 30 days)
avg_over_time(up{job="gemini-flow-backend"}[30d]) * 100

# Availability SLO compliance
avg_over_time(up{job="gemini-flow-backend"}[30d]) >= 0.999
```

### Latency SLO (95% of requests under 500ms)

```promql
# Percentage of requests under 500ms
sum(rate(gemini_flow_http_request_duration_seconds_bucket{le="0.5"}[5m]))
/
sum(rate(gemini_flow_http_request_duration_seconds_count[5m]))
* 100

# SLO compliance
(
  sum(rate(gemini_flow_http_request_duration_seconds_bucket{le="0.5"}[5m]))
  /
  sum(rate(gemini_flow_http_request_duration_seconds_count[5m]))
) >= 0.95
```

### Error Rate SLO (< 1% error rate)

```promql
# Current error rate
100 * sum(rate(gemini_flow_http_requests_total{status_code=~"[45].."}[5m]))
/
sum(rate(gemini_flow_http_requests_total[5m]))

# SLO compliance
(
  100 * sum(rate(gemini_flow_http_requests_total{status_code=~"[45].."}[5m]))
  /
  sum(rate(gemini_flow_http_requests_total[5m]))
) < 1
```

## Alerting Queries

### High Error Rate Alert

```promql
# Trigger when error rate exceeds 5%
100 * rate(gemini_flow_errors_total[5m])
/
rate(gemini_flow_http_requests_total[5m])
> 5
```

### High Latency Alert

```promql
# Trigger when P95 latency exceeds 1 second
histogram_quantile(0.95,
  rate(gemini_flow_http_request_duration_seconds_bucket[5m])
) > 1
```

### High Memory Usage Alert

```promql
# Trigger when memory exceeds 512MB
gemini_flow_process_resident_memory_bytes / 1024 / 1024 > 512
```

### Slow Gemini API Alert

```promql
# Trigger when average API response time exceeds 10 seconds
rate(gemini_flow_gemini_api_duration_seconds_sum[5m])
/
rate(gemini_flow_gemini_api_duration_seconds_count[5m])
> 10
```

### Service Down Alert

```promql
# Trigger when service is down
up{job="gemini-flow-backend"} == 0
```

## Capacity Planning Queries

### Request Volume Trends

```promql
# Daily request volume
sum(increase(gemini_flow_http_requests_total[1d]))

# Weekly request volume
sum(increase(gemini_flow_http_requests_total[7d]))

# Request growth rate (week over week)
(
  sum(increase(gemini_flow_http_requests_total[7d]))
  /
  sum(increase(gemini_flow_http_requests_total[7d] offset 7d))
) - 1
```

### Resource Utilization Trends

```promql
# Average CPU over 24 hours
avg_over_time(rate(gemini_flow_process_cpu_seconds_total[1m])[24h:]) * 100

# Average memory over 24 hours
avg_over_time(gemini_flow_process_resident_memory_bytes[24h]) / 1024 / 1024

# Peak memory usage (24 hours)
max_over_time(gemini_flow_process_resident_memory_bytes[24h]) / 1024 / 1024
```

## Recording Rules (for pre-computation)

Add these to your Prometheus configuration for better query performance:

```yaml
groups:
  - name: gemini_flow_recordings
    interval: 30s
    rules:
      # Pre-compute request rate
      - record: job:gemini_flow_http_requests:rate1m
        expr: rate(gemini_flow_http_requests_total[1m])
      
      # Pre-compute average latency
      - record: job:gemini_flow_http_duration:avg
        expr: |
          rate(gemini_flow_http_request_duration_seconds_sum[5m])
          /
          rate(gemini_flow_http_request_duration_seconds_count[5m])
      
      # Pre-compute P95 latency
      - record: job:gemini_flow_http_duration:p95
        expr: |
          histogram_quantile(0.95,
            rate(gemini_flow_http_request_duration_seconds_bucket[5m])
          )
      
      # Pre-compute error rate
      - record: job:gemini_flow_errors:rate
        expr: |
          100 * rate(gemini_flow_errors_total[5m])
          /
          rate(gemini_flow_http_requests_total[5m])
```

## Tips for Writing PromQL

1. **Use rate() for counters**: Counters only go up, so use `rate()` to calculate per-second rates
2. **Use increase() for totals**: Get the total increase over a time range
3. **Use irate() for volatile metrics**: For fast-moving metrics, `irate()` gives instantaneous rate
4. **Label filtering**: Use `{label="value"}` to filter metrics
5. **Regex matching**: Use `{label=~"regex"}` for pattern matching
6. **Aggregation**: Use `sum`, `avg`, `max`, `min`, `count` to aggregate across labels
7. **Time ranges**: Specify time ranges like `[5m]`, `[1h]`, `[1d]`
8. **Offset**: Use `offset 1d` to compare with past data
