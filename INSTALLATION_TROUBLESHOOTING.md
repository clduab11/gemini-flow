# gemini-flow Installation Troubleshooting Guide

This guide helps resolve common installation issues with gemini-flow.

## Quick Solutions

### For npm install -g Issues

If you encounter errors like:
```
ReferenceError: require is not defined in ES module scope
```

**Solution**:
1. Clear your npm cache:
   ```bash
   npm cache clean --force
   ```

2. Remove any existing global installation:
   ```bash
   npm uninstall -g @clduab11/gemini-flow
   ```

3. Install the latest version:
   ```bash
   npm install -g @clduab11/gemini-flow@latest
   ```

### For gemini extensions install Issues

If you encounter:
```
Configuration file not found at [temp directory]/gemini-extension.json
```

**Solution**:
1. Verify you're using the full GitHub URL (required):
   ```bash
   gemini extensions install https://github.com/clduab11/gemini-flow
   ```
   
   ❌ **Don't use**: `gemini extensions install github:clduab11/gemini-flow`
   
   ✅ **Use**: `gemini extensions install https://github.com/clduab11/gemini-flow`

2. Update Gemini CLI to the latest version:
   ```bash
   npm update -g @google/generative-ai-cli
   # or
   npm install -g @google/generative-ai-cli@latest
   ```

3. Try installing from a local clone:
   ```bash
   git clone https://github.com/clduab11/gemini-flow.git
   cd gemini-flow
   gemini extensions install .
   ```

## Installation Methods

### Method 1: npm Global Install (Recommended for CLI usage)

```bash
npm install -g @clduab11/gemini-flow
```

**Pros**:
- Adds `gemini-flow` and `gf` commands to your PATH
- Works across all directories
- Standard npm workflow

**Cons**:
- Requires global npm permissions
- May need `sudo` on Unix systems

### Method 2: Gemini CLI Extension (Recommended for Gemini CLI users)

```bash
gemini extensions install https://github.com/clduab11/gemini-flow
gemini extensions enable gemini-flow
```

**Pros**:
- Integrates with Gemini CLI
- Automatic MCP server configuration
- Context files auto-loaded

**Cons**:
- Requires Gemini CLI to be installed
- Extension-specific commands

### Method 3: Local Development Install

```bash
git clone https://github.com/clduab11/gemini-flow.git
cd gemini-flow
npm install
npm run build
```

**Pros**:
- Full source code access
- Can modify and contribute
- No global permissions needed

**Cons**:
- Must run from project directory
- Requires manual updates

## Common Issues and Solutions

### Issue: "Cannot find module 'commander'"

**Cause**: Dependencies not installed

**Solution**:
```bash
cd /path/to/gemini-flow
npm install
```

### Issue: "EACCES: permission denied"

**Cause**: Insufficient permissions for global install

**Solution** (Unix/Linux/macOS):
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g @clduab11/gemini-flow

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
npm install -g @clduab11/gemini-flow
```

**Solution** (Windows):
Run PowerShell or Command Prompt as Administrator

### Issue: "Git hooks installation failed"

**Cause**: Husky trying to install in non-git environment

**Solution**:
This is expected and safe to ignore. The postinstall script includes `|| true` to handle this gracefully.

### Issue: "Module not found" for MCP servers

**Cause**: MCP server dependencies not installed globally

**Solution**:
MCP servers are installed on-demand via `npx`. Ensure you have internet access when first using MCP servers.

### Issue: Extension not loading in Gemini CLI

**Cause**: Extension not enabled

**Solution**:
```bash
# Check extension status
gemini extensions list

# Enable if disabled
gemini extensions enable gemini-flow

# Restart Gemini CLI
gemini extensions disable gemini-flow
gemini extensions enable gemini-flow
```

## Environment Requirements

### Required

- **Node.js**: >= 18.0.0, <= 24.0.0
- **npm**: >= 8.0.0

### Optional (for specific features)

- **Redis**: For Redis MCP server
  ```bash
  # macOS
  brew install redis
  brew services start redis
  
  # Ubuntu/Debian
  sudo apt-get install redis-server
  sudo systemctl start redis-server
  
  # Windows
  # Download from https://redis.io/download
  ```

- **Python 3.8+**: For Git Tools MCP server
  ```bash
  python3 --version  # Verify installation
  pip install mcp-server-git
  ```

### Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check gemini-flow installation
gemini-flow --version
# or
gf --version

# Test MCP servers (if using extension)
gemini extensions info gemini-flow
```

## Getting Help

If you continue to experience issues:

1. **Check the version**: Ensure you're using the latest version
   ```bash
   npm view @clduab11/gemini-flow version
   npm list -g @clduab11/gemini-flow
   ```

2. **Check logs**: Look for detailed error messages
   ```bash
   npm install -g @clduab11/gemini-flow --loglevel verbose
   ```

3. **File an issue**: If the problem persists, create an issue at:
   https://github.com/clduab11/gemini-flow/issues
   
   Include:
   - Operating system and version
   - Node.js and npm versions
   - Full error message
   - Installation command used
   - Output of `npm config list`

## Additional Resources

- **Documentation**: [gemini-flow.md](./gemini-flow.md)
- **Gemini Context**: [GEMINI.md](./GEMINI.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Docker Setup**: [DOCKER.md](./DOCKER.md)
- **Vertex AI**: [VERTEX_AI_SETUP.md](./VERTEX_AI_SETUP.md)

## Quick Test

After installation, verify everything works:

```bash
# Test CLI (if installed globally)
gemini-flow --help

# Test extension (if using Gemini CLI)
gemini extensions list
gemini hive-mind --help

# Test MCP integration (if applicable)
# This will verify MCP servers can connect
gemini-flow mcp:smoke
```

---

**Last Updated**: November 2024
**Version**: 1.3.3
**Maintainer**: clduab11
