# PROJECT SPECIFICATION - OPTIMAL FORMAT FOR THE FACTORY

> This template is optimized for The Factory's chain reaction system.
> The more structured your specification, the better the output.

## 🎯 MANIFEST
```yaml
name: "Project Name Here"
type: "web_app|api|data_pipeline|ai_system|automation|tool|library|custom"
complexity: "simple|medium|complex|extreme"
paradigm: "hierarchical|swarm|neural|temporal|hybrid|auto"
priority: "prototype|production|enterprise"
timeline: "hours|days|weeks|months"
```

## 🎨 VISION
*In one paragraph, describe what this project should achieve and why it exists.*

[Your vision here]

## 🎯 OBJECTIVES

### Primary Objective
- **MUST HAVE**: [The one thing this must accomplish]

### Secondary Objectives
1. [Important but not critical objective 1]
2. [Important but not critical objective 2]
3. [Important but not critical objective 3]

### Constraints & Non-Goals
- **MUST NOT**: [What this project should explicitly avoid]
- **OUT OF SCOPE**: [Features/aspects not included in this version]

## 🚀 FEATURES

### Core Features (MVP)
*These MUST be implemented for the project to be considered complete*

- [ ] **Feature 1**: [Description]
  - User story: As a [user], I want to [action] so that [benefit]
  - Acceptance criteria: [How to verify this works]

- [ ] **Feature 2**: [Description]
  - User story: As a [user], I want to [action] so that [benefit]
  - Acceptance criteria: [How to verify this works]

- [ ] **Feature 3**: [Description]
  - User story: As a [user], I want to [action] so that [benefit]
  - Acceptance criteria: [How to verify this works]

### Extended Features (Nice to Have)
*Implement these if time/resources allow*

- [ ] **Feature 4**: [Brief description]
- [ ] **Feature 5**: [Brief description]
- [ ] **Feature 6**: [Brief description]

### Future Considerations
*Not for this iteration, but keep in mind for architecture*

- [Future feature or consideration]
- [Future feature or consideration]

## 🏗️ ARCHITECTURE HINTS

```yaml
pattern: "microservices|monolith|serverless|event-driven|layered|hexagonal|auto"
scale_expectations:
  users: 100-1000  # Expected concurrent users
  requests_per_second: 100
  data_volume: "1GB"
  growth_rate: "10x per year"

components:
  frontend:
    type: "spa|ssr|static|mobile|desktop|auto"
    framework_hint: "react|vue|angular|svelte|nextjs|auto"

  backend:
    type: "rest|graphql|grpc|websocket|auto"
    framework_hint: "express|fastapi|django|rails|auto"

  database:
    type: "relational|document|graph|timeseries|auto"
    preference: "postgresql|mongodb|neo4j|influxdb|auto"

  cache:
    required: true|false
    type: "redis|memcached|in-memory|auto"

  queue:
    required: true|false
    type: "rabbitmq|kafka|sqs|bull|auto"

integrations:
  - service: "stripe|auth0|sendgrid|s3|other"
    purpose: "payment|auth|email|storage|other"
    required: true|false
```

## 💻 TECHNICAL SPECIFICATIONS

### Language Preferences
```yaml
primary_language: "typescript|python|go|rust|java|auto"
secondary_languages: ["javascript", "sql", "bash"]
avoid_languages: ["php", "perl"]  # Optional: languages to avoid
```

### Development Standards
```yaml
code_style:
  naming: "camelCase|snake_case|PascalCase|kebab-case"
  indent: "spaces:2|spaces:4|tabs"
  line_length: 80|100|120
  comments: "minimal|moderate|comprehensive"

patterns:
  - "dependency injection"
  - "repository pattern"
  - "factory pattern"
  - "observer pattern"

principles:
  - "DRY"
  - "SOLID"
  - "KISS"
  - "YAGNI"
```

### Performance Requirements
```yaml
response_time:
  p50: "100ms"
  p95: "500ms"
  p99: "1000ms"

throughput:
  minimum: "100 req/s"
  target: "1000 req/s"
  maximum: "10000 req/s"

resource_limits:
  cpu: "2 cores"
  memory: "4GB"
  storage: "100GB"
```

## 🔒 SECURITY & COMPLIANCE

### Security Requirements
- [ ] **Authentication**: [OAuth2|JWT|Session|SAML|auto]
- [ ] **Authorization**: [RBAC|ABAC|ACL|auto]
- [ ] **Encryption**: [at-rest|in-transit|both]
- [ ] **Audit Logging**: [required|optional|none]

### Compliance
- [ ] **GDPR**: [required|not-required]
- [ ] **HIPAA**: [required|not-required]
- [ ] **PCI-DSS**: [required|not-required]
- [ ] **SOC2**: [required|not-required]

## ✅ QUALITY REQUIREMENTS

### Testing
```yaml
coverage_target: 80%
test_types:
  unit: required
  integration: required
  e2e: optional
  performance: optional
  security: optional

test_framework_hints:
  - "jest|pytest|go-test|junit"
  - "cypress|playwright|selenium"
```

### Documentation
```yaml
level: "minimal|standard|comprehensive"
include:
  - api_documentation: true
  - code_comments: true
  - architecture_diagrams: true
  - deployment_guide: true
  - user_manual: false
  - developer_guide: true
```

### Monitoring & Observability
```yaml
logging:
  level: "error|warning|info|debug"
  format: "json|plaintext"
  destination: "stdout|file|cloud"

metrics:
  required: true
  types: ["performance", "business", "error"]

tracing:
  required: false
  type: "opentelemetry|jaeger|zipkin"

alerting:
  required: true
  channels: ["email", "slack", "pagerduty"]
```

## 📦 DELIVERABLES

### Required Outputs
- [ ] **Source Code**
  - [ ] Frontend application
  - [ ] Backend services
  - [ ] Database schemas/migrations
  - [ ] Configuration files

- [ ] **Tests**
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] Test data/fixtures

- [ ] **Documentation**
  - [ ] README.md
  - [ ] API documentation
  - [ ] Architecture overview
  - [ ] Setup instructions

- [ ] **Deployment**
  - [ ] Dockerfile/docker-compose
  - [ ] CI/CD pipeline configuration
  - [ ] Infrastructure as Code (optional)
  - [ ] Environment variables template

### Optional Outputs
- [ ] Performance benchmarks
- [ ] Security audit report
- [ ] Load testing scripts
- [ ] Monitoring dashboards
- [ ] Runbook/playbook

## 🚢 DEPLOYMENT

### Environment Strategy
```yaml
environments:
  - development:
      auto_deploy: true
      branch: "develop"
  - staging:
      auto_deploy: true
      branch: "main"
  - production:
      auto_deploy: false
      branch: "main"
      approval_required: true
```

### Infrastructure Preferences
```yaml
platform: "aws|gcp|azure|heroku|vercel|self-hosted|auto"
containerization: "docker|podman|none"
orchestration: "kubernetes|ecs|cloud-run|none"
cdn: "cloudflare|cloudfront|fastly|none"
```

## 🔄 ITERATION STRATEGY

### MVP Definition
*What constitutes a "working" first version?*

1. [Minimum viable feature 1]
2. [Minimum viable feature 2]
3. [Minimum viable feature 3]

### Iteration Plan
```yaml
iteration_1:
  focus: "Core functionality"
  duration: "1 week"
  goals:
    - Basic CRUD operations
    - Authentication
    - Minimal UI

iteration_2:
  focus: "Polish and optimization"
  duration: "1 week"
  goals:
    - Performance optimization
    - Error handling
    - UI improvements

iteration_3:
  focus: "Production readiness"
  duration: "1 week"
  goals:
    - Security hardening
    - Monitoring setup
    - Documentation completion
```

## 🎯 SUCCESS CRITERIA

### Definition of Done
- [ ] All core features implemented
- [ ] Tests passing with >80% coverage
- [ ] Documentation complete
- [ ] Code reviewed and approved
- [ ] Performance targets met
- [ ] Security scan passed
- [ ] Deployed to staging environment

### Key Metrics
```yaml
technical_metrics:
  - "Response time < 200ms"
  - "Error rate < 1%"
  - "Uptime > 99.9%"

business_metrics:
  - "User satisfaction > 4/5"
  - "Task completion rate > 90%"
  - "Time to first value < 5 minutes"
```

## 📝 ADDITIONAL CONTEXT

### Similar Projects/Inspirations
- [Project/Product 1]: [What to emulate]
- [Project/Product 2]: [What to avoid]

### Domain Knowledge
*Any specific domain knowledge The Factory should be aware of?*

[Domain-specific information, terminology, constraints]

### Special Considerations
*Anything unusual or unique about this project?*

[Special requirements, edge cases, unique challenges]

---

## 🤖 FACTORY OPTIMIZATION HINTS
*These help The Factory work more efficiently*

```yaml
agent_hints:
  preferred_agents:
    - "architect: For complex system design"
    - "swarm: For parallel feature development"
    - "neural: For pattern recognition tasks"

  avoid_agents:
    - "temporal: Not needed for this project type"

quality_gates:
  strict: true  # Fail fast on quality issues
  iterations: 3  # Number of improvement iterations

parallelization:
  enabled: true
  max_teams: 5

optimization_focus:
  - "performance"
  - "maintainability"
  - "scalability"
```

---

*Last updated: [Date]*
*Specification version: 1.0*
*Factory compatibility: v1.0+*