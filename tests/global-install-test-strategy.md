# Global NPM Install Test Strategy

## Overview
Comprehensive testing strategy to verify that `@clduab11/gemini-flow` can be successfully installed globally via npm after fixing the husky postinstall issue.

## Problem Analysis

### Current Issue
- Package has `"postinstall": "husky install"` in package.json
- Husky tries to initialize git hooks during global installation
- Global installs don't need/support repository-specific git hooks
- This causes installation failures in non-git environments

### Root Cause
The postinstall script assumes a local development environment with git repository, but global installations occur in npm's global directory without git context.

## Test Strategy Components

### 1. Pre-Test Environment Preparation

#### Clean Environment Setup
```bash
# Remove any existing global installation
npm uninstall -g @clduab11/gemini-flow

# Clear npm cache
npm cache clean --force

# Verify clean state
npm list -g | grep gemini-flow
```

#### Test Environment Variants
- **Local Git Repository**: Standard development environment
- **Non-Git Directory**: Temporary directory without git
- **Global NPM Directory**: Direct installation to global location
- **CI/CD Environment**: Automated testing environment

### 2. Installation Testing Framework

#### Test Scenarios
1. **Fresh Installation**: Clean environment, first-time install
2. **Upgrade Installation**: Existing version to new version
3. **Reinstallation**: Uninstall then reinstall
4. **Parallel Installation**: Multiple concurrent installs
5. **Network Constrained**: Slow/unstable network conditions

#### Platform Testing Matrix
| Platform | Node Version | NPM Version | Package Manager |
|----------|--------------|-------------|-----------------|
| macOS    | 18.x, 20.x, 21.x | 9.x, 10.x | npm, yarn, pnpm |
| Linux    | 18.x, 20.x, 21.x | 9.x, 10.x | npm, yarn, pnpm |
| Windows  | 18.x, 20.x, 21.x | 9.x, 10.x | npm, yarn, pnpm |

### 3. Validation Criteria

#### Installation Success Indicators
- [ ] NPM install command exits with code 0
- [ ] Package files are present in global node_modules
- [ ] Binary/CLI commands are available in PATH
- [ ] Core functionality works without errors
- [ ] No error messages in installation output
- [ ] Package.json dependencies are properly installed

#### Post-Install Validation
- [ ] Command `gemini-flow --version` works
- [ ] Core commands execute successfully
- [ ] Configuration files are properly created
- [ ] No hanging processes or file locks
- [ ] Proper cleanup on uninstall

### 4. Performance Benchmarks

#### Installation Metrics
- **Installation Time**: < 60 seconds on standard hardware
- **Download Size**: Verify expected package size
- **Dependency Resolution**: Track dependency count and conflicts
- **Memory Usage**: Monitor peak memory during installation
- **Disk Space**: Measure final installation footprint

#### Baseline Measurements
```bash
# Time installation
time npm install -g @clduab11/gemini-flow

# Monitor system resources
htop / Activity Monitor during installation

# Measure disk usage
du -sh $(npm prefix -g)/lib/node_modules/@clduab11/gemini-flow
```

## Testing Procedures

### Phase 1: Local Development Testing

#### Test Script: `test-local-install.sh`
```bash
#!/bin/bash
set -e

echo "🧪 Testing local global installation..."

# Create test directory
TEST_DIR="/tmp/gemini-flow-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test without git
echo "📁 Testing in non-git directory..."
npm install -g @clduab11/gemini-flow
gemini-flow --version
npm uninstall -g @clduab11/gemini-flow

# Test with git
echo "📁 Testing in git directory..."
git init
npm install -g @clduab11/gemini-flow
gemini-flow --version
npm uninstall -g @clduab11/gemini-flow

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo "✅ Local testing completed successfully"
```

#### Test Script: `test-functionality.sh`
```bash
#!/bin/bash
set -e

echo "🔧 Testing core functionality..."

# Install package
npm install -g @clduab11/gemini-flow

# Test CLI commands
echo "Testing CLI commands..."
gemini-flow --help
gemini-flow --version

# Test core features (non-destructive)
echo "Testing core features..."
gemini-flow status || true
gemini-flow config list || true

# Test memory management
echo "Testing memory usage..."
INITIAL_MEM=$(ps -o pid,vsz,rss,comm -p $$ | tail -1 | awk '{print $2}')
gemini-flow --version > /dev/null
FINAL_MEM=$(ps -o pid,vsz,rss,comm -p $$ | tail -1 | awk '{print $2}')

echo "Memory usage: Initial ${INITIAL_MEM}KB, Final ${FINAL_MEM}KB"

# Cleanup
npm uninstall -g @clduab11/gemini-flow

echo "✅ Functionality testing completed"
```

### Phase 2: Cross-Platform Testing

#### Docker Test Environment
```dockerfile
# test-environments/Dockerfile.node18
FROM node:18-alpine
RUN apk add --no-cache git bash
WORKDIR /test
COPY test-scripts/ ./
RUN chmod +x *.sh
CMD ["./run-tests.sh"]
```

#### Test Matrix Script
```bash
#!/bin/bash
# test-cross-platform.sh

PLATFORMS=("node:18-alpine" "node:20-alpine" "node:21-alpine")
SCENARIOS=("fresh-install" "upgrade-install" "non-git-env")

for platform in "${PLATFORMS[@]}"; do
    for scenario in "${SCENARIOS[@]}"; do
        echo "🧪 Testing $platform with $scenario..."
        
        docker run --rm \
            -v $(pwd)/test-scripts:/test \
            $platform \
            /test/test-$scenario.sh
            
        echo "✅ $platform $scenario completed"
    done
done
```

### Phase 3: Automated CI/CD Testing

#### GitHub Actions Workflow
```yaml
# .github/workflows/global-install-test.yml
name: Global Install Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-global-install:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 21]
        
    runs-on: ${{ matrix.os }}
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        
    - name: Test Global Installation
      run: |
        npm install -g .
        gemini-flow --version
        npm uninstall -g @clduab11/gemini-flow
        
    - name: Test in Non-Git Environment
      run: |
        mkdir temp-test && cd temp-test
        npm install -g ../
        gemini-flow --version
        cd .. && rm -rf temp-test
        npm uninstall -g @clduab11/gemini-flow
```

### Phase 4: Performance and Load Testing

#### Installation Performance Test
```bash
#!/bin/bash
# test-performance.sh

echo "📊 Performance testing global installation..."

# Measure installation time
for i in {1..5}; do
    echo "Run $i/5..."
    
    START_TIME=$(date +%s.%N)
    npm install -g @clduab11/gemini-flow --silent
    END_TIME=$(date +%s.%N)
    
    DURATION=$(echo "$END_TIME - $START_TIME" | bc)
    echo "Installation time: ${DURATION}s"
    
    npm uninstall -g @clduab11/gemini-flow --silent
    sleep 2
done
```

## Rollback and Cleanup Procedures

### Emergency Cleanup Script
```bash
#!/bin/bash
# emergency-cleanup.sh

echo "🧹 Emergency cleanup of global installation..."

# Force remove global package
npm uninstall -g @clduab11/gemini-flow --force || true

# Clean npm cache
npm cache clean --force

# Remove any leftover files
GLOBAL_DIR=$(npm prefix -g)
rm -rf "$GLOBAL_DIR/lib/node_modules/@clduab11"
rm -rf "$GLOBAL_DIR/bin/gemini-flow"

# Reset npm configuration if needed
npm config delete @clduab11:registry || true

echo "✅ Cleanup completed"
```

### Verification After Cleanup
```bash
#!/bin/bash
# verify-cleanup.sh

echo "🔍 Verifying cleanup..."

# Check global installations
if npm list -g | grep -q "@clduab11/gemini-flow"; then
    echo "❌ Package still globally installed"
    exit 1
fi

# Check binary availability
if command -v gemini-flow &> /dev/null; then
    echo "❌ Binary still in PATH"
    exit 1
fi

# Check for leftover files
GLOBAL_DIR=$(npm prefix -g)
if [ -d "$GLOBAL_DIR/lib/node_modules/@clduab11" ]; then
    echo "❌ Package directory still exists"
    exit 1
fi

echo "✅ Cleanup verification passed"
```

## Success Criteria

### Must-Have Requirements
1. **Zero Installation Failures**: All test scenarios pass without errors
2. **Cross-Platform Compatibility**: Works on Windows, macOS, and Linux
3. **Multiple Node Versions**: Compatible with Node 18, 20, and 21
4. **Clean Uninstallation**: No leftover files or processes
5. **Performance Standards**: Installation completes within 60 seconds

### Nice-to-Have Requirements
1. **Progress Indicators**: Clear installation progress feedback
2. **Offline Capability**: Works with npm cache when available
3. **Graceful Degradation**: Handles network issues elegantly
4. **Minimal Footprint**: Efficient disk and memory usage

## Risk Mitigation

### Potential Issues and Solutions
1. **Husky Hook Failures**: Skip hook installation in global mode
2. **Permission Issues**: Test with various user privilege levels
3. **Network Timeouts**: Implement retry mechanisms
4. **Dependency Conflicts**: Test with various global package combinations
5. **Platform-Specific Issues**: Comprehensive cross-platform testing

### Monitoring and Alerting
- Set up automated testing in CI/CD pipeline
- Monitor npm install success rates
- Track user-reported installation issues
- Implement health checks for global installations

## Documentation Requirements

### User-Facing Documentation
- Installation troubleshooting guide
- Platform-specific installation notes
- Common error solutions
- Uninstallation procedures

### Developer Documentation
- Test execution procedures
- CI/CD integration guide
- Performance benchmarking results
- Cross-platform compatibility matrix

## Next Steps

1. **Implement Fix**: Modify postinstall script to skip husky in global installs
2. **Create Test Scripts**: Implement all testing scripts outlined above
3. **Set Up CI/CD**: Configure automated testing pipeline
4. **Execute Testing**: Run comprehensive test suite
5. **Document Results**: Create detailed test report
6. **Release Validation**: Verify fix in production-like environment

This comprehensive test strategy ensures that the global npm installation works reliably across all supported platforms and environments.