# Service Degradation Response Playbook

## Overview

This playbook provides step-by-step procedures for responding to service degradation incidents in the Gemini-Flow platform. The goal is to restore service levels to acceptable performance within defined SLOs while maintaining system stability.

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Response Team Structure](#response-team-structure)
3. [Detection and Alerting](#detection-and-alerting)
4. [Initial Response](#initial-response)
5. [Investigation Procedures](#investigation-procedures)
6. [Mitigation Strategies](#mitigation-strategies)
7. [Communication Templates](#communication-templates)
8. [Post-Incident Activities](#post-incident-activities)

## Incident Classification

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **SEV-1** | Complete service outage | 5 minutes | All APIs down, authentication failures |
| **SEV-2** | Significant degradation | 15 minutes | 50%+ latency increase, partial feature loss |
| **SEV-3** | Minor degradation | 1 hour | 20-50% latency increase, non-critical features affected |
| **SEV-4** | Monitoring alerts | 4 hours | Threshold warnings, capacity concerns |

### Service Level Indicators (SLIs)

```yaml
# SLI Thresholds
availability:
  target: 99.9%
  warning: 99.5%
  critical: 99.0%

latency:
  p95_target: 500ms
  p95_warning: 1000ms
  p95_critical: 2000ms
  
  p99_target: 1000ms
  p99_warning: 2000ms
  p99_critical: 5000ms

error_rate:
  target: 0.1%
  warning: 0.5%
  critical: 1.0%

throughput:
  baseline: 1000 rps
  warning_threshold: 80%
  critical_threshold: 50%
```

## Response Team Structure

### Incident Commander (IC)
- **Primary Role**: Overall incident coordination and decision making
- **Responsibilities**:
  - Declare incident severity
  - Coordinate response efforts
  - Make mitigation decisions
  - Manage external communications
  - Document timeline and decisions

### Technical Lead
- **Primary Role**: Technical investigation and mitigation
- **Responsibilities**:
  - Analyze system metrics and logs
  - Implement technical mitigations
  - Coordinate with engineering teams
  - Validate fix effectiveness

### Communications Lead
- **Primary Role**: Stakeholder communication
- **Responsibilities**:
  - Update status page
  - Notify stakeholders
  - Coordinate with customer support
  - Draft public communications

### Subject Matter Experts (SMEs)
- **Primary Role**: Specialized technical knowledge
- **Areas**: Google Cloud Platform, Vertex AI, Kubernetes, Networking

## Detection and Alerting

### Automated Monitoring

```yaml
# Prometheus Alerting Rules
groups:
- name: gemini-flow-service-degradation
  rules:
  
  # High Latency Alert
  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
    for: 2m
    labels:
      severity: warning
      service: gemini-flow
    annotations:
      summary: "High latency detected"
      description: "95th percentile latency is {{ $value }}s for {{ $labels.service }}"
      runbook_url: "https://runbooks.company.com/service-degradation"
      
  # High Error Rate Alert
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
    for: 2m
    labels:
      severity: critical
      service: gemini-flow
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.service }}"
      
  # Service Availability Alert
  - alert: ServiceDown
    expr: up{job="gemini-flow"} == 0
    for: 1m
    labels:
      severity: critical
      service: gemini-flow
    annotations:
      summary: "Service is down"
      description: "{{ $labels.instance }} of {{ $labels.service }} is down"
      
  # Resource Saturation Alert
  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
      service: gemini-flow
    annotations:
      summary: "High CPU usage"
      description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"
```

### Health Check Endpoints

```typescript
// Health check implementation
export class HealthChecker {
  async performHealthCheck(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkVertexAI(),
      this.checkDatabase(),
      this.checkExternalAPIs(),
      this.checkMemoryUsage(),
      this.checkDiskSpace()
    ]);
    
    return {
      status: checks.every(check => check.healthy) ? 'healthy' : 'degraded',
      checks: checks,
      timestamp: new Date().toISOString()
    };
  }
  
  private async checkVertexAI(): Promise<HealthCheck> {
    try {
      const response = await this.vertexAIClient.ping();
      return {
        service: 'vertex-ai',
        healthy: response.status === 'ok',
        latency: response.latency,
        details: response.details
      };
    } catch (error) {
      return {
        service: 'vertex-ai',
        healthy: false,
        error: error.message
      };
    }
  }
}
```

## Initial Response

### Immediate Actions (0-5 minutes)

1. **Acknowledge Alert**
   ```bash
   # Acknowledge in PagerDuty
   pd incident ack --incident-id <ID>
   
   # Join incident response channel
   slack join #incident-response
   ```

2. **Assess Impact**
   ```bash
   # Check service status dashboard
   open https://status.gemini-flow.com/dashboard
   
   # Review recent deployments
   kubectl rollout history deployment/gemini-flow-api
   
   # Check error rates
   curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])"
   ```

3. **Declare Incident**
   ```bash
   # Create incident in management system
   incident create --title "Service Degradation" --severity SEV-2
   
   # Notify stakeholders
   scripts/notify-stakeholders.sh SEV-2
   ```

### Initial Investigation (5-15 minutes)

1. **Gather System Metrics**
   ```bash
   #!/bin/bash
   # scripts/gather-metrics.sh
   
   echo "=== System Metrics Collection ==="
   echo "Timestamp: $(date)"
   
   # Service health
   echo "--- Service Health ---"
   kubectl get pods -n gemini-flow -o wide
   
   # Resource utilization
   echo "--- Resource Utilization ---"
   kubectl top nodes
   kubectl top pods -n gemini-flow
   
   # Recent events
   echo "--- Recent Events ---"
   kubectl get events --sort-by='.lastTimestamp' -n gemini-flow | tail -20
   
   # Error logs
   echo "--- Error Logs ---"
   kubectl logs -n gemini-flow -l app=gemini-flow --since=10m | grep -i error | tail -50
   ```

2. **Check Dependencies**
   ```bash
   # Google Cloud Services status
   curl -s "https://status.cloud.google.com/incidents.json" | jq '.[] | select(.begin > "'$(date -d '1 hour ago' -Iseconds)'")'
   
   # Vertex AI API status
   gcloud ai models list --location=us-central1 --limit=1 > /dev/null 2>&1
   echo "Vertex AI Status: $?"
   
   # Database connectivity
   scripts/test-db-connection.sh
   ```

## Investigation Procedures

### Performance Investigation

```bash
#!/bin/bash
# scripts/investigate-performance.sh

investigate_latency() {
    echo "=== Latency Investigation ==="
    
    # Current latency metrics
    echo "--- Current P95 Latency ---"
    curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq '.data.result[0].value[1]'
    
    # Latency by endpoint
    echo "--- Latency by Endpoint ---"
    curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket{job=\"gemini-flow\"}[5m]))&step=60" | jq '.data.result[] | {endpoint: .metric.handler, latency: .value[1]}'
    
    # Database query performance
    echo "--- Database Performance ---"
    kubectl exec -n gemini-flow deployment/gemini-flow-api -- npm run db:slow-queries
}

investigate_errors() {
    echo "=== Error Investigation ==="
    
    # Error rate trends
    echo "--- Error Rate Trends ---"
    curl -s "http://prometheus:9090/api/v1/query_range?query=rate(http_requests_total{status=~\"5..\"}[5m])&start=$(date -d '1 hour ago' +%s)&end=$(date +%s)&step=300" | jq '.data.result[0].values[-5:]'
    
    # Error breakdown by status code
    echo "--- Error Breakdown ---"
    kubectl logs -n gemini-flow -l app=gemini-flow --since=30m | grep "HTTP/1.1 5" | awk '{print $9}' | sort | uniq -c | sort -nr
    
    # Recent exceptions
    echo "--- Recent Exceptions ---"
    kubectl logs -n gemini-flow -l app=gemini-flow --since=30m | grep -i "exception\|error" | tail -20
}

investigate_resources() {
    echo "=== Resource Investigation ==="
    
    # CPU and Memory usage
    echo "--- Resource Usage ---"
    kubectl top pods -n gemini-flow --sort-by=cpu
    kubectl top pods -n gemini-flow --sort-by=memory
    
    # Resource limits vs usage
    echo "--- Resource Limits ---"
    kubectl describe pods -n gemini-flow | grep -A 5 "Limits:\|Requests:"
    
    # Storage usage
    echo "--- Storage Usage ---"
    kubectl exec -n gemini-flow deployment/gemini-flow-api -- df -h
}
```

### Root Cause Analysis

```bash
#!/bin/bash
# scripts/root-cause-analysis.sh

analyze_recent_changes() {
    echo "=== Recent Changes Analysis ==="
    
    # Recent deployments
    echo "--- Recent Deployments ---"
    kubectl rollout history deployment/gemini-flow-api -n gemini-flow | tail -5
    
    # Configuration changes
    echo "--- Configuration Changes ---"
    git log --oneline --since="2 hours ago" -- config/
    
    # Infrastructure changes
    echo "--- Infrastructure Changes ---"
    gcloud logging read 'protoPayload.serviceName="cloudresourcemanager.googleapis.com" AND timestamp>="'$(date -d '2 hours ago' -Iseconds)'"' --limit=10
}

analyze_external_dependencies() {
    echo "=== External Dependencies Analysis ==="
    
    # Google Cloud API status
    echo "--- Google Cloud APIs ---"
    for api in aiplatform.googleapis.com storage.googleapis.com; do
        status=$(gcloud services list --enabled --filter="name:$api" --format="value(name)" | wc -l)
        echo "$api: $([ $status -eq 1 ] && echo 'enabled' || echo 'disabled')"
    done
    
    # Network connectivity
    echo "--- Network Connectivity ---"
    kubectl exec -n gemini-flow deployment/gemini-flow-api -- nslookup aiplatform.googleapis.com
    kubectl exec -n gemini-flow deployment/gemini-flow-api -- ping -c 3 8.8.8.8
}

analyze_patterns() {
    echo "=== Pattern Analysis ==="
    
    # Traffic patterns
    echo "--- Traffic Patterns ---"
    curl -s "http://prometheus:9090/api/v1/query_range?query=rate(http_requests_total[5m])&start=$(date -d '2 hours ago' +%s)&end=$(date +%s)&step=300" | jq '.data.result[0].values[-24:]' | jq -r '.[] | "\(.[0] | strftime("%H:%M")): \(.[1])"'
    
    # Error patterns
    echo "--- Error Patterns ---"
    kubectl logs -n gemini-flow -l app=gemini-flow --since=2h | grep -o "HTTP/1.1 [45][0-9][0-9]" | sort | uniq -c | sort -nr
}
```

## Mitigation Strategies

### Immediate Mitigations

1. **Scale Up Resources**
   ```bash
   # Horizontal scaling
   kubectl scale deployment gemini-flow-api --replicas=10 -n gemini-flow
   
   # Vertical scaling (requires restart)
   kubectl patch deployment gemini-flow-api -n gemini-flow -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"requests":{"cpu":"2","memory":"4Gi"},"limits":{"cpu":"4","memory":"8Gi"}}}]}}}}'
   ```

2. **Circuit Breaker Activation**
   ```bash
   # Enable circuit breaker for external APIs
   kubectl patch configmap gemini-flow-config -n gemini-flow --patch '{"data":{"circuit_breaker_enabled":"true"}}'
   
   # Restart pods to pick up config
   kubectl rollout restart deployment/gemini-flow-api -n gemini-flow
   ```

3. **Rate Limiting**
   ```bash
   # Apply rate limiting
   kubectl apply -f - <<EOF
   apiVersion: networking.istio.io/v1beta1
   kind: EnvoyFilter
   metadata:
     name: rate-limit
     namespace: gemini-flow
   spec:
     configPatches:
     - applyTo: HTTP_FILTER
       match:
         context: SIDECAR_INBOUND
         listener:
           filterChain:
             filter:
               name: "envoy.filters.network.http_connection_manager"
       patch:
         operation: INSERT_BEFORE
         value:
           name: envoy.filters.http.local_ratelimit
           typed_config:
             "@type": type.googleapis.com/udpa.type.v1.TypedStruct
             type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
             value:
               stat_prefix: local_rate_limiter
               token_bucket:
                 max_tokens: 100
                 tokens_per_fill: 100
                 fill_interval: 60s
   EOF
   ```

### Progressive Mitigations

1. **Gradual Rollback**
   ```bash
   #!/bin/bash
   # scripts/gradual-rollback.sh
   
   NAMESPACE="gemini-flow"
   DEPLOYMENT="gemini-flow-api"
   
   echo "Starting gradual rollback..."
   
   # Get current and previous versions
   CURRENT_REVISION=$(kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE | tail -1 | awk '{print $1}')
   PREVIOUS_REVISION=$((CURRENT_REVISION - 1))
   
   echo "Rolling back from revision $CURRENT_REVISION to $PREVIOUS_REVISION"
   
   # Rollback 25% of pods
   TOTAL_REPLICAS=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE -o jsonpath='{.spec.replicas}')
   ROLLBACK_REPLICAS=$((TOTAL_REPLICAS / 4))
   
   kubectl patch deployment $DEPLOYMENT -n $NAMESPACE -p "{\"spec\":{\"replicas\":$ROLLBACK_REPLICAS}}"
   kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE --to-revision=$PREVIOUS_REVISION
   
   # Wait and monitor
   sleep 300
   
   # Check if improvement
   if check_service_health; then
       echo "Partial rollback successful, continuing..."
       kubectl scale deployment $DEPLOYMENT --replicas=$TOTAL_REPLICAS -n $NAMESPACE
   else
       echo "Partial rollback failed, full rollback required"
       kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
   fi
   ```

2. **Feature Flag Disable**
   ```bash
   # Disable problematic features
   kubectl patch configmap gemini-flow-feature-flags -n gemini-flow --patch '{"data":{"multimodal_streaming":"false","agentspace_enabled":"false"}}'
   
   # Reload configuration
   kubectl rollout restart deployment/gemini-flow-api -n gemini-flow
   ```

## Communication Templates

### Internal Status Update

```markdown
## Incident Status Update

**Incident ID**: INC-2025-0814-001
**Severity**: SEV-2
**Status**: Investigating
**Started**: 2025-08-14 14:30 UTC
**Last Updated**: 2025-08-14 14:45 UTC

### Current Impact
- 45% increase in API response latency
- Affecting approximately 30% of users
- No data loss or security impact

### Current Actions
- Investigating high latency in Vertex AI connector
- Scaling up API instances from 5 to 10
- Monitoring error rates and user impact

### Next Update
Next update in 15 minutes (15:00 UTC) or upon significant change.

**Incident Commander**: Jane Doe
**Technical Lead**: John Smith
```

### External Status Page Update

```markdown
## Service Performance Issue

**Status**: Monitoring
**Started**: Aug 14, 14:30 UTC

We are currently experiencing elevated response times for some API requests. We have identified the cause and are implementing a fix. User data remains secure and unaffected.

### Timeline
- **14:30 UTC**: Issue detected via monitoring alerts
- **14:35 UTC**: Engineering team engaged, investigating root cause
- **14:40 UTC**: Scaling up backend services to mitigate impact
- **14:45 UTC**: Performance showing improvement, continuing to monitor

We will provide another update in 15 minutes.
```

### Customer Communication Template

```markdown
Subject: Service Performance Update - [DATE]

Dear Valued Customer,

We want to inform you about a service performance issue that may have affected your experience with Gemini-Flow between [START_TIME] and [END_TIME] UTC.

**What Happened:**
Some users experienced slower than normal response times when using our API services.

**Impact:**
- API response times were elevated by approximately 45%
- No data loss or unauthorized access occurred
- All services remained operational

**Resolution:**
Our engineering team quickly identified and resolved the issue by scaling our infrastructure and optimizing service configurations.

**What We're Doing:**
- Conducting a thorough post-incident review
- Implementing additional monitoring to prevent similar issues
- Strengthening our infrastructure resilience

We sincerely apologize for any inconvenience this may have caused. If you have any questions or concerns, please don't hesitate to contact our support team.

Best regards,
The Gemini-Flow Team
```

## Post-Incident Activities

### Immediate Post-Incident (0-24 hours)

1. **Incident Closure**
   ```bash
   # Update incident status
   incident update --id INC-2025-0814-001 --status resolved
   
   # Send final notification
   scripts/send-resolution-notice.sh INC-2025-0814-001
   ```

2. **Metric Collection**
   ```bash
   #!/bin/bash
   # scripts/collect-incident-metrics.sh
   
   INCIDENT_START="2025-08-14T14:30:00Z"
   INCIDENT_END="2025-08-14T15:15:00Z"
   
   echo "=== Incident Metrics Collection ==="
   
   # Duration
   DURATION=$(( $(date -d "$INCIDENT_END" +%s) - $(date -d "$INCIDENT_START" +%s) ))
   echo "Incident Duration: $((DURATION / 60)) minutes"
   
   # User Impact
   AFFECTED_REQUESTS=$(curl -s "http://prometheus:9090/api/v1/query_range?query=rate(http_requests_total[5m])&start=$(date -d "$INCIDENT_START" +%s)&end=$(date -d "$INCIDENT_END" +%s)&step=60" | jq '.data.result[0].values | map(.[1] | tonumber) | add')
   echo "Affected Requests: $AFFECTED_REQUESTS"
   
   # Availability Impact
   DOWNTIME_PERCENTAGE=$(echo "scale=2; $DURATION / 86400 * 100" | bc)
   echo "Availability Impact: ${DOWNTIME_PERCENTAGE}%"
   ```

### Post-Incident Review (1-3 days)

```markdown
# Post-Incident Review Template

## Incident Summary
- **Incident ID**: INC-2025-0814-001
- **Date/Time**: August 14, 2025, 14:30-15:15 UTC
- **Duration**: 45 minutes
- **Severity**: SEV-2
- **Services Affected**: Gemini-Flow API, Vertex AI Connector

## Impact Assessment
- **Users Affected**: ~30% of active users
- **Revenue Impact**: Estimated $X based on usage patterns
- **Availability**: 99.85% (monthly SLO: 99.9%)
- **Customer Complaints**: 5 support tickets

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 14:30 | Monitoring alerts for high latency |
| 14:32 | On-call engineer paged |
| 14:35 | Incident declared, team assembled |
| 14:40 | Root cause identified: Resource exhaustion |
| 14:45 | Mitigation started: Scaling up services |
| 15:00 | Performance returning to normal |
| 15:15 | Incident resolved, monitoring continues |

## Root Cause
Unexpected traffic spike (3x normal) combined with inefficient database queries caused resource exhaustion in the Vertex AI connector service.

## Contributing Factors
1. Missing autoscaling configuration for Vertex AI connector
2. Unoptimized database queries for agent coordination
3. Insufficient capacity planning for traffic spikes
4. Delayed alerting on resource utilization

## What Went Well
- Quick detection via monitoring (2 minutes)
- Effective team communication and coordination
- Successful mitigation within SLO timeframe
- No data loss or security compromise

## What Could Be Improved
- Faster root cause identification (took 10 minutes)
- Better autoscaling for all services
- More proactive capacity monitoring
- Clearer escalation procedures

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Implement autoscaling for Vertex AI connector | SRE Team | Aug 21 | High |
| Optimize database queries in agent coordination | Dev Team | Aug 28 | High |
| Enhance capacity monitoring dashboards | SRE Team | Aug 25 | Medium |
| Update incident response procedures | SRE Team | Aug 18 | Medium |
| Conduct tabletop exercise | All Teams | Sep 1 | Low |

## Lessons Learned
1. Always configure autoscaling for customer-facing services
2. Regular performance testing under load is critical
3. Database optimization should be part of code review process
4. Capacity planning must account for unexpected traffic patterns
```

---

**Document Owner**: SRE Team  
**Last Updated**: August 14, 2025  
**Next Review**: November 14, 2025  
**Version**: 1.0