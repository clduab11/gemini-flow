# Gemini-Flow Packages

This directory contains the modular packages that make up the Gemini-Flow ecosystem.

## Package Structure

### Core Packages
- `packages/core/` - Core orchestration engine
- `packages/agents/` - Agent definitions and implementations
- `packages/integrations/` - Third-party integrations (Google, OpenAI, etc.)

### Specialized Packages
- `packages/sparc/` - SPARC methodology implementation
- `packages/memory/` - Memory management and persistence
- `packages/workspace/` - Workspace and project management
- `packages/cli/` - Command-line interface tools

## Development

Each package is independently versioned and can be published separately:

```bash
# Build all packages
npm run build:workspaces

# Test all packages
npm run test:workspaces

# Lint all packages
npm run lint:workspaces
```

## Package Guidelines

1. Each package should have its own `package.json`
2. Use proper semver versioning
3. Include comprehensive tests
4. Document APIs thoroughly
5. Follow monorepo workspace conventions