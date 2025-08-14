# Migration Guide: v1.2.x to v1.3.0

This guide helps you migrate from Gemini Flow v1.2.x to v1.3.0, which introduces significant new features and architectural improvements.

## 🚨 Breaking Changes

### 1. Project Structure Changes

The project structure has been significantly expanded. Update your import paths:

```javascript
// Before v1.3.0
import { Agent } from './src/agent.js';
import { Consensus } from './src/consensus.js';

// After v1.3.0
import { Agent } from './src/agents/agent-definitions.js';
import { ByzantineConsensus } from './src/consensus/byzantine-consensus.js';
```

### 2. Configuration Updates

#### Environment Variables
New required environment variables:

```bash
# Google Services Integration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
VERTEX_AI_LOCATION=us-central1

# Monitoring Stack
PROMETHEUS_ENDPOINT=http://localhost:9090
GRAFANA_ENDPOINT=http://localhost:3000
MONITORING_ENABLED=true

# Performance & Load Testing
LOAD_TESTING_ENABLED=true
MAX_CONCURRENT_OPERATIONS=10000
BENCHMARK_MODE=production

# Security
JWT_SECRET=your-jwt-secret
BCRYPT_ROUNDS=12
SECURITY_HARDENING_ENABLED=true
```

#### Package.json Scripts
New scripts have been added. Update your CI/CD pipelines:

```json
{
  "scripts": {
    "test:google-services": "npm run test:google-services:unit && npm run test:google-services:integration",
    "benchmark:comprehensive": "node src/benchmarks/benchmark-runner.js --mode comprehensive",
    "load-test:1k": "node src/benchmarks/load-testing-coordinator.js --scenario concurrent_1k",
    "monitoring:start": "node src/monitoring/performance-monitor.js",
    "validate:google-services": "bash scripts/deployment/validate-google-services.sh"
  }
}
```

### 3. API Changes

#### Agent System
```javascript
// Before v1.3.0
const agent = new Agent({ type: 'basic' });

// After v1.3.0
import { AgentSpace } from './src/agentspace/agent-space-manager.js';
const agentSpace = new AgentSpace();
const agent = await agentSpace.createAgent({
  type: 'coordinator',
  capabilities: ['research', 'analysis'],
  swarmId: 'research-swarm-001'
});
```

#### Consensus Protocols
```javascript
// Before v1.3.0
const consensus = new Consensus();

// After v1.3.0
import { ByzantineConsensus } from './src/consensus/byzantine-consensus.js';
const consensus = new ByzantineConsensus({
  minimumQuorum: 3,
  faultTolerance: 1,
  consensusTimeout: 30000
});
```

## 🆕 New Features to Adopt

### 1. Google Services Integration

#### Enable Google Cloud AI Services
```javascript
import { GoogleServicesAdapter } from './src/adapters/google-services-adapter.js';

const googleServices = new GoogleServicesAdapter({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Gemini Integration
const geminiResponse = await googleServices.gemini.generateContent({
  prompt: "Your prompt here",
  model: "gemini-pro"
});

// Vertex AI Integration
const vertexResponse = await googleServices.vertex.predict({
  instances: [{ content: "Your input" }],
  parameters: { maxOutputTokens: 256 }
});
```

#### Video Generation with Veo3
```javascript
import { Veo3VideoGenerator } from './src/multimedia/veo3-integration.js';

const videoGen = new Veo3VideoGenerator();
const video = await videoGen.generateVideo({
  prompt: "A serene mountain landscape",
  duration: 10,
  resolution: "1080p"
});
```

### 2. Advanced Monitoring

#### Production Monitoring Setup
```javascript
import { ProductionMonitoringSystem } from './src/monitoring/production-monitoring-system.js';

const monitoring = new ProductionMonitoringSystem({
  prometheus: { endpoint: process.env.PROMETHEUS_ENDPOINT },
  grafana: { endpoint: process.env.GRAFANA_ENDPOINT },
  slaCompliance: {
    responseTime: 100, // ms
    availability: 99.9, // %
    errorRate: 0.1 // %
  }
});

await monitoring.start();
```

#### Custom Metrics Dashboard
```javascript
import { CustomMetricsDashboard } from './src/monitoring/custom-metrics-dashboard.js';

const dashboard = new CustomMetricsDashboard();
dashboard.addMetric('response_time', 'histogram');
dashboard.addMetric('active_agents', 'gauge');
dashboard.addMetric('consensus_rounds', 'counter');
```

### 3. Performance Optimization

#### Benchmarking System
```javascript
import { BenchmarkRunner } from './src/benchmarks/benchmark-runner.js';

const benchmark = new BenchmarkRunner({
  mode: 'comprehensive',
  scenarios: ['concurrent_1k', 'concurrent_10k', 'sustained_24h']
});

const results = await benchmark.run();
console.log('Benchmark Results:', results);
```

#### Load Testing
```javascript
import { LoadTestingCoordinator } from './src/benchmarks/load-testing-coordinator.js';

const loadTest = new LoadTestingCoordinator({
  scenario: 'concurrent_10k',
  duration: 3600, // 1 hour
  rampUp: 300 // 5 minutes
});

await loadTest.execute();
```

### 4. Security Enhancements

#### Production Security Hardening
```javascript
import { SecurityHardening } from './src/security/production-security-hardening.js';

const security = new SecurityHardening({
  jwtSecret: process.env.JWT_SECRET,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS),
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  }
});

await security.initialize();
```

## 📋 Migration Checklist

### Phase 1: Preparation
- [ ] Backup your current codebase
- [ ] Review breaking changes section
- [ ] Update Node.js to v18+ if not already
- [ ] Set up Google Cloud project and credentials
- [ ] Configure monitoring infrastructure (Prometheus/Grafana)

### Phase 2: Code Updates
- [ ] Update import statements for new project structure
- [ ] Migrate agent initialization to new AgentSpace system
- [ ] Update consensus protocol usage
- [ ] Add new environment variables
- [ ] Update package.json scripts

### Phase 3: Feature Integration
- [ ] Integrate Google Services (if needed)
- [ ] Set up production monitoring
- [ ] Configure performance benchmarking
- [ ] Implement security hardening
- [ ] Add multimedia capabilities (if needed)

### Phase 4: Testing
- [ ] Run new test suites: `npm run test:google-services`
- [ ] Execute benchmarks: `npm run benchmark:comprehensive`
- [ ] Validate monitoring: `npm run monitoring:start`
- [ ] Test load scenarios: `npm run load-test:1k`
- [ ] Security audit: `npm run security:audit`

### Phase 5: Deployment
- [ ] Update CI/CD pipelines with new scripts
- [ ] Deploy monitoring infrastructure
- [ ] Configure production environment variables
- [ ] Run production validation: `npm run validate:google-services`
- [ ] Monitor deployment with new dashboards

## 🔧 Common Migration Issues

### Issue: Import Path Errors
**Solution**: Update all import statements to use new directory structure.

### Issue: Environment Variable Missing
**Solution**: Add all required environment variables from the list above.

### Issue: Agent Initialization Fails
**Solution**: Migrate from direct Agent instantiation to AgentSpace pattern.

### Issue: Consensus Protocol Errors
**Solution**: Update to new ByzantineConsensus with minimum quorum configuration.

### Issue: Google Services Authentication
**Solution**: Ensure GOOGLE_APPLICATION_CREDENTIALS points to valid service account key.

## 📞 Support

If you encounter issues during migration:

1. Check the [troubleshooting guide](./docs/TROUBLESHOOTING.md)
2. Review the [comprehensive architecture analysis](./docs/implementation/COMPREHENSIVE-ARCHITECTURE-ANALYSIS.md)
3. Open an issue on [GitHub](https://github.com/claude-ai/gemini-flow/issues)
4. Join our community discussions

## 🎯 Performance Expectations

After migration to v1.3.0, you should see:

- **Response Times**: Sub-100ms for most operations
- **Scalability**: Support for 100k+ concurrent operations
- **Reliability**: 99.9% uptime with proper monitoring
- **Security**: Enterprise-grade security compliance
- **Observability**: Complete system visibility with dashboards

## 🚀 Next Steps

After successful migration:

1. Explore the new [Agent Space framework](./docs/agentspace/README.md)
2. Set up [advanced monitoring](./docs/monitoring/README.md)
3. Configure [load testing scenarios](./docs/benchmarks/README.md)
4. Implement [Google Services integration](./docs/google-services/README.md)
5. Review [production deployment guide](./docs/deployment/README.md)

Welcome to Gemini Flow v1.3.0! 🎉