# Service Startup and Shutdown Procedures

## Overview

This document provides step-by-step procedures for safely starting up and shutting down Google Services components in the Gemini-Flow platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Startup Procedures](#startup-procedures)
3. [Shutdown Procedures](#shutdown-procedures)
4. [Health Verification](#health-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Automation Scripts](#automation-scripts)

## Prerequisites

### Required Access
- [ ] Google Cloud Console access with Project Editor role
- [ ] Kubernetes cluster access (if using GKE)
- [ ] Monitoring dashboard access (Grafana/Cloud Monitoring)
- [ ] PagerDuty/alerting system access

### Pre-Startup Checklist
- [ ] Verify all dependencies are healthy
- [ ] Check service account credentials
- [ ] Confirm database connectivity
- [ ] Validate configuration files
- [ ] Review recent error logs

## Startup Procedures

### 1. Core Services Startup

#### 1.1 Vertex AI Connector
```bash
# Verify Vertex AI service account
gcloud auth application-default login
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Start Vertex AI connector
npm run start:vertex-ai

# Verify health
curl -f http://localhost:8080/health/vertex-ai || exit 1
```

#### 1.2 Google Workspace Integration
```bash
# Configure OAuth2 credentials
export GOOGLE_WORKSPACE_CLIENT_ID="your-client-id"
export GOOGLE_WORKSPACE_CLIENT_SECRET="your-client-secret"

# Start workspace service
npm run start:workspace

# Health check
curl -f http://localhost:8081/health/workspace || exit 1
```

#### 1.3 Streaming API Services
```bash
# Start multimodal streaming
npm run start:streaming

# Verify WebRTC connectivity
npm run test:webrtc-connectivity

# Check streaming endpoints
curl -f http://localhost:8082/health/streaming || exit 1
```

### 2. Agent Services Startup

#### 2.1 AgentSpace Manager
```bash
# Initialize agent memory
npm run init:agent-memory

# Start AgentSpace service
npm run start:agentspace

# Verify agent spawning capability
npm run test:agent-spawn || exit 1
```

#### 2.2 A2A Protocol Manager
```bash
# Start A2A message router
npm run start:a2a-router

# Initialize consensus protocols
npm run init:consensus

# Health verification
curl -f http://localhost:8083/health/a2a || exit 1
```

### 3. Media Services Startup

#### 3.1 Veo3 Video Generation
```bash
# Start video generation service
npm run start:veo3

# Verify GPU allocation
nvidia-smi
kubectl get nodes -l accelerator=nvidia-tesla-v100

# Test video generation endpoint
curl -f http://localhost:8084/health/veo3 || exit 1
```

#### 3.2 Imagen4 Image Generation
```bash
# Start image generation service
npm run start:imagen4

# Check storage connectivity
gsutil ls gs://your-media-bucket

# Health check
curl -f http://localhost:8085/health/imagen4 || exit 1
```

### 4. Research Services Startup

#### 4.1 Co-Scientist Integration
```bash
# Start research coordinator
npm run start:co-scientist

# Verify academic database connections
npm run test:academic-db-connectivity

# Health verification
curl -f http://localhost:8086/health/co-scientist || exit 1
```

#### 4.2 Project Mariner
```bash
# Start browser automation service
npm run start:mariner

# Verify Puppeteer/Selenium grid
npm run test:browser-grid

# Health check
curl -f http://localhost:8087/health/mariner || exit 1
```

### 5. Post-Startup Verification

```bash
#!/bin/bash
# Complete system health check
echo "=== Gemini-Flow Startup Verification ==="

services=(
    "vertex-ai:8080"
    "workspace:8081" 
    "streaming:8082"
    "agentspace:8083"
    "a2a-router:8083"
    "veo3:8084"
    "imagen4:8085"
    "co-scientist:8086"
    "mariner:8087"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f --max-time 10 http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name service healthy"
    else
        echo "❌ $name service unhealthy"
        exit 1
    fi
done

echo "=== All services started successfully ==="
```

## Shutdown Procedures

### 1. Graceful Shutdown Sequence

#### Step 1: Stop accepting new requests
```bash
# Drain load balancer traffic
kubectl scale deployment gemini-flow-lb --replicas=0

# Wait for connection draining (30 seconds)
sleep 30
```

#### Step 2: Complete in-flight requests
```bash
# Monitor active connections
ss -tulpn | grep :8080

# Wait for completion (max 5 minutes)
timeout 300 bash -c 'while [[ $(ss -tulpn | grep :8080 | wc -l) -gt 0 ]]; do sleep 5; done'
```

#### Step 3: Shutdown services in reverse dependency order
```bash
# Stop research services first
npm run stop:co-scientist
npm run stop:mariner

# Stop media generation services
npm run stop:veo3
npm run stop:imagen4

# Stop agent coordination
npm run stop:agentspace
npm run stop:a2a-router

# Stop streaming services
npm run stop:streaming

# Stop core services
npm run stop:workspace
npm run stop:vertex-ai
```

### 2. Emergency Shutdown

```bash
#!/bin/bash
# Emergency shutdown - immediate termination
echo "=== EMERGENCY SHUTDOWN INITIATED ==="

# Kill all gemini-flow processes
pkill -f "gemini-flow"
pkill -f "vertex-ai"
pkill -f "workspace"

# Stop Docker containers
docker stop $(docker ps -q --filter "label=app=gemini-flow")

# Kubernetes emergency shutdown
kubectl delete pods -l app=gemini-flow --force --grace-period=0

echo "=== Emergency shutdown complete ==="
```

## Health Verification

### Automated Health Checks

```bash
#!/bin/bash
# health-check.sh - Comprehensive health verification

check_service_health() {
    local service_name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    
    if [[ "$response" == "$expected_status" ]]; then
        echo "✅ $service_name: Healthy (HTTP $response)"
        return 0
    else
        echo "❌ $service_name: Unhealthy (HTTP $response)"
        return 1
    fi
}

check_database_connectivity() {
    if npm run test:db-connection > /dev/null 2>&1; then
        echo "✅ Database: Connected"
        return 0
    else
        echo "❌ Database: Connection failed"
        return 1
    fi
}

check_external_apis() {
    # Test Google Cloud APIs
    if gcloud auth application-default print-access-token > /dev/null 2>&1; then
        echo "✅ Google Cloud Auth: Valid"
    else
        echo "❌ Google Cloud Auth: Invalid"
        return 1
    fi
    
    # Test Vertex AI
    if curl -f "https://aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations" \
       -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" > /dev/null 2>&1; then
        echo "✅ Vertex AI API: Accessible"
    else
        echo "❌ Vertex AI API: Inaccessible"
        return 1
    fi
}

main() {
    echo "=== Gemini-Flow Health Check ==="
    echo "Timestamp: $(date)"
    
    failed_checks=0
    
    # Core service health checks
    check_service_health "Vertex AI" "http://localhost:8080/health" || ((failed_checks++))
    check_service_health "Workspace" "http://localhost:8081/health" || ((failed_checks++))
    check_service_health "Streaming" "http://localhost:8082/health" || ((failed_checks++))
    check_service_health "AgentSpace" "http://localhost:8083/health" || ((failed_checks++))
    
    # Database and external API checks
    check_database_connectivity || ((failed_checks++))
    check_external_apis || ((failed_checks++))
    
    if [[ $failed_checks -eq 0 ]]; then
        echo "=== All health checks passed ==="
        exit 0
    else
        echo "=== $failed_checks health checks failed ==="
        exit 1
    fi
}

main "$@"
```

## Rollback Procedures

### Automated Rollback Script

```bash
#!/bin/bash
# rollback.sh - Automated service rollback

ROLLBACK_VERSION=${1:-"previous"}
NAMESPACE=${2:-"default"}

echo "=== Initiating rollback to $ROLLBACK_VERSION ==="

# Kubernetes rollback
kubectl rollout undo deployment/gemini-flow-api -n $NAMESPACE
kubectl rollout undo deployment/gemini-flow-agents -n $NAMESPACE
kubectl rollout undo deployment/gemini-flow-streaming -n $NAMESPACE

# Wait for rollback completion
kubectl rollout status deployment/gemini-flow-api -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/gemini-flow-agents -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/gemini-flow-streaming -n $NAMESPACE --timeout=300s

# Verify rollback success
if ./health-check.sh; then
    echo "✅ Rollback successful"
else
    echo "❌ Rollback failed - manual intervention required"
    exit 1
fi
```

## Automation Scripts

### Service Management Script

```bash
#!/bin/bash
# service-manager.sh - Unified service management

ACTION=$1
SERVICE=$2

case $ACTION in
    "start")
        case $SERVICE in
            "all")
                ./startup-all.sh
                ;;
            *)
                npm run start:$SERVICE
                ;;
        esac
        ;;
    "stop")
        case $SERVICE in
            "all")
                ./shutdown-all.sh
                ;;
            *)
                npm run stop:$SERVICE
                ;;
        esac
        ;;
    "restart")
        npm run stop:$SERVICE
        sleep 10
        npm run start:$SERVICE
        ;;
    "status")
        ./health-check.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status} {service_name|all}"
        exit 1
        ;;
esac
```

## Monitoring Integration

### Startup Metrics Collection

```bash
# Collect startup metrics
echo "startup_duration_seconds $(date +%s)" | curl -X POST http://pushgateway:9091/metrics/job/gemini-flow-startup
```

### Health Check Automation

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  healthcheck:
    image: curlimages/curl:latest
    command: |
      sh -c "
        while true; do
          if curl -f http://gemini-flow:8080/health; then
            echo 'health_check{service=\"gemini-flow\"} 1' | curl -X POST http://pushgateway:9091/metrics/job/health_check/instance/gemini-flow
          else
            echo 'health_check{service=\"gemini-flow\"} 0' | curl -X POST http://pushgateway:9091/metrics/job/health_check/instance/gemini-flow
          fi
          sleep 30
        done
      "
    depends_on:
      - gemini-flow
    restart: unless-stopped
```

## Troubleshooting Common Issues

### Service Won't Start

1. **Check logs**: `kubectl logs deployment/gemini-flow-api`
2. **Verify credentials**: `gcloud auth application-default print-access-token`
3. **Check resource availability**: `kubectl top nodes`
4. **Validate configuration**: `npm run config:validate`

### Service Fails Health Check

1. **Check service logs**: `kubectl logs -l app=gemini-flow --tail=100`
2. **Verify database connection**: `npm run test:db-connection`
3. **Check external API access**: `curl -f https://aiplatform.googleapis.com`
4. **Restart unhealthy service**: `kubectl rollout restart deployment/service-name`

### Performance Degradation During Startup

1. **Increase resource limits**: Edit Kubernetes resource definitions
2. **Stagger service startup**: Add delays between service starts
3. **Check CPU/Memory usage**: `kubectl top pods`
4. **Review startup logs**: Look for initialization bottlenecks

---

**Document Owner**: SRE Team  
**Last Updated**: August 14, 2025  
**Next Review**: November 14, 2025  
**Version**: 1.0