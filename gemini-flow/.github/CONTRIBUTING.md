# Contributing to Gemini Flow

Thank you for your interest in contributing to Gemini Flow! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gemini-flow.git
   cd gemini-flow
   ```

3. Install dependencies:
   ```bash
   cd gemini-flow
   npm install
   ```

4. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Emergency fixes

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards
3. Add or update tests as needed
4. Run the test suite:
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

5. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new orchestration feature"
   ```

6. Push to your fork and create a pull request

### Commit Message Format

We follow the Conventional Commits specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper error handling with try/catch blocks
- Document public APIs with JSDoc comments

### Code Style

- Use ESLint and Prettier configurations provided
- Maximum line length: 100 characters
- Use meaningful variable and function names
- Keep functions small and focused (< 50 lines)

### Testing

- Write unit tests for all new functionality
- Maintain minimum 80% code coverage
- Use descriptive test names
- Group related tests with `describe` blocks

### Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Include examples in documentation
- Update CHANGELOG.md for releases

## Pull Request Process

1. Ensure all tests pass and code meets quality standards
2. Update documentation as needed
3. Fill out the pull request template completely
4. Request review from maintainers
5. Address any feedback promptly

### Pull Request Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Commit messages follow convention
- [ ] No breaking changes (or clearly documented)
- [ ] CHANGELOG.md updated

## Issue Reporting

### Bug Reports

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error messages/logs

### Feature Requests

Use the feature request template and include:
- Problem statement
- Proposed solution
- Use cases and benefits
- Alternatives considered

## Development Tips

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Building

```bash
# Build TypeScript
npm run build

# Build in watch mode
npm run build:watch

# Clean build artifacts
npm run clean
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking
npm run typecheck
```

## Architecture Overview

Gemini Flow is built with:

- **Core**: TypeScript-based orchestration engine
- **Agents**: Specialized AI coordination patterns
- **Memory**: SQLite-based persistent storage
- **MCP**: Model Context Protocol integration
- **SPARC**: Systematic development methodology

### Key Directories

- `src/core/` - Core orchestration engine
- `src/agents/` - Agent definitions and coordination
- `src/commands/` - CLI command implementations
- `src/memory/` - Memory management system
- `src/mcp/` - MCP protocol integration
- `tests/` - Test suites (unit, integration, e2e)

## Release Process

Releases are automated through GitHub workflows:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create pull request to `main`
4. Merge triggers automatic release

## Getting Help

- Check existing issues and discussions
- Join our community discussions
- Reach out to maintainers for guidance
- Review documentation and examples

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to Gemini Flow!