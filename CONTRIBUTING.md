# 🤝 Contributing to Gemini-Flow

Thank you for your interest in contributing to Gemini-Flow! This document provides guidelines and best practices for contributing to our revolutionary multi-model AI orchestration platform.

## 📝 Commit Message Guidelines

Clear and descriptive commit messages are crucial for maintaining a readable project history. Please follow these conventions:

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (updating dependencies, version bumps, etc.)
- **perf**: Performance improvements

### Examples

#### ❌ Poor Commit Message
```
1.0.5
```

#### ✅ Good Commit Message
```
chore: bump version to 1.0.5

- Updated package.json version from 1.0.4 to 1.0.5
- Synchronized package-lock.json
- Release includes:
  * New copilot-instructions.md with MCP integrations
  * Bug fixes and project cleanup
  * README.md corrections

🤖 Generated with [Gemini Flow](https://github.com/clduab11/gemini-flow)

Co-Authored-By: Gemini Flow Contributors <noreply@clduab11.com>
```

### Best Practices

1. **Be Descriptive**: Explain what changed and why
2. **Reference Issues**: Include issue numbers when applicable (e.g., `fixes #123`)
3. **List Changes**: For version bumps, list what's included in the release
4. **Use Present Tense**: "Add feature" not "Added feature"
5. **Keep Lines Short**: 
   - Subject line: 50 characters max
   - Body lines: 72 characters max

## 🚀 Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Write/update tests** as needed
5. **Ensure all tests pass**: `npm test`
6. **Commit with descriptive message** (see guidelines above)
7. **Push to your fork**: `git push origin feature/amazing-feature`
8. **Create a Pull Request**

## 🧪 Testing

Before submitting a PR:

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Build the project
npm run build
```

## 🤖 AI-Assisted Development

When using AI tools (like Gemini AI or GitHub Copilot) for contributions:

1. **Review Generated Code**: Always review AI-generated code for correctness
2. **Test Thoroughly**: AI code needs the same testing standards
3. **Credit AI Assistance**: Add co-authorship in commits when appropriate:
   ```
   Co-Authored-By: Gemini Flow Contributors <noreply@clduab11.com>
   ```

## 📚 Documentation

- Update documentation for any new features
- Include JSDoc comments for new functions
- Update README.md if adding major features
- Add examples for complex functionality

## 🤖 AI-Powered PR & Issue Management

### Automated Pull Request Handling

Both **Gemini AI** and **GitHub Copilot** can automatically handle pull requests and bug reports:

#### Gemini AI Integration
- **PR Reviews**: Gemini AI can perform comprehensive code reviews with context-aware analysis
- **Bug Triage**: Automatically categorize and prioritize bug reports
- **Fix Suggestions**: Generate patches and fixes for reported issues
- **Documentation Updates**: Automatically update docs when code changes
- **Test Generation**: Create test cases for new features and bug fixes

#### GitHub Copilot Integration  
- **Code Suggestions**: Real-time code completion during development
- **PR Description**: Auto-generate detailed PR descriptions
- **Issue Templates**: Fill issue templates with relevant information
- **Conflict Resolution**: Suggest merge conflict resolutions

### Enabling AI Automation

To enable AI-assisted PR and issue handling:

1. **For Gemini AI**:
   - Add `@clduab11` as a collaborator to your fork
   - Use `gemini:` prefix in commit messages for AI review
   - Tag issues with `gemini-review` for automated analysis

2. **For Copilot**:
   - Enable GitHub Copilot in repository settings
   - Use Copilot commands in PR comments
   - Configure automated workflows in `.github/copilot.yml`

## 🐛 Reporting Issues

When reporting issues:

1. **Search existing issues** first
2. **Use issue templates** when available
3. **Provide reproduction steps**
4. **Include environment details**:
   - Node.js version
   - Operating system
   - Gemini-Flow version
5. **AI-Assisted Reporting**: Tag with `ai-assist` for automated triage

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing requests** first
2. **Describe the use case** clearly
3. **Explain the benefit** to the project
4. **Consider implementation** complexity

## 🏛️ Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Celebrate diverse perspectives

## 📜 License

By contributing to Gemini-Flow, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Gemini-Flow better! Every contribution, no matter how small, helps advance the quantum revolution in AI orchestration. 🚀