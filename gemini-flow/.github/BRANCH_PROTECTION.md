# Branch Protection Rules

This document outlines the recommended branch protection rules for the Gemini Flow repository. These rules should be configured manually in the GitHub repository settings.

## Main Branch Protection

### Branch: `main`

**Recommended Settings:**

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale PR approvals when new commits are pushed
  - [x] Require review from code owners (when CODEOWNERS file exists)

- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `build (18)` - Node.js 18 build
    - `build (20)` - Node.js 20 build  
    - `build (22)` - Node.js 22 build
    - `dependency-check` - Security dependency check
    - `codeql-analysis` - CodeQL security analysis

- [x] Require conversation resolution before merging

- [x] Require linear history

- [x] Include administrators (recommended for consistency)

- [x] Allow force pushes: **Disabled**

- [x] Allow deletions: **Disabled**

## Develop Branch Protection (if used)

### Branch: `develop`

**Recommended Settings:**

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [ ] Dismiss stale PR approvals (less strict for development)

- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `build (20)` - Node.js 20 build (minimum)
    - `dependency-check` - Security dependency check

- [x] Allow force pushes: **Disabled**

- [x] Allow deletions: **Disabled**

## Implementation Instructions

To configure these branch protection rules:

1. Go to your repository on GitHub
2. Navigate to Settings → Branches
3. Click "Add rule" for each branch
4. Configure the settings as outlined above
5. Save the protection rule

## CODEOWNERS Configuration

Create a `.github/CODEOWNERS` file to automatically request reviews:

```
# Global owners
* @clduab11

# Core orchestration engine
/gemini-flow/src/core/ @clduab11
/gemini-flow/src/agents/ @clduab11

# CI/CD and workflows
/.github/ @clduab11

# Security-sensitive files
/gemini-flow/src/memory/ @clduab11
/LICENSE @clduab11
```

## Deployment Protection

For production deployments, consider:

- Environment protection rules
- Required reviewers for production deployments
- Deployment branches limited to `main`
- Wait timer before deployment (optional)

## Benefits

These protection rules provide:

- ✅ Code quality assurance through required reviews
- ✅ Automated testing validation before merges
- ✅ Security scanning on all changes
- ✅ Linear git history for easier debugging
- ✅ Prevention of accidental direct pushes to main
- ✅ Consistent code review process

## Notes

- Branch protection rules require admin privileges to configure
- Status checks must exist before they can be required
- Consider adjusting rules based on team size and workflow needs
- Review and update rules periodically as the project evolves