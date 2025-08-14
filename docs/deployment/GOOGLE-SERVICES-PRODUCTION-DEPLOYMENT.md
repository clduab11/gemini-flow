# Google Services Production Deployment Guide

## 🚀 Overview

This document outlines the complete deployment strategy for activating Google's advanced AI services (Veo3, Imagen4, Lyria, Chirp, Co-Scientist) in production with zero-downtime capability and comprehensive rollback procedures.

## 📋 Services Activated

### 🎬 Veo3 Video Generation
- **Status**: ✅ Enabled
- **Resource Allocation**: 2 CPU cores, 4GB RAM, 1 GPU
- **Rate Limits**: 60 requests/min, 10,000 requests/day
- **Features**: 4K video generation, 300s max duration

### 🖼️ Imagen4 Image Generation
- **Status**: ✅ Enabled
- **Resource Allocation**: 1 CPU core, 2GB RAM, 1 GPU
- **Rate Limits**: 120 requests/min, 50,000 requests/day
- **Features**: 8192x8192 max resolution, batch processing

### 🎵 Lyria Music Composition
- **Status**: ✅ Enabled
- **Resource Allocation**: 1 CPU core, 2GB RAM
- **Rate Limits**: 30 requests/min, 5,000 requests/day
- **Features**: 10-minute compositions, 16 tracks max

### 🔊 Chirp Audio Processing
- **Status**: ✅ Enabled
- **Resource Allocation**: 0.5 CPU cores, 1GB RAM
- **Rate Limits**: 100 requests/min, 25,000 requests/day
- **Features**: 60-minute audio, 100MB max file size

### 🔬 Co-Scientist Research
- **Status**: ✅ Enabled
- **Resource Allocation**: 1 CPU core, 1GB RAM
- **Rate Limits**: 50 requests/min, 15,000 requests/day
- **Features**: Deep research analysis, concurrent queries

## 🏗️ Infrastructure Configuration

### Kubernetes Resources
```yaml
# Enhanced resource allocation
resources:
  limits:
    cpu: 4000m
    memory: 8Gi
    nvidia.com/gpu: 1
  requests:
    cpu: 1000m
    memory: 2Gi
    nvidia.com/gpu: 1

# Auto-scaling configuration
autoscaling:
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Worker Pods Enhancement
- **Replicas**: Increased from 2 to 3
- **GPU Support**: Added NVIDIA GPU allocation
- **Memory**: Upgraded to 4GB limit per pod
- **Specialized Workers**: Multimedia processing optimized

## 🔐 Security Configuration

### API Key Management
```bash
# Secure secret management
kubectl create secret generic google-services-api-keys \
  --from-literal=veo3-api-key=$VEO3_API_KEY \
  --from-literal=imagen4-api-key=$IMAGEN4_API_KEY \
  --from-literal=lyria-api-key=$LYRIA_API_KEY \
  --from-literal=chirp-api-key=$CHIRP_API_KEY \
  --from-literal=co-scientist-api-key=$CO_SCIENTIST_API_KEY
```

### Network Security
- **mTLS**: Enabled for all service-to-service communication
- **Network Policies**: Configured for Google services isolation
- **Encryption**: At-rest and in-transit encryption enabled

## 📊 Monitoring & Observability

### Prometheus Metrics
- `veo3_video_generation_duration_seconds`
- `imagen4_generation_duration_seconds`
- `lyria_composition_duration_seconds`
- `google_api_requests_remaining`
- `nvidia_gpu_utilization_gpu`

### Grafana Dashboards
- **Google Services Production Monitoring**
- **GPU Utilization Tracking**
- **API Rate Limit Monitoring**
- **Performance Baseline Tracking**

### Alerting Rules
```yaml
# Critical alerts
- alert: GoogleServiceDown
  expr: up{job=~".*google-services.*"} == 0
  for: 1m
  severity: critical

- alert: GPUUtilizationHigh
  expr: nvidia_gpu_utilization_gpu > 95
  for: 5m
  severity: warning
```

## 🚢 Deployment Strategy

### Canary Deployment Process
1. **5% Traffic** → 5-minute validation
2. **10% Traffic** → Performance validation
3. **25% Traffic** → Load testing
4. **50% Traffic** → Extended monitoring
5. **100% Traffic** → Full deployment

### Zero-Downtime Features
- **Rolling Updates**: Gradual pod replacement
- **Health Checks**: Comprehensive service validation
- **Circuit Breakers**: Automatic failure isolation
- **Load Balancing**: Traffic distribution optimization

## 🔄 Rollback Procedures

### Emergency Rollback (< 2 minutes)
```bash
# Immediate rollback for critical failures
ROLLBACK_TYPE=emergency ./scripts/deployment/automated-rollback.sh
```

### Gradual Rollback (5-15 minutes)
```bash
# Gradual rollback for performance issues
ROLLBACK_TYPE=gradual ./scripts/deployment/automated-rollback.sh
```

### Service-Specific Rollback
```bash
# Rollback individual services
ROLLBACK_TYPE=service SERVICE=veo3 ./scripts/deployment/automated-rollback.sh
```

## 🧪 Validation & Testing

### Deployment Validation
```bash
# Comprehensive validation script
npm run validate:google-services
```

### Health Checks
- **Basic Health**: `/health`
- **Google Services**: `/health/google-services`
- **Individual Services**: Service-specific endpoints

### Performance Baselines
```bash
# Performance testing
npm run test:performance:google-services --baseline-mode=true
```

## 🚀 GitHub Actions Workflow

### Automated Deployment Pipeline
- **Environment Detection**: Automatic environment selection
- **Security Scanning**: Vulnerability assessment
- **Multi-stage Testing**: Unit, integration, e2e tests
- **Docker Build**: Multi-architecture support
- **Infrastructure Provisioning**: Terraform automation
- **Kubernetes Deployment**: Helm-based deployment
- **Google Services Validation**: Comprehensive service testing
- **Performance Verification**: Baseline performance testing

### Workflow Triggers
- **Push to main**: Production deployment with canary strategy
- **Push to develop**: Staging deployment with rolling updates
- **Manual dispatch**: Configurable deployment options

## 📈 Performance Optimization

### Resource Allocation
- **CPU**: 4-core allocation for multimedia processing
- **Memory**: 8GB limit for large media operations
- **GPU**: NVIDIA GPU for accelerated processing
- **Storage**: Fast SSD for media caching

### Caching Strategy
- **Redis**: Session and result caching
- **CDN**: Media asset distribution
- **Local Cache**: Temporary processing files

## 🔧 Operational Procedures

### Daily Operations
1. **Morning Health Check**: Verify all services are operational
2. **Performance Review**: Check metrics and alerts
3. **Capacity Planning**: Monitor resource utilization
4. **API Quota Monitoring**: Track rate limit usage

### Weekly Operations
1. **Performance Baseline Update**: Refresh performance benchmarks
2. **Security Audit**: Review access logs and security metrics
3. **Capacity Planning**: Analyze usage trends
4. **Backup Verification**: Ensure backup procedures are working

### Monthly Operations
1. **Disaster Recovery Testing**: Test rollback procedures
2. **Performance Optimization**: Analyze and optimize bottlenecks
3. **Cost Analysis**: Review resource usage and costs
4. **Documentation Updates**: Update operational procedures

## 🆘 Emergency Procedures

### Service Degradation
1. **Identify Issue**: Use monitoring dashboards
2. **Isolate Service**: Disable problematic service
3. **Scale Resources**: Increase pod replicas if needed
4. **Communicate**: Notify stakeholders

### Complete Outage
1. **Emergency Rollback**: Immediate rollback to last known good state
2. **Incident Response**: Follow incident response procedures
3. **Root Cause Analysis**: Investigate after recovery
4. **Post-Mortem**: Document lessons learned

## 📞 Support Contacts

### On-Call Rotation
- **Primary**: DevOps Team (+1-xxx-xxx-xxxx)
- **Secondary**: Engineering Team (+1-xxx-xxx-xxxx)
- **Escalation**: Technical Lead (+1-xxx-xxx-xxxx)

### External Support
- **Google Cloud Support**: Case-based support
- **Infrastructure Provider**: 24/7 support available
- **Monitoring Vendor**: Technical support contact

## 📚 Additional Resources

### Documentation
- [Google Services API Documentation](./docs/api/google-services/)
- [Kubernetes Deployment Guide](./docs/deployment/)
- [Monitoring Setup Guide](./docs/operations/)

### Runbooks
- [Emergency Response Runbook](./docs/operations/emergency-response.md)
- [Performance Troubleshooting](./docs/operations/performance-troubleshooting.md)
- [Scaling Procedures](./docs/operations/scaling-procedures.md)

### Training Materials
- [Google Services Training](./docs/training/google-services.md)
- [Kubernetes Operations](./docs/training/kubernetes-ops.md)
- [Monitoring Best Practices](./docs/training/monitoring.md)

---

## ✅ Deployment Checklist

- [x] Google services enabled in Helm values
- [x] Resource limits updated for GPU support
- [x] Secret management configured
- [x] Monitoring and alerting setup
- [x] Canary deployment strategy configured
- [x] Rollback procedures implemented
- [x] GitHub Actions workflow updated
- [x] Validation scripts created
- [x] Documentation completed
- [x] Emergency procedures defined

**Status**: ✅ Ready for Production Deployment

**Last Updated**: $(date +'%Y-%m-%d %H:%M:%S UTC')
**Version**: 1.2.1-google-services
**Environment**: Production Ready