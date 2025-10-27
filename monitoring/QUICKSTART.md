# Quick Start Guide - Prometheus Metrics

Get started with Prometheus metrics monitoring for Gemini Flow backend in under 5 minutes.

## Prerequisites

- Node.js v18+ installed
- Docker and Docker Compose (for Prometheus/Grafana setup)
- Backend running on port 3001

## Step 1: Start the Backend (30 seconds)

```bash
cd backend
npm install  # Only needed first time
npm start
```

You should see:
```
🚀 Gemini Flow Backend Server running on port 3001
📋 Health check: http://localhost:3001/health
📊 Metrics: http://localhost:3001/metrics
🔧 API Base URL: http://localhost:3001/api
```

## Step 2: Verify Metrics (30 seconds)

```bash
# Check health
curl http://localhost:3001/health

# View metrics
curl http://localhost:3001/metrics

# Or run the verification script
./monitoring/verify-metrics.sh
```

You should see Prometheus-formatted metrics including:
- `gemini_flow_http_requests_total`
- `gemini_flow_process_cpu_seconds_total`
- `gemini_flow_process_resident_memory_bytes`
- And many more...

## Step 3: Start Prometheus (1 minute)

### Option A: Docker Compose (Recommended)

Start the full monitoring stack (Prometheus + Grafana):

```bash
docker-compose -f monitoring/docker-compose.yml up -d
```

Access the UIs:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (login: admin/admin)

### Option B: Local Prometheus

```bash
# Download Prometheus if not installed
# macOS: brew install prometheus
# Linux: Download from https://prometheus.io/download/

# Start Prometheus with config
prometheus --config.file=monitoring/prometheus.yml
```

Access Prometheus UI at http://localhost:9090

## Step 4: Explore Metrics (2 minutes)

### In Prometheus UI (http://localhost:9090)

Try these queries:

**Request rate:**
```promql
rate(gemini_flow_http_requests_total[1m])
```

**Average request latency:**
```promql
rate(gemini_flow_http_request_duration_seconds_sum[5m]) 
/ 
rate(gemini_flow_http_request_duration_seconds_count[5m])
```

**CPU usage:**
```promql
rate(gemini_flow_process_cpu_seconds_total[1m]) * 100
```

**Memory usage (MB):**
```promql
gemini_flow_process_resident_memory_bytes / 1024 / 1024
```

### In Grafana UI (http://localhost:3000)

1. Login with **admin/admin**
2. Navigate to **Dashboards** → **Gemini Flow Backend Monitoring**
3. View pre-built panels for:
   - Request throughput
   - Latency percentiles (p50, p95, p99)
   - Error rates
   - Gemini API performance
   - System resources

## Step 5: Generate Some Traffic (1 minute)

To see metrics in action, make some API requests:

```bash
# Health check (generates HTTP metrics)
curl http://localhost:3001/health

# API status (generates more metrics)
curl http://localhost:3001/api/gemini/status

# Execute a flow (generates Gemini API metrics)
curl -X POST http://localhost:3001/api/gemini/execute \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {"id": "1", "type": "input", "data": {"label": "Start"}},
      {"id": "2", "type": "output", "data": {"label": "End"}}
    ],
    "edges": [
      {"source": "1", "target": "2"}
    ]
  }'
```

**Note**: The last command requires a valid `GEMINI_API_KEY` environment variable set in the backend.

After generating traffic, refresh the metrics endpoint or Grafana dashboards to see the data.

## Common Issues

### Backend Won't Start

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill existing process
pkill -f "node src/server.js"
```

### Metrics Endpoint Returns Empty

- Wait a few seconds for metrics to be collected
- Make some API requests to generate HTTP metrics
- Check server logs for errors

### Prometheus Can't Scrape Metrics

1. Check if backend is running: `curl http://localhost:3001/health`
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify Prometheus config: `monitoring/prometheus.yml`
4. For Docker Compose, ensure backend container is reachable

### Grafana Dashboard is Empty

1. Wait 30-60 seconds for initial data collection
2. Check Prometheus datasource is configured correctly
3. Verify backend is sending metrics to Prometheus
4. Generate some traffic to the backend

## What's Next?

- **Configure Alerts**: Edit `monitoring/alerts.yml` and uncomment the `rule_files` section in `prometheus.yml`
- **Customize Dashboard**: Edit `monitoring/grafana-dashboard.json` or create new dashboards in Grafana UI
- **Learn PromQL**: Check out `monitoring/QUERIES.md` for example queries
- **Production Setup**: Follow the full guide in `monitoring/README.md`

## Useful Commands

```bash
# View metrics in terminal
curl -s http://localhost:3001/metrics | grep gemini_flow

# Watch metrics update in real-time
watch -n 1 'curl -s http://localhost:3001/metrics | grep gemini_flow_http_requests_total'

# Check Prometheus status
curl http://localhost:9090/-/ready

# View Prometheus config
curl http://localhost:9090/api/v1/status/config

# Export Grafana dashboard
curl http://localhost:3000/api/dashboards/db/gemini-flow-backend-monitoring
```

## Full Documentation

- **Detailed Setup**: `monitoring/README.md`
- **PromQL Queries**: `monitoring/QUERIES.md`
- **Alert Rules**: `monitoring/alerts.yml`
- **Docker Setup**: `monitoring/docker-compose.yml`

---

**Total Setup Time**: ~5 minutes ⚡

**You're now monitoring your Gemini Flow backend with Prometheus!** 🎉
