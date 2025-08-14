#!/bin/bash

# production-deployment.sh - Production deployment automation for Gemini-Flow
# This script implements blue-green deployment with comprehensive safety checks

set -euo pipefail

# Configuration
NAMESPACE="gemini-flow-prod"
DEPLOYMENT_NAME="gemini-flow-api"
SERVICE_NAME="gemini-flow-service"
HEALTH_CHECK_URL="http://localhost:8080/health"
ROLLBACK_TIMEOUT=300
DEPLOYMENT_TIMEOUT=600
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Send Slack notification
send_slack_notification() {
    local message="$1"
    local color="${2:-#36a64f}"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check required tools
    for tool in kubectl helm gcloud; do
        if ! command -v $tool &> /dev/null; then
            error "$tool is not installed"
            exit 1
        fi
    done
    
    # Check kubectl context
    local current_context=$(kubectl config current-context)
    log "Current kubectl context: $current_context"
    
    if [[ "$current_context" != *"prod"* ]]; then
        error "Not connected to production cluster"
        exit 1
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        error "Namespace $NAMESPACE does not exist"
        exit 1
    fi
    
    # Check required secrets exist
    for secret in gemini-flow-secrets google-service-account; do
        if ! kubectl get secret "$secret" -n "$NAMESPACE" &> /dev/null; then
            error "Required secret $secret not found"
            exit 1
        fi
    done
    
    log "Prerequisites check passed"
}

# Pre-deployment safety checks
pre_deployment_checks() {
    log "Running pre-deployment safety checks..."
    
    # Check cluster resources
    local cpu_usage=$(kubectl top nodes --no-headers | awk '{sum += $3} END {print sum/NR}' | sed 's/%//')
    local memory_usage=$(kubectl top nodes --no-headers | awk '{sum += $5} END {print sum/NR}' | sed 's/%//')
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        error "Cluster CPU usage too high: ${cpu_usage}%"
        exit 1
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        error "Cluster memory usage too high: ${memory_usage}%"
        exit 1
    fi
    
    # Check current service health
    local healthy_pods=$(kubectl get pods -n "$NAMESPACE" -l app=gemini-flow --field-selector=status.phase=Running | wc -l)
    local total_pods=$(kubectl get pods -n "$NAMESPACE" -l app=gemini-flow | tail -n +2 | wc -l)
    
    if [[ $healthy_pods -lt $((total_pods * 80 / 100)) ]]; then
        error "Too many unhealthy pods: $healthy_pods/$total_pods"
        exit 1
    fi
    
    # Check external dependencies
    log "Checking external dependencies..."
    
    # Vertex AI API
    if ! gcloud ai models list --location=us-central1 --limit=1 &> /dev/null; then
        error "Vertex AI API is not accessible"
        exit 1
    fi
    
    # Google Cloud Storage
    if ! gsutil ls gs://gemini-flow-prod-storage/ &> /dev/null; then
        error "Production storage bucket is not accessible"
        exit 1
    fi
    
    log "Pre-deployment checks passed"
}

# Create deployment backup
create_backup() {
    log "Creating deployment backup..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup current deployment
    kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" -o yaml > "$backup_dir/deployment.yaml"
    kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o yaml > "$backup_dir/service.yaml"
    kubectl get configmap -n "$NAMESPACE" -o yaml > "$backup_dir/configmaps.yaml"
    
    # Backup database
    log "Creating database backup..."
    kubectl exec -n "$NAMESPACE" deployment/gemini-flow-db -- pg_dump -U postgres gemini_flow | gzip > "$backup_dir/database.sql.gz"
    
    echo "$backup_dir" > /tmp/backup_path
    log "Backup created at: $backup_dir"
}

# Deploy new version using blue-green strategy
deploy_blue_green() {
    local new_image="$1"
    local current_slot=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "blue")
    local target_slot="green"
    
    if [[ "$current_slot" == "green" ]]; then
        target_slot="blue"
    fi
    
    log "Deploying $new_image to $target_slot slot (current: $current_slot)"
    
    # Create target deployment if it doesn't exist
    if ! kubectl get deployment "${DEPLOYMENT_NAME}-${target_slot}" -n "$NAMESPACE" &> /dev/null; then
        log "Creating $target_slot deployment..."
        kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" -o yaml | \
        sed "s/name: $DEPLOYMENT_NAME/name: ${DEPLOYMENT_NAME}-${target_slot}/" | \
        sed "s/slot: $current_slot/slot: $target_slot/" | \
        kubectl apply -f -
    fi
    
    # Update target deployment with new image
    log "Updating $target_slot deployment with new image..."
    kubectl set image deployment/"${DEPLOYMENT_NAME}-${target_slot}" \
        app="$new_image" -n "$NAMESPACE"
    
    # Wait for rollout to complete
    log "Waiting for rollout to complete..."
    if ! kubectl rollout status deployment/"${DEPLOYMENT_NAME}-${target_slot}" \
        -n "$NAMESPACE" --timeout="${DEPLOYMENT_TIMEOUT}s"; then
        error "Deployment rollout failed"
        return 1
    fi
    
    # Health check new deployment
    log "Performing health checks on new deployment..."
    if ! health_check_deployment "${target_slot}"; then
        error "Health check failed for new deployment"
        return 1
    fi
    
    # Switch traffic
    log "Switching traffic to $target_slot slot..."
    kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"slot\":\"$target_slot\"}}}"
    
    # Final health check
    sleep 30
    if ! health_check_service; then
        error "Service health check failed after traffic switch"
        return 1
    fi
    
    log "Blue-green deployment completed successfully"
    return 0
}

# Health check for specific deployment
health_check_deployment() {
    local slot="$1"
    local max_attempts=12
    local attempt=1
    
    log "Health checking $slot deployment..."
    
    while [[ $attempt -le $max_attempts ]]; do
        local ready_replicas=$(kubectl get deployment "${DEPLOYMENT_NAME}-${slot}" -n "$NAMESPACE" \
            -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired_replicas=$(kubectl get deployment "${DEPLOYMENT_NAME}-${slot}" -n "$NAMESPACE" \
            -o jsonpath='{.spec.replicas}')
        
        if [[ "$ready_replicas" == "$desired_replicas" ]] && [[ "$ready_replicas" -gt 0 ]]; then
            # Test endpoint health
            local pod_name=$(kubectl get pods -n "$NAMESPACE" -l "app=gemini-flow,slot=$slot" \
                -o jsonpath='{.items[0].metadata.name}')
            
            if kubectl exec -n "$NAMESPACE" "$pod_name" -- \
                curl -f --max-time 10 "$HEALTH_CHECK_URL" &> /dev/null; then
                log "$slot deployment is healthy"
                return 0
            fi
        fi
        
        log "Attempt $attempt/$max_attempts: $ready_replicas/$desired_replicas replicas ready"
        ((attempt++))
        sleep 15
    done
    
    error "$slot deployment failed health check"
    return 1
}

# Health check for service
health_check_service() {
    log "Performing comprehensive service health check..."
    
    # Test all health endpoints
    local endpoints=(
        "/health"
        "/health/vertex-ai"
        "/health/database"
        "/health/storage"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -f --max-time 10 "http://gemini-flow-service.$NAMESPACE.svc.cluster.local:8080$endpoint" &> /dev/null; then
            error "Health check failed for endpoint: $endpoint"
            return 1
        fi
    done
    
    # Test actual functionality
    log "Testing API functionality..."
    local test_response=$(kubectl run test-pod --rm -i --restart=Never --image=curlimages/curl -- \
        curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"message": "health check test"}' \
        "http://gemini-flow-service.$NAMESPACE.svc.cluster.local:8080/api/v1/test")
    
    if [[ "$test_response" == *"success"* ]]; then
        log "Service health check passed"
        return 0
    else
        error "Service functionality test failed"
        return 1
    fi
}

# Rollback deployment
rollback_deployment() {
    local backup_dir=$(cat /tmp/backup_path 2>/dev/null || echo "")
    
    error "Rolling back deployment..."
    send_slack_notification "🚨 Production deployment failed, initiating rollback" "#ff0000"
    
    if [[ -n "$backup_dir" && -d "$backup_dir" ]]; then
        log "Restoring from backup: $backup_dir"
        
        # Restore deployment
        kubectl apply -f "$backup_dir/deployment.yaml"
        kubectl apply -f "$backup_dir/service.yaml"
        kubectl apply -f "$backup_dir/configmaps.yaml"
        
        # Wait for rollback
        kubectl rollout status deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout="${ROLLBACK_TIMEOUT}s"
        
        # Restore database if needed
        if [[ -f "$backup_dir/database.sql.gz" ]]; then
            warn "Database rollback available but not automated. Manual intervention may be required."
        fi
    else
        log "Using kubectl rollback..."
        kubectl rollout undo deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE"
        kubectl rollout status deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout="${ROLLBACK_TIMEOUT}s"
    fi
    
    # Verify rollback
    if health_check_service; then
        log "Rollback completed successfully"
        send_slack_notification "✅ Production rollback completed successfully" "#36a64f"
    else
        error "Rollback failed - manual intervention required"
        send_slack_notification "🚨 Production rollback failed - manual intervention required" "#ff0000"
        exit 1
    fi
}

# Cleanup old deployments
cleanup_old_deployments() {
    log "Cleaning up old deployments..."
    
    # Keep last 3 replica sets
    kubectl delete replicaset -n "$NAMESPACE" -l app=gemini-flow \
        --field-selector='metadata.name!=active' \
        $(kubectl get replicaset -n "$NAMESPACE" -l app=gemini-flow \
            --sort-by=.metadata.creationTimestamp \
            -o name | head -n -3) 2>/dev/null || true
    
    # Cleanup old backups (keep last 10)
    if [[ -d "backups" ]]; then
        find backups -maxdepth 1 -type d -name "20*" | sort | head -n -10 | xargs rm -rf 2>/dev/null || true
    fi
    
    log "Cleanup completed"
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Performance test
    log "Running performance test..."
    kubectl run perf-test --rm -i --restart=Never --image=fortio/fortio -- \
        fortio load -c 10 -t 30s \
        "http://gemini-flow-service.$NAMESPACE.svc.cluster.local:8080/health"
    
    # Integration test
    log "Running integration tests..."
    kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: integration-test-$(date +%s)
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: test
        image: gemini-flow:integration-tests
        env:
        - name: API_ENDPOINT
          value: "http://gemini-flow-service.$NAMESPACE.svc.cluster.local:8080"
        command: ["npm", "run", "test:integration"]
      restartPolicy: Never
  backoffLimit: 1
EOF
    
    # Wait for integration tests
    local job_name=$(kubectl get jobs -n "$NAMESPACE" --sort-by=.metadata.creationTimestamp -o name | tail -1)
    kubectl wait --for=condition=complete --timeout=300s "$job_name" -n "$NAMESPACE"
    
    local test_status=$(kubectl get "$job_name" -n "$NAMESPACE" -o jsonpath='{.status.succeeded}')
    if [[ "$test_status" == "1" ]]; then
        log "Integration tests passed"
    else
        warn "Integration tests failed - check logs"
        kubectl logs "$job_name" -n "$NAMESPACE"
    fi
    
    # Cleanup test job
    kubectl delete "$job_name" -n "$NAMESPACE"
}

# Monitor deployment
monitor_deployment() {
    local duration=${1:-1800}  # 30 minutes default
    log "Monitoring deployment for $duration seconds..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Check error rate
        local error_rate=$(kubectl logs -n "$NAMESPACE" -l app=gemini-flow --since=60s | \
            grep -c "ERROR\|5[0-9][0-9]" || echo "0")
        
        if [[ $error_rate -gt 10 ]]; then
            error "High error rate detected: $error_rate errors in last minute"
            return 1
        fi
        
        # Check pod health
        local unhealthy_pods=$(kubectl get pods -n "$NAMESPACE" -l app=gemini-flow \
            --field-selector=status.phase!=Running | tail -n +2 | wc -l)
        
        if [[ $unhealthy_pods -gt 0 ]]; then
            error "Unhealthy pods detected: $unhealthy_pods"
            return 1
        fi
        
        sleep 60
    done
    
    log "Deployment monitoring completed successfully"
}

# Main deployment function
main() {
    local new_image="$1"
    local skip_tests="${2:-false}"
    
    if [[ -z "$new_image" ]]; then
        error "Usage: $0 <image_tag> [skip_tests]"
        exit 1
    fi
    
    log "Starting production deployment for image: $new_image"
    send_slack_notification "🚀 Starting production deployment for $new_image"
    
    # Trap for cleanup on exit
    trap 'if [[ $? -ne 0 ]]; then rollback_deployment; fi' ERR
    
    # Deployment steps
    check_prerequisites
    pre_deployment_checks
    create_backup
    
    if deploy_blue_green "$new_image"; then
        log "Deployment successful"
        
        if [[ "$skip_tests" != "true" ]]; then
            post_deployment_verification
        fi
        
        cleanup_old_deployments
        
        # Start monitoring in background
        monitor_deployment 1800 &
        local monitor_pid=$!
        
        log "Production deployment completed successfully"
        send_slack_notification "✅ Production deployment completed successfully for $new_image"
        
        log "Monitoring deployment (PID: $monitor_pid)..."
        log "Deployment logs: kubectl logs -f deployment/$DEPLOYMENT_NAME -n $NAMESPACE"
        
    else
        error "Deployment failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"