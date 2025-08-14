# Capacity Planning and Performance Tuning Guide

## Overview

This document provides comprehensive guidance for capacity planning and performance tuning of Google Services in the Gemini-Flow platform. The goal is to maintain optimal performance while managing costs effectively and ensuring scalability for future growth.

## Table of Contents

1. [Capacity Planning Framework](#capacity-planning-framework)
2. [Resource Requirements](#resource-requirements)
3. [Performance Baselines](#performance-baselines)
4. [Scaling Strategies](#scaling-strategies)
5. [Cost Optimization](#cost-optimization)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Performance Tuning](#performance-tuning)

## Capacity Planning Framework

### Planning Methodology

```yaml
# Capacity Planning Process
capacity_planning:
  time_horizons:
    tactical: "1-3 months"      # Immediate scaling needs
    strategic: "6-12 months"    # Business growth planning
    long_term: "1-3 years"      # Architecture evolution
    
  planning_cycles:
    monthly: "Review current usage and adjust"
    quarterly: "Forecast and budget planning"
    annually: "Strategic architecture review"
    
  key_metrics:
    - Request rate (RPS)
    - Data volume (GB/day)
    - User concurrent sessions
    - API call distribution
    - Storage requirements
    - Compute utilization
```

### Growth Projections

```python
#!/usr/bin/env python3
# capacity_forecasting.py - Capacity forecasting models

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

class CapacityForecaster:
    def __init__(self):
        self.models = {}
        
    def load_historical_data(self, metric_name, days=90):
        """Load historical usage data from monitoring systems"""
        # This would integrate with your monitoring system
        # Example data structure
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
        
        if metric_name == 'request_rate':
            # Simulate growth trend with seasonality
            base_growth = np.linspace(1000, 1500, days)
            seasonal = 100 * np.sin(2 * np.pi * np.arange(days) / 7)
            noise = np.random.normal(0, 50, days)
            values = base_growth + seasonal + noise
            
        elif metric_name == 'storage_gb':
            # Exponential growth pattern
            values = 100 * 1.02 ** np.arange(days) + np.random.normal(0, 10, days)
            
        elif metric_name == 'concurrent_users':
            # Step growth with usage spikes
            base = np.linspace(500, 800, days)
            spikes = np.random.exponential(0.1, days) * 200
            values = base + spikes
            
        return pd.DataFrame({'date': dates, 'value': values})
    
    def forecast_usage(self, metric_name, days_ahead=90):
        """Generate usage forecasts using linear regression with confidence intervals"""
        data = self.load_historical_data(metric_name)
        
        # Prepare features
        data['day_of_year'] = data['date'].dt.dayofyear
        data['day_of_week'] = data['date'].dt.dayofweek
        data['days_since_start'] = (data['date'] - data['date'].min()).dt.days
        
        X = data[['days_since_start', 'day_of_week']].values
        y = data['value'].values
        
        # Train model
        model = LinearRegression()
        model.fit(X, y)
        self.models[metric_name] = model
        
        # Generate forecast
        future_dates = pd.date_range(
            start=data['date'].max() + timedelta(days=1),
            periods=days_ahead,
            freq='D'
        )
        
        future_data = pd.DataFrame({'date': future_dates})
        future_data['day_of_year'] = future_data['date'].dt.dayofyear
        future_data['day_of_week'] = future_data['date'].dt.dayofweek
        future_data['days_since_start'] = (
            future_data['date'] - data['date'].min()
        ).dt.days
        
        X_future = future_data[['days_since_start', 'day_of_week']].values
        forecast = model.predict(X_future)
        
        # Calculate confidence intervals (simplified)
        residuals = y - model.predict(X)
        mse = np.mean(residuals ** 2)
        confidence_interval = 1.96 * np.sqrt(mse)  # 95% CI
        
        return {
            'dates': future_dates,
            'forecast': forecast,
            'upper_bound': forecast + confidence_interval,
            'lower_bound': forecast - confidence_interval,
            'current_value': y[-1],
            'growth_rate': (forecast[-1] - y[-1]) / y[-1]
        }
    
    def calculate_capacity_requirements(self):
        """Calculate capacity requirements based on forecasts"""
        forecasts = {}
        
        # Get forecasts for key metrics
        for metric in ['request_rate', 'storage_gb', 'concurrent_users']:
            forecasts[metric] = self.forecast_usage(metric, days_ahead=90)
        
        # Calculate resource requirements
        requirements = {
            'compute': {
                'current_rps': forecasts['request_rate']['current_value'],
                'forecast_rps': forecasts['request_rate']['forecast'][-1],
                'cpu_cores_needed': int(forecasts['request_rate']['forecast'][-1] / 100),  # 100 RPS per core
                'memory_gb_needed': int(forecasts['concurrent_users']['forecast'][-1] / 10),  # 10 users per GB
                'scaling_factor': forecasts['request_rate']['growth_rate']
            },
            'storage': {
                'current_gb': forecasts['storage_gb']['current_value'],
                'forecast_gb': forecasts['storage_gb']['forecast'][-1],
                'growth_gb_per_month': (forecasts['storage_gb']['forecast'][-1] - 
                                      forecasts['storage_gb']['current_value']) / 3,
                'backup_storage_gb': forecasts['storage_gb']['forecast'][-1] * 1.5
            },
            'network': {
                'bandwidth_mbps': forecasts['request_rate']['forecast'][-1] * 0.1,  # 0.1 MB per request
                'cdn_requirements': forecasts['concurrent_users']['forecast'][-1] > 1000
            }
        }
        
        return requirements

# Usage example
if __name__ == "__main__":
    forecaster = CapacityForecaster()
    requirements = forecaster.calculate_capacity_requirements()
    
    print("=== Capacity Requirements Forecast ===")
    print(f"Compute: {requirements['compute']['cpu_cores_needed']} CPU cores needed")
    print(f"Memory: {requirements['compute']['memory_gb_needed']} GB RAM needed")
    print(f"Storage: {requirements['storage']['forecast_gb']:.0f} GB storage needed")
    print(f"Growth rate: {requirements['compute']['scaling_factor']:.1%}")
```

## Resource Requirements

### Google Services Resource Matrix

| Service | CPU (cores) | Memory (GB) | Storage (GB) | Network (Mbps) | Cost Factor |
|---------|-------------|-------------|--------------|----------------|-------------|
| **Vertex AI Connector** | 2-4 | 8-16 | 50 | 100-500 | High |
| **Google Workspace** | 1-2 | 4-8 | 20 | 50-100 | Medium |
| **Streaming API** | 4-8 | 16-32 | 100 | 500-1000 | High |
| **AgentSpace Manager** | 2-4 | 8-16 | 200 | 100-200 | Medium |
| **Media Services (Veo3/Imagen4)** | 8-16 | 32-64 | 1000 | 1000-2000 | Very High |

### Kubernetes Resource Specifications

```yaml
# k8s-resource-specs.yaml - Production resource requirements
apiVersion: v1
kind: ConfigMap
metadata:
  name: resource-specifications
data:
  vertex-ai-connector.yaml: |
    apiVersion: apps/v1
    kind: Deployment
    spec:
      template:
        spec:
          containers:
          - name: vertex-ai-connector
            resources:
              requests:
                cpu: "2000m"
                memory: "8Gi"
                ephemeral-storage: "50Gi"
              limits:
                cpu: "4000m"
                memory: "16Gi"
                ephemeral-storage: "100Gi"
            env:
            - name: MAX_CONCURRENT_REQUESTS
              value: "100"
            - name: REQUEST_TIMEOUT
              value: "30s"
              
  streaming-api.yaml: |
    apiVersion: apps/v1
    kind: Deployment
    spec:
      template:
        spec:
          containers:
          - name: streaming-api
            resources:
              requests:
                cpu: "4000m"
                memory: "16Gi"
                ephemeral-storage: "100Gi"
              limits:
                cpu: "8000m"
                memory: "32Gi"
                ephemeral-storage: "200Gi"
            env:
            - name: BUFFER_SIZE_MB
              value: "100"
            - name: MAX_STREAMS
              value: "50"
              
  media-services.yaml: |
    apiVersion: apps/v1
    kind: Deployment
    spec:
      template:
        spec:
          nodeSelector:
            accelerator: nvidia-tesla-v100
          containers:
          - name: media-services
            resources:
              requests:
                cpu: "8000m"
                memory: "32Gi"
                ephemeral-storage: "1000Gi"
                nvidia.com/gpu: 1
              limits:
                cpu: "16000m"
                memory: "64Gi"
                ephemeral-storage: "2000Gi"
                nvidia.com/gpu: 2
```

## Performance Baselines

### Service Level Indicators (SLIs)

```yaml
# performance-baselines.yaml
slis:
  vertex_ai_connector:
    availability: 99.9%
    latency_p95: 500ms
    latency_p99: 1000ms
    throughput: 1000 RPS
    error_rate: 0.1%
    
  google_workspace:
    availability: 99.5%
    latency_p95: 1000ms
    latency_p99: 2000ms
    throughput: 200 RPS
    error_rate: 0.5%
    
  streaming_api:
    availability: 99.9%
    latency_p95: 100ms
    latency_p99: 200ms
    throughput: 500 streams
    error_rate: 0.1%
    
  media_services:
    availability: 99.0%
    generation_time_p95: 30s
    generation_time_p99: 60s
    concurrent_jobs: 10
    error_rate: 1.0%
```

### Performance Testing Framework

```bash
#!/bin/bash
# performance-testing.sh - Automated performance testing

# Configuration
TEST_DURATION=300  # 5 minutes
BASE_URL="https://api.gemini-flow.com"
RESULTS_DIR="performance-results/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$RESULTS_DIR"

echo "=== Starting Performance Testing ==="

# Test 1: Vertex AI Connector Load Test
echo "Testing Vertex AI Connector..."
k6 run --duration ${TEST_DURATION}s --vus 50 - <<EOF
import http from 'k6/http';
import { check } from 'k6';

export default function() {
    const payload = JSON.stringify({
        model: 'gemini-2.5-pro',
        messages: [{ role: 'user', content: 'Hello, world!' }]
    });
    
    const params = {
        headers: { 'Content-Type': 'application/json' },
    };
    
    const response = http.post('$BASE_URL/api/v1/vertex-ai/generate', payload, params);
    
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
}
EOF

# Test 2: Streaming API Performance
echo "Testing Streaming API..."
artillery run --config artillery-streaming.yml --output "$RESULTS_DIR/streaming-results.json"

# Test 3: Google Workspace Integration
echo "Testing Google Workspace..."
locust -f workspace-load-test.py --host="$BASE_URL" --users=20 --spawn-rate=2 --run-time=300s --html="$RESULTS_DIR/workspace-report.html"

# Test 4: Media Services Performance
echo "Testing Media Services..."
python3 - <<EOF
import asyncio
import aiohttp
import time
import json

async def test_media_generation():
    results = []
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        
        for i in range(10):  # 10 concurrent requests
            task = asyncio.create_task(
                generate_image(session, f"Test image {i}")
            )
            tasks.append(task)
        
        start_time = time.time()
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        success_count = len([r for r in responses if not isinstance(r, Exception)])
        total_time = end_time - start_time
        
        results.append({
            'test': 'media_generation',
            'concurrent_requests': 10,
            'success_rate': success_count / len(tasks),
            'total_time': total_time,
            'average_time': total_time / len(tasks)
        })
    
    with open('$RESULTS_DIR/media-results.json', 'w') as f:
        json.dump(results, f, indent=2)

async def generate_image(session, prompt):
    payload = {'prompt': prompt, 'model': 'imagen-4'}
    async with session.post('$BASE_URL/api/v1/media/generate-image', json=payload) as response:
        return await response.json()

asyncio.run(test_media_generation())
EOF

# Generate performance report
python3 performance-report-generator.py "$RESULTS_DIR"

echo "=== Performance Testing Completed ==="
echo "Results available in: $RESULTS_DIR"
```

## Scaling Strategies

### Horizontal Pod Autoscaler (HPA) Configuration

```yaml
# hpa-configurations.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vertex-ai-connector-hpa
  namespace: gemini-flow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vertex-ai-connector
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: pending_requests
      target:
        type: AverageValue
        averageValue: "10"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Percent
        value: 50
        periodSeconds: 120
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: streaming-api-hpa
  namespace: gemini-flow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: streaming-api
  minReplicas: 2
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Pods
    pods:
      metric:
        name: active_connections
      target:
        type: AverageValue
        averageValue: "100"
```

### Vertical Pod Autoscaler (VPA) Configuration

```yaml
# vpa-configurations.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: media-services-vpa
  namespace: gemini-flow
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: media-services
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: media-services
      minAllowed:
        cpu: 4000m
        memory: 16Gi
      maxAllowed:
        cpu: 32000m
        memory: 128Gi
      controlledResources: ["cpu", "memory"]
```

### Cluster Autoscaler Configuration

```yaml
# cluster-autoscaler.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=gce
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=gce:zones=us-central1-a,us-central1-b,us-central1-c
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-utilization-threshold=0.5
        - --max-node-provision-time=15m
        env:
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: /etc/gcp/service-account.json
```

## Cost Optimization

### Resource Right-Sizing Script

```python
#!/usr/bin/env python3
# cost-optimization.py - Automated cost optimization analysis

import json
import subprocess
from datetime import datetime, timedelta

class CostOptimizer:
    def __init__(self):
        self.recommendations = []
        
    def analyze_resource_utilization(self):
        """Analyze current resource utilization and identify waste"""
        print("Analyzing resource utilization...")
        
        # Get current resource usage
        usage_data = self.get_resource_usage()
        
        for deployment, usage in usage_data.items():
            # Check for over-provisioning
            if usage['cpu_utilization'] < 30:
                self.recommendations.append({
                    'type': 'cpu_rightsizing',
                    'deployment': deployment,
                    'current_cpu': usage['cpu_request'],
                    'recommended_cpu': int(usage['cpu_request'] * 0.7),
                    'potential_savings': self.calculate_savings('cpu', usage['cpu_request'] * 0.3)
                })
                
            if usage['memory_utilization'] < 40:
                self.recommendations.append({
                    'type': 'memory_rightsizing',
                    'deployment': deployment,
                    'current_memory': usage['memory_request'],
                    'recommended_memory': int(usage['memory_request'] * 0.8),
                    'potential_savings': self.calculate_savings('memory', usage['memory_request'] * 0.2)
                })
                
    def get_resource_usage(self):
        """Get current resource usage from Kubernetes metrics"""
        # This would integrate with your metrics system
        return {
            'vertex-ai-connector': {
                'cpu_request': 2000,  # mCPU
                'cpu_utilization': 45,  # %
                'memory_request': 8192,  # MB
                'memory_utilization': 60  # %
            },
            'google-workspace': {
                'cpu_request': 1000,
                'cpu_utilization': 25,
                'memory_request': 4096,
                'memory_utilization': 35
            },
            'streaming-api': {
                'cpu_request': 4000,
                'cpu_utilization': 70,
                'memory_request': 16384,
                'memory_utilization': 75
            }
        }
        
    def calculate_savings(self, resource_type, amount):
        """Calculate potential cost savings"""
        if resource_type == 'cpu':
            # $0.031 per vCPU per hour
            return (amount / 1000) * 0.031 * 24 * 30
        elif resource_type == 'memory':
            # $0.004 per GB per hour
            return (amount / 1024) * 0.004 * 24 * 30
        return 0
        
    def analyze_storage_usage(self):
        """Analyze storage usage and recommend optimizations"""
        print("Analyzing storage usage...")
        
        # Check for unused volumes
        cmd = "kubectl get pv -o json"
        result = subprocess.run(cmd.split(), capture_output=True, text=True)
        volumes = json.loads(result.stdout)
        
        for volume in volumes.get('items', []):
            if volume['status']['phase'] == 'Available':
                self.recommendations.append({
                    'type': 'unused_storage',
                    'volume': volume['metadata']['name'],
                    'size': volume['spec']['capacity']['storage'],
                    'potential_savings': self.calculate_storage_savings(volume['spec']['capacity']['storage'])
                })
                
    def calculate_storage_savings(self, size):
        """Calculate storage cost savings"""
        # Parse size (e.g., "100Gi")
        if size.endswith('Gi'):
            gb = int(size[:-2])
        elif size.endswith('Ti'):
            gb = int(size[:-2]) * 1024
        else:
            gb = 0
            
        # $0.04 per GB per month for SSD
        return gb * 0.04
        
    def generate_optimization_report(self):
        """Generate comprehensive optimization report"""
        self.analyze_resource_utilization()
        self.analyze_storage_usage()
        
        total_savings = sum(rec.get('potential_savings', 0) for rec in self.recommendations)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_potential_savings': total_savings,
            'recommendations': self.recommendations,
            'summary': {
                'cpu_optimizations': len([r for r in self.recommendations if r['type'] == 'cpu_rightsizing']),
                'memory_optimizations': len([r for r in self.recommendations if r['type'] == 'memory_rightsizing']),
                'storage_optimizations': len([r for r in self.recommendations if r['type'] == 'unused_storage'])
            }
        }
        
        return report
        
    def apply_recommendations(self, auto_apply=False):
        """Apply optimization recommendations"""
        if not auto_apply:
            print("Dry run mode - recommendations would be:")
            
        for rec in self.recommendations:
            if rec['type'] == 'cpu_rightsizing':
                new_cpu = f"{rec['recommended_cpu']}m"
                cmd = f"kubectl patch deployment {rec['deployment']} -p '{json.dumps({'spec': {'template': {'spec': {'containers': [{'name': rec['deployment'], 'resources': {'requests': {'cpu': new_cpu}}}]}}})}'"
                print(f"Would update {rec['deployment']} CPU: {rec['current_cpu']}m -> {new_cpu}")
                
                if auto_apply:
                    subprocess.run(cmd.split())
                    
            elif rec['type'] == 'memory_rightsizing':
                new_memory = f"{rec['recommended_memory']}Mi"
                cmd = f"kubectl patch deployment {rec['deployment']} -p '{json.dumps({'spec': {'template': {'spec': {'containers': [{'name': rec['deployment'], 'resources': {'requests': {'memory': new_memory}}}]}}})}'"
                print(f"Would update {rec['deployment']} Memory: {rec['current_memory']}Mi -> {new_memory}")
                
                if auto_apply:
                    subprocess.run(cmd.split())

# Usage
if __name__ == "__main__":
    optimizer = CostOptimizer()
    report = optimizer.generate_optimization_report()
    
    print("=== Cost Optimization Report ===")
    print(f"Total potential savings: ${report['total_potential_savings']:.2f}/month")
    print(f"CPU optimizations: {report['summary']['cpu_optimizations']}")
    print(f"Memory optimizations: {report['summary']['memory_optimizations']}")
    print(f"Storage optimizations: {report['summary']['storage_optimizations']}")
    
    # Save report
    with open(f"cost-optimization-{datetime.now().strftime('%Y%m%d')}.json", 'w') as f:
        json.dump(report, f, indent=2)
```

## Performance Tuning

### JVM Tuning for Java Services

```bash
#!/bin/bash
# jvm-tuning.sh - JVM performance optimization

# Java service optimization
export JAVA_OPTS="-Xmx8g -Xms8g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UseStringDeduplication \
  -XX:+OptimizeStringConcat \
  -Djava.awt.headless=true \
  -Dfile.encoding=UTF-8"

# Monitoring flags
export JAVA_OPTS="$JAVA_OPTS \
  -XX:+PrintGC \
  -XX:+PrintGCDetails \
  -XX:+PrintGCTimeStamps \
  -Xloggc:/var/log/gc.log"

# Performance analysis
export JAVA_OPTS="$JAVA_OPTS \
  -XX:+FlightRecorder \
  -XX:StartFlightRecording=duration=60s,filename=/tmp/flight.jfr"
```

### Node.js Performance Optimization

```javascript
// performance-config.js - Node.js optimization settings
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    // Use all available CPU cores
    const numCPUs = os.cpus().length;
    console.log(`Master process ${process.pid} is running`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // Restart worker
    });
} else {
    // Worker process
    const app = require('./app');
    
    // Performance optimizations
    process.env.UV_THREADPOOL_SIZE = 128;  // Increase thread pool
    
    // Memory optimization
    if (process.env.NODE_ENV === 'production') {
        // Enable V8 optimizations
        require('v8').setFlagsFromString('--max_old_space_size=4096');
        require('v8').setFlagsFromString('--optimize_for_size');
    }
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            process.exit(0);
        });
    });
    
    const server = app.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
    });
}

// Express.js optimizations
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Enable compression
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Security headers
app.use(helmet());

// Connection pooling for databases
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,                    // Maximum number of clients
    idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

module.exports = app;
```

### Database Performance Optimization

```sql
-- database-optimization.sql - PostgreSQL performance tuning

-- Connection and memory settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Query optimization
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Logging for performance analysis
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Apply settings
SELECT pg_reload_conf();

-- Index optimization
CREATE INDEX CONCURRENTLY idx_agents_created_at ON agents(created_at) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_tasks_status_priority ON tasks(status, priority, created_at);
CREATE INDEX CONCURRENTLY idx_logs_timestamp ON logs USING BRIN (timestamp);

-- Vacuum and analyze automation
-- This should be run via cron job
SELECT pg_stat_reset();
VACUUM ANALYZE;

-- Partitioning for large tables
CREATE TABLE logs_partitioned (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    service VARCHAR(50) NOT NULL
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE logs_2025_08 PARTITION OF logs_partitioned
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
    
CREATE TABLE logs_2025_09 PARTITION OF logs_partitioned
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
```

### Automated Performance Monitoring

```bash
#!/bin/bash
# performance-monitor.sh - Continuous performance monitoring

NAMESPACE="gemini-flow"
MONITORING_INTERVAL=30
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85

monitor_performance() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] Starting performance monitoring..."
    
    # Get resource usage for all pods
    kubectl top pods -n "$NAMESPACE" --no-headers | while read line; do
        pod_name=$(echo $line | awk '{print $1}')
        cpu_usage=$(echo $line | awk '{print $2}' | sed 's/m//')
        memory_usage=$(echo $line | awk '{print $3}' | sed 's/Mi//')
        
        # Check CPU threshold
        if [[ $cpu_usage -gt $((ALERT_THRESHOLD_CPU * 10)) ]]; then
            alert_high_usage "$pod_name" "CPU" "$cpu_usage"
        fi
        
        # Check memory threshold (assuming pod limit is 8Gi = 8192Mi)
        if [[ $memory_usage -gt $((8192 * ALERT_THRESHOLD_MEMORY / 100)) ]]; then
            alert_high_usage "$pod_name" "Memory" "$memory_usage"
        fi
        
        # Log metrics
        echo "[$timestamp] $pod_name: CPU=${cpu_usage}m, Memory=${memory_usage}Mi" >> /var/log/performance-monitor.log
    done
    
    # Check service response times
    check_service_latency
    
    # Check error rates
    check_error_rates
}

check_service_latency() {
    local services=("vertex-ai" "workspace" "streaming" "agentspace")
    
    for service in "${services[@]}"; do
        local endpoint="http://${service}-service.$NAMESPACE.svc.cluster.local:8080/health"
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$endpoint" || echo "timeout")
        
        if [[ "$response_time" != "timeout" ]]; then
            local ms_time=$(echo "$response_time * 1000" | bc)
            echo "[$timestamp] $service latency: ${ms_time}ms"
            
            if (( $(echo "$ms_time > 1000" | bc -l) )); then
                alert_high_latency "$service" "$ms_time"
            fi
        else
            alert_service_down "$service"
        fi
    done
}

check_error_rates() {
    # Query Prometheus for error rates
    local error_rate=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])/rate(http_requests_total[5m])" | jq -r '.data.result[0].value[1] // 0')
    
    if (( $(echo "$error_rate > 0.01" | bc -l) )); then
        alert_high_error_rate "$error_rate"
    fi
}

alert_high_usage() {
    local pod="$1"
    local resource="$2"
    local usage="$3"
    
    echo "ALERT: High $resource usage on $pod: $usage"
    
    # Send to Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ High $resource usage on $pod: $usage\"}" \
        "$SLACK_WEBHOOK_URL"
}

alert_high_latency() {
    local service="$1"
    local latency="$2"
    
    echo "ALERT: High latency for $service: ${latency}ms"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ High latency for $service: ${latency}ms\"}" \
        "$SLACK_WEBHOOK_URL"
}

alert_service_down() {
    local service="$1"
    
    echo "ALERT: Service down: $service"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 Service down: $service\"}" \
        "$SLACK_WEBHOOK_URL"
}

alert_high_error_rate() {
    local error_rate="$1"
    
    echo "ALERT: High error rate: $(echo "$error_rate * 100" | bc)%"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 High error rate: $(echo "$error_rate * 100" | bc -l)%\"}" \
        "$SLACK_WEBHOOK_URL"
}

# Main monitoring loop
main() {
    echo "Starting continuous performance monitoring..."
    
    while true; do
        monitor_performance
        sleep $MONITORING_INTERVAL
    done
}

# Run monitoring
main "$@"
```

---

**Document Owner**: SRE Team  
**Last Updated**: August 14, 2025  
**Next Review**: November 14, 2025  
**Version**: 1.0