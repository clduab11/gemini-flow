# GitHub Actions CI/CD Workflows

This directory contains the complete CI/CD pipeline for the Gemini Flow project. The workflows are designed to be intelligent, self-organizing, and provide comprehensive automation for development, testing, security, and deployment processes.

## 🔄 Workflow Overview

### Core Workflows

1. **[CI Pipeline (`ci.yml`)](.//ci.yml)**
   - **Triggers**: Push to main/develop, Pull Requests
   - **Purpose**: Comprehensive testing and validation
   - **Features**:
     - Quick validation job for fast feedback
     - Multi-OS testing (Ubuntu, Windows, macOS)
     - Multi-Node.js version testing (18, 20, 22)
     - Type checking, linting, and testing
     - CLI binary testing
     - Code coverage reporting (Codecov)
     - Build artifact generation

2. **[Build Verification (`build.yml`)](.//build.yml)**
   - **Triggers**: Push/PR to main/develop (source changes only)
   - **Purpose**: Focused build verification and package validation
   - **Features**:
     - Multi-Node.js version build testing
     - Build output verification
     - CLI executable testing
     - Package creation and verification
     - Build artifact uploads

3. **[Release Pipeline (`release.yml`)](.//release.yml)**
   - **Triggers**: Push to main, Manual workflow dispatch
   - **Purpose**: Automated and manual release management
   - **Features**:
     - Automatic version change detection
     - Manual release type selection (patch/minor/major)
     - Intelligent release skipping with commit messages
     - Automatic changelog generation
     - Git tag creation and GitHub release publishing
     - Integration with npm publish workflow

4. **[NPM Publish (`publish.yml`)](.//publish.yml)**
   - **Triggers**: GitHub releases, Manual workflow dispatch
   - **Purpose**: Secure npm package publishing
   - **Features**:
     - Pre-publish validation and checks
     - Version conflict detection
     - Dry-run capability
     - Publication verification
     - Post-publish notifications
     - Production environment protection

### Security & Quality Workflows

5. **[Security Scanning (`security.yml`)](.//security.yml)**
   - **Triggers**: Push/PR, Weekly schedule, Manual
   - **Purpose**: Comprehensive security analysis
   - **Features**:
     - Dependency vulnerability scanning
     - CodeQL static analysis
     - Secrets detection with TruffleHog
     - License compliance checking
     - Security summary reporting

6. **[Performance Benchmarks (`performance.yml`)](.//performance.yml)**
   - **Triggers**: PR with source changes, Push to main, Weekly schedule
   - **Purpose**: Performance monitoring and regression detection
   - **Features**:
     - Startup time benchmarking
     - Memory usage analysis
     - CLI command performance testing
     - Build time measurement
     - PR performance comments
     - Artifact-based result storage

### Automation & Maintenance

7. **[Dependabot Configuration (`../dependabot.yml`)](.//dependabot.yml)**
   - **Purpose**: Automated dependency updates
   - **Features**:
     - Weekly npm dependency updates
     - GitHub Actions updates
     - Grouped updates by category
     - Automatic PR creation
     - Intelligent version update filtering

## 🚀 Workflow Features

### Intelligence & Optimization

- **Concurrency Control**: Prevents redundant runs and manages resource usage
- **Path-based Triggers**: Only runs when relevant files change
- **Quick Feedback**: Fast validation jobs provide immediate feedback
- **Matrix Strategies**: Comprehensive testing across multiple environments
- **Artifact Management**: Efficient storage and sharing of build outputs

### Security Best Practices

- **Environment Protection**: Production deployments require manual approval
- **Secret Management**: Secure handling of NPM tokens and GitHub tokens
- **Vulnerability Scanning**: Multi-layered security analysis
- **License Compliance**: Automated license checking
- **Dependency Reviews**: Automated dependency vulnerability assessment

### Developer Experience

- **PR Comments**: Automated performance and test result comments
- **Status Checks**: Clear pass/fail indicators for all quality gates
- **Summary Reports**: Rich workflow summaries with key metrics
- **Manual Controls**: Workflow dispatch options for manual operations
- **Skip Mechanisms**: Commit message-based workflow skipping

## 📋 Workflow Dependencies

```mermaid
graph TD
    A[CI Pipeline] --> B[Build Verification]
    C[Release Pipeline] --> D[NPM Publish]
    E[Security Scanning] --> F[All PRs]
    G[Performance Tests] --> H[PR Comments]
    I[Dependabot] --> J[Auto PRs]
```

## 🔧 Configuration

### Required Secrets

The following secrets must be configured in the GitHub repository:

- `NPM_TOKEN`: npm authentication token for package publishing
- `CODECOV_TOKEN`: Codecov token for coverage reporting (optional)

### Environment Setup

1. **Production Environment**: Create a production environment in GitHub with protection rules
2. **Branch Protection**: Configure branch protection rules for main/develop branches
3. **Status Checks**: Require CI workflow status checks before merging

### Custom Configuration

Each workflow includes environment variables that can be customized:

```yaml
env:
  NODE_VERSION: '20'        # Default Node.js version
  CACHE_VERSION: 'v2'       # Cache versioning
```

## 📊 Monitoring & Metrics

### Workflow Analytics

- **Build Times**: Track build performance over time
- **Test Coverage**: Monitor code coverage trends
- **Security Issues**: Track vulnerability remediation
- **Dependency Updates**: Monitor update frequency and success

### Performance Tracking

- **Startup Time**: CLI application startup performance
- **Memory Usage**: Runtime memory consumption
- **Build Size**: Package size monitoring
- **Test Execution**: Test suite performance

## 🔄 Maintenance

### Regular Tasks

1. **Monthly**: Review workflow performance and optimization opportunities
2. **Quarterly**: Update Node.js versions in matrices
3. **As Needed**: Adjust security scanning frequency based on risk assessment
4. **On Security Alerts**: Review and update dependency scanning configurations

### Troubleshooting

Common issues and solutions:

1. **Failed Tests**: Check test logs and ensure environment consistency
2. **Build Failures**: Verify dependencies and Node.js version compatibility
3. **Security Alerts**: Review dependency updates and apply patches
4. **Performance Regressions**: Analyze benchmark results and optimize code

## 🎯 Best Practices

### Commit Messages

Use conventional commit messages to trigger appropriate workflows:

- `feat:` - New features (may trigger minor version bump)
- `fix:` - Bug fixes (triggers patch version bump)
- `[skip-release]` - Skip automatic release creation
- `[no-ci]` - Skip CI workflows (use sparingly)

### Branch Strategy

- **main**: Production-ready code, triggers releases
- **develop**: Development integration, triggers full CI
- **feature/***: Feature branches, triggers PR workflows

### Release Management

- **Automatic**: Version changes in package.json trigger releases
- **Manual**: Use workflow dispatch for controlled releases
- **Hotfixes**: Emergency releases can skip tests with manual override

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates)
- [CodeQL Analysis](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors)

---

*This CI/CD pipeline is designed to scale with your project and adapt to changing requirements. Regular review and optimization ensure continued efficiency and security.*