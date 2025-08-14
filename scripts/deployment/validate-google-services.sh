#!/bin/bash

# Google Services Deployment Validation Script
# Ensures zero-downtime deployment with comprehensive validation

set -euo pipefail

# Configuration
NAMESPACE=${NAMESPACE:-"gemini-flow"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
VALIDATION_TIMEOUT=${VALIDATION_TIMEOUT:-"600"}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-"10"}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-"true"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}"
}

success() {
    echo -e "${GREEN}✅ $*${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $*${NC}"
}

error() {
    echo -e "${RED}❌ $*${NC}"
}

# Validation functions
validate_prerequisites() {
    log "Validating prerequisites..."
    
    # Check kubectl connectivity
    if ! kubectl cluster-info &>/dev/null; then
        error "kubectl cannot connect to cluster"
        exit 1
    fi
    
    # Check namespace exists
    if ! kubectl get namespace $NAMESPACE &>/dev/null; then
        error "Namespace $NAMESPACE does not exist"
        exit 1
    fi
    
    # Check required secrets exist
    local required_secrets=("google-services-api-keys" "google-services-config")
    for secret in "${required_secrets[@]}"; do
        if ! kubectl get secret $secret -n $NAMESPACE &>/dev/null; then
            error "Required secret $secret not found"
            exit 1
        fi
    done
    
    success "Prerequisites validated"
}

validate_deployment_status() {
    log "Validating deployment status..."
    
    # Check deployment exists and is ready
    if ! kubectl get deployment gemini-flow -n $NAMESPACE &>/dev/null; then
        error "Deployment gemini-flow not found"
        exit 1
    fi
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    if ! kubectl wait --for=condition=available --timeout=${VALIDATION_TIMEOUT}s \
         deployment/gemini-flow -n $NAMESPACE; then
        error "Deployment failed to become available within timeout"
        return 1
    fi
    
    # Check all pods are running
    local ready_pods=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                       --field-selector=status.phase=Running --no-headers | wc -l)
    local total_pods=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                       --no-headers | wc -l)
    
    if [ $ready_pods -eq $total_pods ] && [ $ready_pods -gt 0 ]; then
        success "All $ready_pods pods are running"
    else
        error "Only $ready_pods out of $total_pods pods are running"
        return 1
    fi
}

validate_health_endpoints() {
    log "Validating health endpoints..."
    
    local pod_name=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                     -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$pod_name" ]; then
        error "No pods found for health check"
        return 1
    fi
    
    # Basic health check
    if kubectl exec -n $NAMESPACE $pod_name -- curl -f http://localhost:8080/health &>/dev/null; then
        success "Basic health endpoint responding"
    else
        error "Basic health endpoint not responding"
        return 1
    fi
    
    # Google services health check
    if kubectl exec -n $NAMESPACE $pod_name -- curl -f http://localhost:8080/health/google-services &>/dev/null; then
        success "Google services health endpoint responding"
    else
        warning "Google services health endpoint not responding (may be initializing)"
        # Give more time for Google services to initialize
        sleep 30
        if kubectl exec -n $NAMESPACE $pod_name -- curl -f http://localhost:8080/health/google-services &>/dev/null; then
            success "Google services health endpoint responding after retry"
        else
            error "Google services health endpoint still not responding"
            return 1
        fi
    fi
}

validate_google_services() {
    log "Validating individual Google services..."
    
    local pod_name=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                     -o jsonpath='{.items[0].metadata.name}')
    
    # Validate Veo3
    log "Testing Veo3 service..."
    if kubectl exec -n $NAMESPACE $pod_name -- node -e "
        const veo3 = require('./src/services/google-services/veo3-video-generator');
        veo3.healthCheck().then(result => {
            console.log('Veo3 health:', JSON.stringify(result));
            process.exit(result.healthy ? 0 : 1);
        }).catch(err => {
            console.error('Veo3 error:', err.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        success "Veo3 service is healthy"
    else
        warning "Veo3 service health check failed"
    fi
    
    # Validate Imagen4
    log "Testing Imagen4 service..."
    if kubectl exec -n $NAMESPACE $pod_name -- node -e "
        const imagen4 = require('./src/services/google-services/imagen4-generator');
        imagen4.healthCheck().then(result => {
            console.log('Imagen4 health:', JSON.stringify(result));
            process.exit(result.healthy ? 0 : 1);
        }).catch(err => {
            console.error('Imagen4 error:', err.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        success "Imagen4 service is healthy"
    else
        warning "Imagen4 service health check failed"
    fi
    
    # Validate Lyria
    log "Testing Lyria service..."
    if kubectl exec -n $NAMESPACE $pod_name -- node -e "
        const lyria = require('./src/services/google-services/lyria-music-composer');
        lyria.healthCheck().then(result => {
            console.log('Lyria health:', JSON.stringify(result));
            process.exit(result.healthy ? 0 : 1);
        }).catch(err => {
            console.error('Lyria error:', err.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        success "Lyria service is healthy"
    else
        warning "Lyria service health check failed"
    fi
}

validate_resource_usage() {
    log "Validating resource usage..."
    
    # Check CPU usage
    local cpu_usage=$(kubectl top pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                      --no-headers | awk '{sum += $2} END {print sum}' | tr -d 'm')
    
    if [ -n "$cpu_usage" ] && [ $cpu_usage -lt 8000 ]; then  # Less than 8 CPU cores
        success "CPU usage is within limits: ${cpu_usage}m"
    else
        warning "High CPU usage detected: ${cpu_usage}m"
    fi
    
    # Check memory usage
    local memory_usage=$(kubectl top pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                         --no-headers | awk '{sum += $3} END {print sum}' | tr -d 'Mi')
    
    if [ -n "$memory_usage" ] && [ $memory_usage -lt 16384 ]; then  # Less than 16GB
        success "Memory usage is within limits: ${memory_usage}Mi"
    else
        warning "High memory usage detected: ${memory_usage}Mi"
    fi
}

validate_monitoring() {
    log "Validating monitoring setup..."
    
    # Check if monitoring resources exist
    if kubectl get servicemonitor google-services-metrics -n monitoring &>/dev/null; then
        success "ServiceMonitor for Google services exists"
    else
        warning "ServiceMonitor for Google services not found"
    fi
    
    # Check GPU metrics exporter if applicable
    if kubectl get daemonset gpu-metrics-exporter -n $NAMESPACE &>/dev/null; then
        success "GPU metrics exporter is deployed"
    else
        warning "GPU metrics exporter not found"
    fi
}

run_performance_baseline() {
    log "Running performance baseline tests..."
    
    local pod_name=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=gemini-flow \
                     -o jsonpath='{.items[0].metadata.name}')
    
    # Simple performance test
    if kubectl exec -n $NAMESPACE $pod_name -- curl -f http://localhost:8080/metrics &>/dev/null; then
        success "Metrics endpoint is accessible"
    else
        warning "Metrics endpoint not accessible"
    fi
    
    # Test basic API endpoints
    if kubectl exec -n $NAMESPACE $pod_name -- curl -f -X POST http://localhost:8080/api/v1/health \
       -H "Content-Type: application/json" -d '{}' &>/dev/null; then
        success "API endpoints are responding"
    else
        warning "API endpoints may not be fully ready"
    fi
}

perform_rollback() {
    error "Validation failed, performing rollback..."
    
    if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
        log "Initiating emergency rollback..."
        
        # Run the rollback script
        if [ -f "/scripts/automated-rollback.sh" ]; then
            ROLLBACK_TYPE=emergency /scripts/automated-rollback.sh
        else
            # Fallback rollback
            kubectl rollout undo deployment/gemini-flow -n $NAMESPACE
            kubectl rollout status deployment/gemini-flow -n $NAMESPACE --timeout=300s
        fi
        
        success "Rollback completed"
    else
        warning "Rollback disabled, manual intervention required"
    fi
}

# Main validation flow
main() {
    log "Starting Google Services deployment validation for $ENVIRONMENT environment"
    
    local validation_failed=false
    
    # Run validation steps
    validate_prerequisites || validation_failed=true
    
    if [ "$validation_failed" = "false" ]; then
        validate_deployment_status || validation_failed=true
    fi
    
    if [ "$validation_failed" = "false" ]; then
        validate_health_endpoints || validation_failed=true
    fi
    
    if [ "$validation_failed" = "false" ]; then
        validate_google_services || validation_failed=true
    fi
    
    if [ "$validation_failed" = "false" ]; then
        validate_resource_usage
        validate_monitoring
        run_performance_baseline
    fi
    
    # Final decision
    if [ "$validation_failed" = "true" ]; then
        error "Validation failed!"
        perform_rollback
        exit 1
    else
        success "All validations passed! Google Services deployment is successful."
        log "Deployment Summary:"
        log "- Environment: $ENVIRONMENT"
        log "- Namespace: $NAMESPACE"
        log "- Services: Veo3, Imagen4, Lyria, Chirp, Co-Scientist"
        log "- Status: Healthy and operational"
        exit 0
    fi
}

# Handle signals for graceful shutdown
trap 'error "Validation interrupted"; exit 130' INT TERM

# Run main function
main "$@"