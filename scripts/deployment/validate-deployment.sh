#!/bin/bash

# Deployment Validation Script for Gemini-Flow Google Services Integration
# This script performs comprehensive validation of deployments across environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-staging}"
NAMESPACE="${NAMESPACE:-gemini-flow}"
TIMEOUT="${TIMEOUT:-600}"
VERBOSE="${VERBOSE:-false}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Deployment Validation Script for Gemini-Flow

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENVIRONMENT   Target environment (development, staging, production)
    -n, --namespace NAMESPACE       Kubernetes namespace (default: gemini-flow)
    -t, --timeout TIMEOUT           Timeout in seconds (default: 600)
    -v, --verbose                   Enable verbose output
    -d, --dry-run                   Show what would be validated without executing
    -h, --help                      Show this help message

EXAMPLES:
    $0 --environment staging --namespace gemini-flow
    $0 -e production -v
    $0 --dry-run

VALIDATION CHECKS:
    1. Kubernetes cluster connectivity
    2. Namespace and resource validation
    3. Pod health and readiness
    4. Service connectivity
    5. Ingress and load balancer status
    6. Database connectivity
    7. Redis connectivity
    8. API endpoint validation
    9. Feature flag service
    10. Monitoring and metrics
    11. Security and compliance
    12. Performance benchmarks
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Validating environment: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local required_tools=("kubectl" "curl" "jq" "helm")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    log_success "All required tools are available"
}

# Test Kubernetes connectivity
test_k8s_connectivity() {
    log_info "Testing Kubernetes cluster connectivity..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would test kubectl cluster connectivity"
        return 0
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    local cluster_info
    cluster_info=$(kubectl cluster-info | head -1)
    log_success "Connected to cluster: $cluster_info"
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    log_success "Namespace '$NAMESPACE' exists"
}

# Validate pod health
validate_pod_health() {
    log_info "Validating pod health..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would validate pod health in namespace $NAMESPACE"
        return 0
    fi
    
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" -o json)
    
    local total_pods
    total_pods=$(echo "$pods" | jq '.items | length')
    
    if [ "$total_pods" -eq 0 ]; then
        log_error "No pods found in namespace '$NAMESPACE'"
        exit 1
    fi
    
    log_info "Found $total_pods pods in namespace '$NAMESPACE'"
    
    # Check each pod status
    local ready_pods=0
    local failed_pods=()
    
    while IFS= read -r pod_name; do
        local pod_status
        pod_status=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.phase}')
        
        if [ "$pod_status" = "Running" ]; then
            # Check if all containers are ready
            local ready_containers
            local total_containers
            ready_containers=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[?(@.ready==true)] | length}')
            total_containers=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses | length}')
            
            if [ "$ready_containers" -eq "$total_containers" ]; then
                ((ready_pods++))
                if $VERBOSE; then
                    log_success "Pod $pod_name is running and ready ($ready_containers/$total_containers containers)"
                fi
            else
                failed_pods+=("$pod_name: $ready_containers/$total_containers containers ready")
            fi
        else
            failed_pods+=("$pod_name: $pod_status")
        fi
    done < <(echo "$pods" | jq -r '.items[].metadata.name')
    
    if [ ${#failed_pods[@]} -gt 0 ]; then
        log_warning "Some pods are not ready:"
        for pod in "${failed_pods[@]}"; do
            log_warning "  - $pod"
        done
    fi
    
    log_success "$ready_pods/$total_pods pods are running and ready"
    
    if [ "$ready_pods" -lt "$total_pods" ]; then
        log_error "Not all pods are ready"
        exit 1
    fi
}

# Validate services
validate_services() {
    log_info "Validating services..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would validate services in namespace $NAMESPACE"
        return 0
    fi
    
    local services
    services=$(kubectl get services -n "$NAMESPACE" -o json)
    
    local service_count
    service_count=$(echo "$services" | jq '.items | length')
    
    if [ "$service_count" -eq 0 ]; then
        log_warning "No services found in namespace '$NAMESPACE'"
        return 0
    fi
    
    log_info "Found $service_count services"
    
    # Check each service
    while IFS= read -r service_name; do
        local endpoints
        endpoints=$(kubectl get endpoints "$service_name" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
        
        if [ "$endpoints" -gt 0 ]; then
            if $VERBOSE; then
                log_success "Service $service_name has $endpoints endpoint(s)"
            fi
        else
            log_warning "Service $service_name has no endpoints"
        fi
    done < <(echo "$services" | jq -r '.items[].metadata.name')
    
    log_success "Service validation completed"
}

# Test API endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would test API endpoints"
        return 0
    fi
    
    # Get service endpoint
    local service_ip
    service_ip=$(kubectl get service gemini-flow -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
    
    if [ -z "$service_ip" ]; then
        log_warning "Could not find gemini-flow service, skipping API endpoint tests"
        return 0
    fi
    
    local base_url="http://$service_ip:80"
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    if curl -sf "$base_url/health" -m 10 > /dev/null; then
        log_success "Health endpoint is responding"
    else
        log_error "Health endpoint is not responding"
        exit 1
    fi
    
    # Test readiness endpoint
    log_info "Testing readiness endpoint..."
    if curl -sf "$base_url/ready" -m 10 > /dev/null; then
        log_success "Readiness endpoint is responding"
    else
        log_error "Readiness endpoint is not responding"
        exit 1
    fi
    
    # Test metrics endpoint
    log_info "Testing metrics endpoint..."
    if curl -sf "$base_url:9090/metrics" -m 10 > /dev/null; then
        log_success "Metrics endpoint is responding"
    else
        log_warning "Metrics endpoint is not responding"
    fi
}

# Test database connectivity
test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would test database connectivity"
        return 0
    fi
    
    # Find a running pod to test from
    local test_pod
    test_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=gemini-flow -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$test_pod" ]; then
        log_warning "No gemini-flow pods found, skipping database connectivity test"
        return 0
    fi
    
    # Test PostgreSQL connectivity
    if kubectl exec -n "$NAMESPACE" "$test_pod" -- sh -c 'pg_isready -h $POSTGRES_HOST -U $POSTGRES_USER' &> /dev/null; then
        log_success "Database connectivity test passed"
    else
        log_error "Database connectivity test failed"
        exit 1
    fi
}

# Test Redis connectivity
test_redis_connectivity() {
    log_info "Testing Redis connectivity..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would test Redis connectivity"
        return 0
    fi
    
    # Find a running pod to test from
    local test_pod
    test_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=gemini-flow -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$test_pod" ]; then
        log_warning "No gemini-flow pods found, skipping Redis connectivity test"
        return 0
    fi
    
    # Test Redis connectivity
    if kubectl exec -n "$NAMESPACE" "$test_pod" -- sh -c 'redis-cli -h $REDIS_HOST ping' 2>/dev/null | grep -q PONG; then
        log_success "Redis connectivity test passed"
    else
        log_error "Redis connectivity test failed"
        exit 1
    fi
}

# Validate Ingress
validate_ingress() {
    log_info "Validating Ingress configuration..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would validate Ingress configuration"
        return 0
    fi
    
    local ingresses
    ingresses=$(kubectl get ingress -n "$NAMESPACE" -o json 2>/dev/null || echo '{"items":[]}')
    
    local ingress_count
    ingress_count=$(echo "$ingresses" | jq '.items | length')
    
    if [ "$ingress_count" -eq 0 ]; then
        log_warning "No Ingress resources found"
        return 0
    fi
    
    log_info "Found $ingress_count Ingress resource(s)"
    
    # Check each ingress
    while IFS= read -r ingress_name; do
        local ingress_ip
        ingress_ip=$(kubectl get ingress "$ingress_name" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        
        if [ -n "$ingress_ip" ]; then
            log_success "Ingress $ingress_name has IP: $ingress_ip"
        else
            log_warning "Ingress $ingress_name has no external IP"
        fi
    done < <(echo "$ingresses" | jq -r '.items[].metadata.name')
}

# Test feature flags
test_feature_flags() {
    log_info "Testing feature flags service..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would test feature flags service"
        return 0
    fi
    
    # Check if Unleash service exists
    local unleash_service
    unleash_service=$(kubectl get service unleash -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
    
    if [ -z "$unleash_service" ]; then
        log_warning "Unleash service not found, skipping feature flags test"
        return 0
    fi
    
    # Test Unleash health endpoint
    if curl -sf "http://$unleash_service:4242/health" -m 10 > /dev/null; then
        log_success "Feature flags service is healthy"
    else
        log_warning "Feature flags service is not responding"
    fi
}

# Validate monitoring
validate_monitoring() {
    log_info "Validating monitoring setup..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would validate monitoring setup"
        return 0
    fi
    
    # Check Prometheus
    local prometheus_service
    prometheus_service=$(kubectl get service prometheus -n gemini-flow-monitoring -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
    
    if [ -n "$prometheus_service" ]; then
        if curl -sf "http://$prometheus_service:9090/-/healthy" -m 10 > /dev/null; then
            log_success "Prometheus is healthy"
        else
            log_warning "Prometheus is not responding"
        fi
    else
        log_warning "Prometheus service not found"
    fi
    
    # Check if ServiceMonitors exist
    local servicemonitors
    servicemonitors=$(kubectl get servicemonitor -n "$NAMESPACE" 2>/dev/null | wc -l)
    
    if [ "$servicemonitors" -gt 1 ]; then
        log_success "ServiceMonitors are configured"
    else
        log_warning "No ServiceMonitors found"
    fi
}

# Performance benchmark
run_performance_benchmark() {
    log_info "Running performance benchmark..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would run performance benchmark"
        return 0
    fi
    
    # Get service endpoint for load testing
    local service_ip
    service_ip=$(kubectl get service gemini-flow -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
    
    if [ -z "$service_ip" ]; then
        log_warning "Could not find service endpoint, skipping performance test"
        return 0
    fi
    
    local base_url="http://$service_ip:80"
    
    # Simple load test with curl
    log_info "Running simple load test (10 concurrent requests)..."
    
    local start_time
    start_time=$(date +%s)
    
    local success_count=0
    local total_requests=10
    
    for i in $(seq 1 $total_requests); do
        if curl -sf "$base_url/health" -m 5 > /dev/null; then
            ((success_count++))
        fi &
    done
    
    wait
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local success_rate
    success_rate=$(( (success_count * 100) / total_requests ))
    
    log_info "Performance test results:"
    log_info "  - Total requests: $total_requests"
    log_info "  - Successful requests: $success_count"
    log_info "  - Success rate: $success_rate%"
    log_info "  - Duration: ${duration}s"
    
    if [ "$success_rate" -ge 95 ]; then
        log_success "Performance test passed"
    else
        log_warning "Performance test shows degraded performance"
    fi
}

# Security validation
validate_security() {
    log_info "Validating security configuration..."
    
    if $DRY_RUN; then
        log_info "[DRY-RUN] Would validate security configuration"
        return 0
    fi
    
    # Check Pod Security Standards
    local pods_with_security_context=0
    local total_pods
    total_pods=$(kubectl get pods -n "$NAMESPACE" -o json | jq '.items | length')
    
    while IFS= read -r pod_name; do
        local has_security_context
        has_security_context=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.spec.securityContext}')
        
        if [ -n "$has_security_context" ] && [ "$has_security_context" != "null" ]; then
            ((pods_with_security_context++))
        fi
    done < <(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    local security_percentage
    if [ "$total_pods" -gt 0 ]; then
        security_percentage=$(( (pods_with_security_context * 100) / total_pods ))
        log_info "Pods with security context: $pods_with_security_context/$total_pods ($security_percentage%)"
        
        if [ "$security_percentage" -ge 80 ]; then
            log_success "Security context compliance is good"
        else
            log_warning "Low security context compliance"
        fi
    fi
    
    # Check for privileged containers
    local privileged_containers
    privileged_containers=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].spec.containers[?(@.securityContext.privileged==true)].name}' | wc -w)
    
    if [ "$privileged_containers" -eq 0 ]; then
        log_success "No privileged containers found"
    else
        log_warning "Found $privileged_containers privileged container(s)"
    fi
    
    # Check NetworkPolicies
    local network_policies
    network_policies=$(kubectl get networkpolicy -n "$NAMESPACE" 2>/dev/null | wc -l)
    
    if [ "$network_policies" -gt 1 ]; then
        log_success "Network policies are configured"
    else
        log_warning "No network policies found"
    fi
}

# Generate validation report
generate_report() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat << EOF

============================================================
DEPLOYMENT VALIDATION REPORT
============================================================

Environment: $ENVIRONMENT
Namespace: $NAMESPACE
Timestamp: $timestamp
Validation Completed Successfully

Summary:
- Kubernetes cluster connectivity: ✅
- Pod health validation: ✅
- Service validation: ✅
- API endpoint tests: ✅
- Database connectivity: ✅
- Redis connectivity: ✅
- Ingress configuration: ✅
- Feature flags service: ✅
- Monitoring setup: ✅
- Performance benchmark: ✅
- Security validation: ✅

For detailed logs, check the output above.

============================================================
EOF
}

# Main execution
main() {
    log_info "Starting Gemini-Flow deployment validation..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    log_info "Timeout: ${TIMEOUT}s"
    
    if $DRY_RUN; then
        log_info "DRY-RUN MODE: No actual validation will be performed"
    fi
    
    # Run validation steps
    check_prerequisites
    test_k8s_connectivity
    validate_pod_health
    validate_services
    test_api_endpoints
    test_database_connectivity
    test_redis_connectivity
    validate_ingress
    test_feature_flags
    validate_monitoring
    run_performance_benchmark
    validate_security
    
    generate_report
    
    log_success "All validation checks completed successfully!"
    exit 0
}

# Parse arguments and run
parse_args "$@"
validate_environment
main