# Deployment Instructions

## Manual GitHub Repository Setup

Since the GitHub CLI is not available, please perform these steps manually:

### Step 1: Create GitHub Repository

1. Go to https://github.com/clduab11
2. Click "New repository" button
3. Configure repository:
   - **Repository name**: `gemini-flow`
   - **Description**: `AI orchestration platform for Gemini CLI - Adapted from Claude-Flow`
   - **Visibility**: Public
   - **Initialize this repository with**: None (don't add README, .gitignore, or license)

### Step 2: Add Repository Topics

After creating the repository:
1. Go to repository settings
2. In the "About" section, add these topics:
   - `ai`
   - `orchestration`
   - `gemini`
   - `cli`
   - `typescript`

### Step 3: Push Local Repository

Once the GitHub repository is created, run these commands in the project directory:

```bash
git remote add origin https://github.com/clduab11/gemini-flow.git
git branch -M main
git push -u origin main
```

## CI/CD Pipeline Setup

The following GitHub Actions workflows have been configured and will automatically run once the repository is pushed:

### Build Pipeline (`.github/workflows/build.yml`)
- **Triggers**: Push to main/develop, Pull requests to main
- **Matrix**: Node.js 18, 20, 22
- **Steps**: Install, typecheck, lint, test, build
- **Artifacts**: Build outputs with 7-day retention

### Security Scanning (`.github/workflows/security.yml`)
- **Triggers**: Push, Pull requests, Weekly schedule (Mondays 6 AM UTC)
- **Scans**: npm audit, CodeQL analysis, TruffleHog secrets scan
- **Security**: Dependency vulnerability checks

### Automated Releases (`.github/workflows/release.yml`)
- **Triggers**: Version changes in package.json on main branch
- **Process**: Automatic tag creation, GitHub releases, NPM publishing
- **Changelog**: Auto-generated from git commits

### Manual Publishing (`.github/workflows/publish.yml`)
- **Triggers**: Manual workflow dispatch, Published releases
- **Features**: Version input, comprehensive testing, NPM publication

## Required Secrets

Configure these secrets in GitHub repository settings:

### NPM_TOKEN
For automated package publishing to npm:
1. Go to npmjs.com and log in
2. Create an access token with "Automation" type
3. Add as repository secret named `NPM_TOKEN`

### GITHUB_TOKEN
This is automatically provided by GitHub Actions - no manual setup needed.

## Branch Protection Rules

Apply the protection rules documented in `.github/BRANCH_PROTECTION.md`:

1. Go to repository Settings → Branches
2. Add protection rule for `main` branch:
   - Require pull request before merging (1 approval)
   - Require status checks: build, security scans
   - Require linear history
   - Include administrators

## Repository Configuration

### Issue Templates
- **Bug Report**: `.github/ISSUE_TEMPLATE/bug_report.yml`
- **Feature Request**: `.github/ISSUE_TEMPLATE/feature_request.yml`

### Pull Request Template
- **Template**: `.github/PULL_REQUEST_TEMPLATE.md`
- **Guidelines**: `.github/CONTRIBUTING.md`

### License
- **Type**: MIT License
- **File**: `LICENSE`
- **Owner**: clduab11

## Post-Deployment Verification

After completing the manual setup:

1. **Verify CI/CD**: Create a test branch and pull request to ensure workflows run
2. **Test Security**: Check that security scans complete successfully
3. **Validate Protection**: Ensure branch protection rules are active
4. **Test Publishing**: Try a manual workflow dispatch to verify publishing setup

## Next Steps

1. Complete manual GitHub repository creation
2. Push local repository to GitHub
3. Configure repository secrets
4. Apply branch protection rules
5. Verify all workflows execute successfully

## Support

If you encounter issues during deployment:
1. Check GitHub Actions logs for workflow failures
2. Verify all required secrets are configured
3. Ensure branch protection rules are properly applied
4. Review NPM publishing permissions