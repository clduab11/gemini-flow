# Global NPM Install Testing Guide

This guide provides step-by-step instructions for testing the global npm installation of `@clduab11/gemini-flow` after fixing the husky postinstall issue.

## Quick Start

### 1. Local Testing (5 minutes)

```bash
# Navigate to project directory
cd /Users/chrisdukes/Desktop/projects/gemini-flow

# Run the comprehensive local test
./tests/scripts/test-local-install.sh

# Run functionality tests
./tests/scripts/test-functionality.sh
```

### 2. Performance Testing (10 minutes)

```bash
# Run performance benchmarks
./tests/scripts/test-performance.sh --quick

# For full performance analysis
./tests/scripts/test-performance.sh
```

### 3. Cross-Platform Testing (15-30 minutes)

```bash
# Test across multiple Node.js versions with Docker
./tests/scripts/test-cross-platform.sh --quick

# For comprehensive cross-platform testing
./tests/scripts/test-cross-platform.sh
```

## Detailed Testing Procedures

### Pre-Testing Setup

1. **Ensure Clean Environment**
   ```bash
   # Check for existing global installation
   npm list -g @clduab11/gemini-flow
   
   # If installed, remove it
   npm uninstall -g @clduab11/gemini-flow
   
   # Clear npm cache
   npm cache clean --force
   ```

2. **Verify Prerequisites**
   ```bash
   # Check Node.js version (should be >= 18.0.0)
   node --version
   
   # Check npm version
   npm --version
   
   # Check if Docker is available (for cross-platform tests)
   docker --version
   ```

### Test Scenarios

#### Scenario 1: Fresh Installation in Non-Git Directory

```bash
# Create temporary directory without git
mkdir /tmp/test-fresh-install
cd /tmp/test-fresh-install

# Install package globally
npm install -g @clduab11/gemini-flow

# Test basic functionality
gemini-flow --version
gemini-flow --help

# Clean up
npm uninstall -g @clduab11/gemini-flow
cd / && rm -rf /tmp/test-fresh-install
```

#### Scenario 2: Installation in Git Repository

```bash
# Create temporary git repository
mkdir /tmp/test-git-install
cd /tmp/test-git-install
git init
git config user.name "Test User"
git config user.email "test@example.com"
echo "# Test" > README.md
git add . && git commit -m "Initial commit"

# Install package globally
npm install -g @clduab11/gemini-flow

# Test functionality
gemini-flow --version

# Clean up
npm uninstall -g @clduab11/gemini-flow
cd / && rm -rf /tmp/test-git-install
```

#### Scenario 3: Upgrade Installation

```bash
# Install an older version first (if available)
npm install -g @clduab11/gemini-flow@previous-version

# Upgrade to latest
npm install -g @clduab11/gemini-flow@latest

# Test functionality
gemini-flow --version

# Clean up
npm uninstall -g @clduab11/gemini-flow
```

### Validation Checklist

After each test scenario, verify:

- [ ] Installation completed without errors
- [ ] No husky-related error messages during installation
- [ ] `gemini-flow` command is available in PATH
- [ ] `gemini-flow --version` returns expected version
- [ ] `gemini-flow --help` displays help information
- [ ] No hanging processes after command execution
- [ ] Clean uninstallation without errors

### Performance Validation

#### Installation Speed
- Installation should complete within 60 seconds on standard hardware
- Monitor for any unusual delays or timeouts

#### Memory Usage
- Peak memory usage during installation should not exceed 100MB
- No significant memory leaks after repeated command execution

#### Resource Cleanup
- No temporary files left after installation/uninstallation
- No hanging processes
- Proper cleanup of npm cache entries

### Troubleshooting Common Issues

#### Issue: Husky Installation Fails

**Symptoms:**
- Error messages mentioning "husky install failed"
- Installation process hangs or fails

**Solution:**
```bash
# Check if the fix is properly implemented
grep -n "postinstall" package.json

# The postinstall script should be conditional or removed for global installs
```

#### Issue: Binary Not Found in PATH

**Symptoms:**
- `command not found: gemini-flow` after installation

**Diagnosis:**
```bash
# Check global npm directory
npm prefix -g

# Check if binary exists
ls -la $(npm prefix -g)/bin/gemini-flow

# Check PATH
echo $PATH | grep -o "$(npm prefix -g)/bin"
```

#### Issue: Permission Denied

**Symptoms:**
- Permission errors during global installation

**Solution:**
```bash
# Check npm configuration
npm config get prefix

# For macOS/Linux, ensure proper permissions
sudo chown -R $(whoami) $(npm prefix -g)

# Or use npm's built-in fix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Emergency Cleanup

If tests fail and leave the system in an inconsistent state:

```bash
# Run emergency cleanup script
./tests/scripts/emergency-cleanup.sh

# Or manually clean up
npm uninstall -g @clduab11/gemini-flow --force
npm cache clean --force
```

### CI/CD Integration

The project includes automated testing via GitHub Actions:

1. **Quick Validation**: Runs on every push/PR
2. **Cross-Platform Testing**: Runs on main branch and scheduled
3. **Performance Testing**: Comprehensive resource usage analysis

To trigger manual testing:
```bash
# Via GitHub CLI
gh workflow run "Global Install Testing" --ref main

# Or through GitHub web interface
# Go to Actions tab -> Global Install Testing -> Run workflow
```

### Reporting Issues

When reporting installation issues, include:

1. **Environment Information:**
   ```bash
   node --version
   npm --version
   uname -a  # or system information
   ```

2. **Installation Logs:**
   ```bash
   npm install -g @clduab11/gemini-flow --verbose
   ```

3. **Test Results:**
   ```bash
   ./tests/scripts/test-local-install.sh > test-results.log 2>&1
   ```

### Best Practices

1. **Always Test in Clean Environment**
   - Use temporary directories
   - Clear npm cache between tests
   - Uninstall previous versions

2. **Verify Cross-Platform Compatibility**
   - Test on different operating systems
   - Test with different Node.js versions
   - Use Docker for consistent environments

3. **Monitor Resource Usage**
   - Check installation time
   - Monitor memory consumption
   - Verify clean resource cleanup

4. **Document Failures**
   - Save error logs
   - Note environmental conditions
   - Record reproduction steps

## Test Automation Scripts

### Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `test-local-install.sh` | Local installation testing | `./tests/scripts/test-local-install.sh` |
| `test-functionality.sh` | Functionality validation | `./tests/scripts/test-functionality.sh` |
| `test-cross-platform.sh` | Cross-platform testing | `./tests/scripts/test-cross-platform.sh` |
| `test-performance.sh` | Performance benchmarking | `./tests/scripts/test-performance.sh` |
| `emergency-cleanup.sh` | System cleanup | `./tests/scripts/emergency-cleanup.sh` |

### Script Options

Most scripts support these common options:
- `--help`: Show usage information
- `--quick`: Run abbreviated test suite
- `--verbose`: Detailed output
- `--force`: Skip confirmation prompts

### Example Test Runs

#### Quick Validation (5 minutes)
```bash
./tests/scripts/test-local-install.sh
./tests/scripts/test-functionality.sh
```

#### Comprehensive Testing (30 minutes)
```bash
./tests/scripts/test-local-install.sh
./tests/scripts/test-functionality.sh
./tests/scripts/test-performance.sh
./tests/scripts/test-cross-platform.sh --quick
```

#### Full Test Suite (60+ minutes)
```bash
./tests/scripts/test-local-install.sh
./tests/scripts/test-functionality.sh
./tests/scripts/test-performance.sh
./tests/scripts/test-cross-platform.sh
```

## Success Criteria

The global npm installation is considered successful when:

1. **Installation Success**: 100% success rate across test scenarios
2. **Functionality**: All core commands work without errors
3. **Performance**: Installation completes within 60 seconds
4. **Resource Usage**: Memory usage stays below 100MB
5. **Cross-Platform**: Works on Windows, macOS, and Linux
6. **Node Compatibility**: Works with Node.js 18, 20, and 21
7. **Clean Uninstall**: No leftover files or processes

## Conclusion

This comprehensive testing strategy ensures that the global npm installation of `@clduab11/gemini-flow` works reliably across all supported platforms and environments. Regular testing and validation help maintain package quality and user experience.

For additional support or questions, refer to the project documentation or create an issue in the GitHub repository.