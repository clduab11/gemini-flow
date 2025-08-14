# Configuration Management Guide

## Overview

This document outlines configuration management best practices for Google Services in the Gemini-Flow platform, ensuring consistent, secure, and maintainable configuration across all environments.

## Table of Contents

1. [Configuration Architecture](#configuration-architecture)
2. [Environment Management](#environment-management)
3. [Secret Management](#secret-management)
4. [Configuration Validation](#configuration-validation)
5. [Deployment Strategies](#deployment-strategies)
6. [Rollback Procedures](#rollback-procedures)
7. [Automation Scripts](#automation-scripts)

## Configuration Architecture

### Configuration Hierarchy

```
config/
├── base/                          # Base configurations
│   ├── service-defaults.yaml     # Default service settings
│   ├── resource-limits.yaml      # Resource constraints
│   └── feature-flags.yaml        # Feature toggles
├── environments/                  # Environment-specific configs
│   ├── development/
│   │   ├── services.yaml         # Dev service configurations
│   │   ├── scaling.yaml          # Dev scaling parameters
│   │   └── monitoring.yaml       # Dev monitoring settings
│   ├── staging/
│   │   ├── services.yaml         # Staging configurations
│   │   ├── scaling.yaml          # Staging scaling parameters
│   │   └── monitoring.yaml       # Staging monitoring settings
│   └── production/
│       ├── services.yaml         # Production configurations
│       ├── scaling.yaml          # Production scaling parameters
│       └── monitoring.yaml       # Production monitoring settings
├── secrets/                       # Secret templates (encrypted)
│   ├── service-accounts.yaml     # Service account templates
│   ├── api-keys.yaml             # API key templates
│   └── certificates.yaml         # Certificate templates
└── schemas/                       # Configuration schemas
    ├── service-schema.json       # Service config validation
    ├── scaling-schema.json       # Scaling config validation
    └── monitoring-schema.json    # Monitoring config validation
```

### Configuration Sources Priority

1. **Command Line Arguments** (highest priority)
2. **Environment Variables**
3. **Configuration Files**
4. **Default Values** (lowest priority)

## Environment Management

### Development Environment

```yaml
# config/environments/development/services.yaml
vertex_ai:
  endpoint: "https://us-central1-aiplatform.googleapis.com"
  project_id: "gemini-flow-dev"
  location: "us-central1"
  model_settings:
    default_model: "gemini-2.0-flash"
    temperature: 0.7
    max_tokens: 1000
  rate_limits:
    requests_per_minute: 60
    concurrent_requests: 5

workspace:
  oauth2:
    scopes:
      - "https://www.googleapis.com/auth/drive.readonly"
      - "https://www.googleapis.com/auth/spreadsheets"
  api_version: "v1"
  timeout_seconds: 30

streaming:
  webrtc:
    stun_servers:
      - "stun:stun.l.google.com:19302"
  buffer_size_mb: 10
  compression_enabled: true
```

### Staging Environment

```yaml
# config/environments/staging/services.yaml
vertex_ai:
  endpoint: "https://us-central1-aiplatform.googleapis.com"
  project_id: "gemini-flow-staging"
  location: "us-central1"
  model_settings:
    default_model: "gemini-2.5-pro"
    temperature: 0.5
    max_tokens: 2000
  rate_limits:
    requests_per_minute: 300
    concurrent_requests: 20

workspace:
  oauth2:
    scopes:
      - "https://www.googleapis.com/auth/drive"
      - "https://www.googleapis.com/auth/spreadsheets"
      - "https://www.googleapis.com/auth/documents"
  api_version: "v1"
  timeout_seconds: 60

streaming:
  webrtc:
    stun_servers:
      - "stun:stun.l.google.com:19302"
      - "stun:stun1.l.google.com:19302"
  buffer_size_mb: 50
  compression_enabled: true
  cdn_enabled: true
```

### Production Environment

```yaml
# config/environments/production/services.yaml
vertex_ai:
  endpoint: "https://us-central1-aiplatform.googleapis.com"
  project_id: "gemini-flow-prod"
  location: "us-central1"
  model_settings:
    default_model: "gemini-2.5-pro"
    temperature: 0.3
    max_tokens: 4000
  rate_limits:
    requests_per_minute: 1000
    concurrent_requests: 100
  failover:
    enabled: true
    backup_regions: ["us-east1", "europe-west1"]

workspace:
  oauth2:
    scopes:
      - "https://www.googleapis.com/auth/drive"
      - "https://www.googleapis.com/auth/spreadsheets"
      - "https://www.googleapis.com/auth/documents"
      - "https://www.googleapis.com/auth/presentations"
  api_version: "v1"
  timeout_seconds: 120
  retry_policy:
    max_retries: 3
    backoff_multiplier: 2

streaming:
  webrtc:
    stun_servers:
      - "stun:stun.l.google.com:19302"
      - "stun:stun1.l.google.com:19302"
      - "stun:stun2.l.google.com:19302"
  buffer_size_mb: 100
  compression_enabled: true
  cdn_enabled: true
  edge_locations: ["us", "eu", "asia"]
```

## Secret Management

### Google Cloud Secret Manager Integration

```bash
#!/bin/bash
# scripts/secret-management.sh

# Create secrets in Google Cloud Secret Manager
create_secrets() {
    local env=$1
    
    # Service Account Key
    gcloud secrets create "gemini-flow-${env}-service-account" \
        --data-file="secrets/${env}/service-account.json"
    
    # OAuth2 Client Secret
    gcloud secrets create "gemini-flow-${env}-oauth2-secret" \
        --data-file="secrets/${env}/oauth2-client-secret.txt"
    
    # API Keys
    gcloud secrets create "gemini-flow-${env}-api-keys" \
        --data-file="secrets/${env}/api-keys.json"
}

# Retrieve secrets for deployment
retrieve_secrets() {
    local env=$1
    local output_dir=$2
    
    mkdir -p "$output_dir"
    
    # Retrieve service account
    gcloud secrets versions access latest \
        --secret="gemini-flow-${env}-service-account" \
        > "$output_dir/service-account.json"
    
    # Retrieve OAuth2 secret
    gcloud secrets versions access latest \
        --secret="gemini-flow-${env}-oauth2-secret" \
        > "$output_dir/oauth2-client-secret.txt"
    
    # Retrieve API keys
    gcloud secrets versions access latest \
        --secret="gemini-flow-${env}-api-keys" \
        > "$output_dir/api-keys.json"
}

# Rotate secrets
rotate_secrets() {
    local env=$1
    
    echo "Rotating secrets for $env environment..."
    
    # Generate new service account key
    gcloud iam service-accounts keys create "new-service-account.json" \
        --iam-account="gemini-flow-${env}@project.iam.gserviceaccount.com"
    
    # Update secret
    gcloud secrets versions add "gemini-flow-${env}-service-account" \
        --data-file="new-service-account.json"
    
    echo "Secret rotation completed for $env"
}
```

### Kubernetes Secret Management

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: gemini-flow-secrets
  namespace: gemini-flow
type: Opaque
data:
  service-account.json: |
    {{ .Files.Get "secrets/service-account.json" | b64enc }}
  oauth2-client-secret: |
    {{ .Files.Get "secrets/oauth2-client-secret.txt" | b64enc }}
stringData:
  vertex-ai-endpoint: "https://us-central1-aiplatform.googleapis.com"
  project-id: "{{ .Values.projectId }}"
---
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: gcpsm-secret-store
  namespace: gemini-flow
spec:
  provider:
    gcpsm:
      projectId: "{{ .Values.projectId }}"
      auth:
        workloadIdentity:
          clusterLocation: us-central1
          clusterName: gemini-flow-cluster
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: gemini-flow-external-secret
  namespace: gemini-flow
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: gcpsm-secret-store
    kind: SecretStore
  target:
    name: gemini-flow-secrets-external
    creationPolicy: Owner
  data:
  - secretKey: service-account.json
    remoteRef:
      key: gemini-flow-prod-service-account
  - secretKey: oauth2-client-secret
    remoteRef:
      key: gemini-flow-prod-oauth2-secret
```

## Configuration Validation

### Schema Validation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Gemini-Flow Service Configuration",
  "type": "object",
  "properties": {
    "vertex_ai": {
      "type": "object",
      "properties": {
        "endpoint": {
          "type": "string",
          "format": "uri",
          "pattern": "^https://.*aiplatform\\.googleapis\\.com$"
        },
        "project_id": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]{4,28}[a-z0-9]$"
        },
        "location": {
          "type": "string",
          "enum": ["us-central1", "us-east1", "europe-west1", "asia-southeast1"]
        },
        "model_settings": {
          "type": "object",
          "properties": {
            "default_model": {
              "type": "string",
              "enum": ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash"]
            },
            "temperature": {
              "type": "number",
              "minimum": 0,
              "maximum": 2
            },
            "max_tokens": {
              "type": "integer",
              "minimum": 1,
              "maximum": 1000000
            }
          },
          "required": ["default_model", "temperature", "max_tokens"]
        }
      },
      "required": ["endpoint", "project_id", "location", "model_settings"]
    }
  },
  "required": ["vertex_ai"]
}
```

### Configuration Validation Script

```bash
#!/bin/bash
# scripts/validate-config.sh

validate_config() {
    local env=$1
    local config_file="config/environments/$env/services.yaml"
    local schema_file="config/schemas/service-schema.json"
    
    echo "Validating configuration for $env environment..."
    
    # Convert YAML to JSON for validation
    yq eval -o=json "$config_file" > "/tmp/config-$env.json"
    
    # Validate against schema
    if npx ajv-cli validate -s "$schema_file" -d "/tmp/config-$env.json"; then
        echo "✅ Configuration validation passed for $env"
    else
        echo "❌ Configuration validation failed for $env"
        exit 1
    fi
    
    # Additional custom validations
    validate_project_access "$env"
    validate_service_accounts "$env"
    validate_quotas "$env"
}

validate_project_access() {
    local env=$1
    local project_id=$(yq eval ".vertex_ai.project_id" "config/environments/$env/services.yaml")
    
    if gcloud projects describe "$project_id" > /dev/null 2>&1; then
        echo "✅ Project access verified for $project_id"
    else
        echo "❌ Cannot access project $project_id"
        exit 1
    fi
}

validate_service_accounts() {
    local env=$1
    local project_id=$(yq eval ".vertex_ai.project_id" "config/environments/$env/services.yaml")
    
    if gcloud iam service-accounts describe "gemini-flow-${env}@${project_id}.iam.gserviceaccount.com" > /dev/null 2>&1; then
        echo "✅ Service account verified for $env"
    else
        echo "❌ Service account not found for $env"
        exit 1
    fi
}

validate_quotas() {
    local env=$1
    local project_id=$(yq eval ".vertex_ai.project_id" "config/environments/$env/services.yaml")
    local location=$(yq eval ".vertex_ai.location" "config/environments/$env/services.yaml")
    
    # Check Vertex AI quotas
    local quota_usage=$(gcloud ai quotas list --project="$project_id" --location="$location" --format="value(usage)" --filter="metric:aiplatform.googleapis.com/predict_requests")
    
    if [[ $quota_usage -lt 1000 ]]; then
        echo "✅ Quota availability verified for $env"
    else
        echo "⚠️  High quota usage detected for $env: $quota_usage"
    fi
}
```

## Deployment Strategies

### Blue-Green Deployment

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

deploy_blue_green() {
    local env=$1
    local new_version=$2
    local current_slot=$(kubectl get service gemini-flow-service -o jsonpath='{.spec.selector.slot}')
    local target_slot="green"
    
    if [[ "$current_slot" == "green" ]]; then
        target_slot="blue"
    fi
    
    echo "Deploying $new_version to $target_slot slot in $env environment"
    
    # Update configuration
    update_config "$env" "$target_slot" "$new_version"
    
    # Deploy to target slot
    kubectl set image deployment/gemini-flow-$target_slot \
        app=gemini-flow:$new_version
    
    # Wait for deployment
    kubectl rollout status deployment/gemini-flow-$target_slot --timeout=600s
    
    # Health check
    if health_check "$target_slot"; then
        echo "Health check passed, switching traffic"
        switch_traffic "$target_slot"
    else
        echo "Health check failed, rolling back"
        kubectl rollout undo deployment/gemini-flow-$target_slot
        exit 1
    fi
}

switch_traffic() {
    local target_slot=$1
    
    # Update service selector
    kubectl patch service gemini-flow-service -p '{"spec":{"selector":{"slot":"'$target_slot'"}}}'
    
    echo "Traffic switched to $target_slot slot"
}
```

### Canary Deployment

```bash
#!/bin/bash
# scripts/canary-deploy.sh

deploy_canary() {
    local env=$1
    local new_version=$2
    local canary_percentage=${3:-10}
    
    echo "Starting canary deployment: $canary_percentage% traffic to $new_version"
    
    # Deploy canary version
    kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gemini-flow-canary
  namespace: gemini-flow
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gemini-flow
      version: canary
  template:
    metadata:
      labels:
        app: gemini-flow
        version: canary
    spec:
      containers:
      - name: gemini-flow
        image: gemini-flow:$new_version
        envFrom:
        - configMapRef:
            name: gemini-flow-config-$env
        - secretRef:
            name: gemini-flow-secrets
EOF
    
    # Update Istio VirtualService for traffic splitting
    kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: gemini-flow-vs
  namespace: gemini-flow
spec:
  hosts:
  - gemini-flow-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: gemini-flow-service
        subset: canary
  - route:
    - destination:
        host: gemini-flow-service
        subset: stable
      weight: $((100 - canary_percentage))
    - destination:
        host: gemini-flow-service
        subset: canary
      weight: $canary_percentage
EOF
    
    # Monitor canary deployment
    monitor_canary "$new_version" "$canary_percentage"
}

monitor_canary() {
    local version=$1
    local percentage=$2
    local duration=300  # 5 minutes
    local interval=30
    
    echo "Monitoring canary deployment for $duration seconds"
    
    for ((i=0; i<duration; i+=interval)); do
        # Check error rate
        local error_rate=$(get_error_rate_for_version "$version")
        local latency_p95=$(get_latency_p95_for_version "$version")
        
        echo "Canary metrics - Error rate: $error_rate%, P95 latency: ${latency_p95}ms"
        
        if (( $(echo "$error_rate > 1.0" | bc -l) )); then
            echo "❌ Canary error rate too high, rolling back"
            rollback_canary
            exit 1
        fi
        
        if (( latency_p95 > 1000 )); then
            echo "❌ Canary latency too high, rolling back"
            rollback_canary
            exit 1
        fi
        
        sleep $interval
    done
    
    echo "✅ Canary monitoring completed successfully"
    promote_canary "$version"
}
```

## Rollback Procedures

### Configuration Rollback

```bash
#!/bin/bash
# scripts/config-rollback.sh

rollback_config() {
    local env=$1
    local target_version=${2:-"previous"}
    
    echo "Rolling back configuration for $env to $target_version"
    
    # Get previous configuration version from Git
    if [[ "$target_version" == "previous" ]]; then
        target_version=$(git log --oneline -n 2 --format="%H" -- "config/environments/$env/" | tail -1)
    fi
    
    # Create backup of current config
    backup_current_config "$env"
    
    # Checkout previous configuration
    git checkout "$target_version" -- "config/environments/$env/"
    
    # Validate rollback configuration
    if validate_config "$env"; then
        echo "✅ Configuration rollback validation passed"
        apply_config "$env"
    else
        echo "❌ Configuration rollback validation failed"
        restore_backup_config "$env"
        exit 1
    fi
}

backup_current_config() {
    local env=$1
    local backup_dir="backups/config/$(date +%Y%m%d_%H%M%S)_$env"
    
    mkdir -p "$backup_dir"
    cp -r "config/environments/$env/" "$backup_dir/"
    
    echo "Current configuration backed up to $backup_dir"
}

apply_config() {
    local env=$1
    
    # Update Kubernetes ConfigMaps
    kubectl create configmap gemini-flow-config-$env \
        --from-file="config/environments/$env/" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Restart deployments to pick up new config
    kubectl rollout restart deployment/gemini-flow-api
    kubectl rollout restart deployment/gemini-flow-agents
    
    # Wait for rollout completion
    kubectl rollout status deployment/gemini-flow-api --timeout=300s
    kubectl rollout status deployment/gemini-flow-agents --timeout=300s
}
```

## Automation Scripts

### Configuration Deployment Pipeline

```yaml
# .github/workflows/config-deployment.yml
name: Configuration Deployment

on:
  push:
    paths:
      - 'config/**'
    branches:
      - main
      - staging
      - development

jobs:
  validate-config:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm install -g ajv-cli yq
          
      - name: Validate configuration schemas
        run: |
          for env in development staging production; do
            if [[ -f "config/environments/$env/services.yaml" ]]; then
              echo "Validating $env configuration..."
              scripts/validate-config.sh $env
            fi
          done
          
      - name: Security scan
        run: |
          # Check for exposed secrets
          scripts/scan-secrets.sh config/
          
  deploy-config:
    needs: validate-config
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Google Cloud CLI
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          
      - name: Deploy to staging
        run: |
          scripts/deploy-config.sh staging
          
      - name: Run integration tests
        run: |
          scripts/run-integration-tests.sh staging
          
      - name: Deploy to production
        run: |
          scripts/deploy-config.sh production
```

### Configuration Monitoring

```bash
#!/bin/bash
# scripts/config-monitor.sh

monitor_config_drift() {
    local env=$1
    
    echo "Monitoring configuration drift for $env environment"
    
    # Get current config from Kubernetes
    kubectl get configmap gemini-flow-config-$env -o jsonpath='{.data}' > "/tmp/k8s-config-$env.json"
    
    # Get expected config from Git
    yq eval -o=json "config/environments/$env/services.yaml" > "/tmp/git-config-$env.json"
    
    # Compare configurations
    if diff "/tmp/k8s-config-$env.json" "/tmp/git-config-$env.json" > "/tmp/config-diff-$env.txt"; then
        echo "✅ No configuration drift detected for $env"
    else
        echo "⚠️  Configuration drift detected for $env"
        cat "/tmp/config-diff-$env.txt"
        
        # Send alert
        send_drift_alert "$env" "/tmp/config-diff-$env.txt"
    fi
}

send_drift_alert() {
    local env=$1
    local diff_file=$2
    
    # Send Slack notification
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 Configuration drift detected in $env environment. Check the logs for details.\"}" \
        "$SLACK_WEBHOOK_URL"
    
    # Create incident ticket
    create_incident_ticket "Configuration Drift" "$env" "$diff_file"
}
```

## Best Practices

### 1. Configuration Versioning
- Store all configurations in Git
- Use semantic versioning for configuration releases
- Tag configuration versions with deployment information

### 2. Environment Isolation
- Separate configurations by environment
- Use different Google Cloud projects for isolation
- Implement proper IAM boundaries

### 3. Secret Security
- Never store secrets in plain text
- Use Google Cloud Secret Manager for production
- Rotate secrets regularly
- Implement least privilege access

### 4. Validation and Testing
- Validate all configurations before deployment
- Test configuration changes in staging first
- Implement automated configuration testing

### 5. Monitoring and Alerting
- Monitor for configuration drift
- Alert on configuration deployment failures
- Track configuration change impact on system metrics

---

**Document Owner**: SRE Team  
**Last Updated**: August 14, 2025  
**Next Review**: November 14, 2025  
**Version**: 1.0