# Scripts Directory

## postinstall.cjs

**Purpose**: Conditional Husky installation script

**Problem Solved**: Fixes npm error 127 that occurs during global installs when husky (a devDependency) is not available.

**How it works**:
- Detects production, global, or CI environments
- Only runs `husky install` in development environments where devDependencies are available
- Gracefully skips husky setup when not in development

**Environment Detection**:
- `NODE_ENV === 'production'`
- `npm_config_global === 'true'` (global installs)
- `CI` or `CONTINUOUS_INTEGRATION` environment variables
- Missing `node_modules/husky` directory

**Usage**:
- Automatically runs via `npm install` (postinstall hook)
- Can be run manually: `node scripts/postinstall.cjs`

This ensures the package can be installed globally (`npm install -g`) or in production environments without husky-related errors while still setting up git hooks in development environments.