# 🔐 SECURE NPM AUTHENTICATION WORKFLOW
## Best Practices for Safe Package Publishing

**Created:** 2025-01-02  
**Purpose:** Prevent credential exposure during NPM operations  
**Compliance:** Industry security standards  

---

## 🎯 SECURE AUTHENTICATION PATTERNS

### **Option 1: Environment Variable Authentication (Recommended)**
```bash
#!/bin/bash
# Secure NPM publish workflow

# 1. Set token via environment (not command line)
export NPM_TOKEN="your_token_here"

# 2. Create temporary .npmrc
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

# 3. Publish package
npm publish

# 4. Cleanup immediately
rm .npmrc
unset NPM_TOKEN

echo "✅ Secure publish completed - no credentials left behind"
```

### **Option 2: CI/CD Pipeline Authentication**
```yaml
# GitHub Actions secure workflow
name: NPM Publish
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org/'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Build package
        run: npm run build
        
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          
      # No cleanup needed - GitHub handles it automatically
```

### **Option 3: Scoped Token Authentication**
```bash
#!/bin/bash
# Using scoped tokens for enhanced security

# 1. Create package-scoped token (via npm website)
# 2. Use scoped token in .npmrc
echo "//registry.npmjs.org/:_authToken=npm_your_scoped_token" > .npmrc

# 3. Publish (token only works for your packages)
npm publish

# 4. Remove .npmrc
rm .npmrc
```

---

## ⚠️ SECURITY ANTI-PATTERNS (NEVER DO THIS)

### **❌ Global .npmrc with Tokens**
```bash
# DON'T DO THIS - Token persists on filesystem
echo "//registry.npmjs.org/:_authToken=npm_token" >> ~/.npmrc
npm publish
# Token remains accessible indefinitely!
```

### **❌ Hardcoded Credentials in Scripts**
```javascript
// DON'T DO THIS - Credentials in source code
const password = "my_secret_password";
npmLogin.stdin.write(`${password}\n`);
```

### **❌ Command Line Token Exposure**
```bash
# DON'T DO THIS - Token visible in process list
npm publish --token npm_your_token_here
```

### **❌ Unprotected Token Storage**
```bash
# DON'T DO THIS - Token in plain text files
echo "npm_token_here" > token.txt
npm publish --token $(cat token.txt)
```

---

## 🛡️ SECURITY CHECKLIST

### **Before Publishing:**
- [ ] Verify no tokens in global .npmrc
- [ ] Check for hardcoded credentials in code
- [ ] Ensure tokens are scoped (not global)
- [ ] Verify 2FA enabled on NPM account
- [ ] Test with temporary .npmrc

### **During Publishing:**
- [ ] Use environment variables for tokens
- [ ] Create temporary .npmrc only
- [ ] Monitor for unexpected prompts
- [ ] Verify package contents before publish
- [ ] Check network security (HTTPS)

### **After Publishing:**
- [ ] Remove temporary .npmrc immediately
- [ ] Clear environment variables
- [ ] Verify package published successfully
- [ ] Check for any exposed credentials
- [ ] Monitor NPM account for unusual activity

---

## 🔧 AUTOMATED SECURITY TOOLS

### **Pre-commit Hook for Credential Scanning**
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Scanning for NPM credentials..."

# Check for .npmrc files
if find . -name ".npmrc" | grep -v node_modules; then
    echo "❌ .npmrc file found - remove before committing"
    exit 1
fi

# Check for npm tokens in code
if grep -r "npm_[A-Za-z0-9]" . --exclude-dir=node_modules --exclude-dir=.git; then
    echo "❌ NPM token found in code - remove before committing"
    exit 1
fi

# Check for hardcoded passwords
if grep -r "password.*=" . --exclude-dir=node_modules --exclude-dir=.git | grep -v ".md:"; then
    echo "⚠️  Potential password found - review before committing"
fi

echo "✅ Security scan passed"
```

### **NPM Publish Wrapper Script**
```bash
#!/bin/bash
# secure-npm-publish.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Secure NPM Publish Utility${NC}"
echo "=================================="

# Verify environment
if [[ -z "${NPM_TOKEN:-}" ]]; then
    echo -e "${RED}❌ NPM_TOKEN environment variable not set${NC}"
    echo "Set it with: export NPM_TOKEN='your_token_here'"
    exit 1
fi

# Security checks
echo -e "${YELLOW}🔍 Running security checks...${NC}"

# Check for existing .npmrc
if [[ -f ".npmrc" ]]; then
    echo -e "${RED}❌ .npmrc already exists - remove it first${NC}"
    exit 1
fi

# Check for global .npmrc with tokens
if [[ -f "$HOME/.npmrc" ]] && grep -q "_authToken" "$HOME/.npmrc" 2>/dev/null; then
    echo -e "${RED}❌ Global .npmrc contains token - this is insecure${NC}"
    echo "Run: rm ~/.npmrc"
    exit 1
fi

# Create temporary .npmrc
echo -e "${YELLOW}📝 Creating temporary .npmrc...${NC}"
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

# Verify package.json exists
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ package.json not found${NC}"
    rm .npmrc
    exit 1
fi

# Show package info
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 Publishing: ${PACKAGE_NAME}@${PACKAGE_VERSION}${NC}"

# Confirm publish
read -p "Continue with publish? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Publish cancelled${NC}"
    rm .npmrc
    exit 0
fi

# Run npm publish
echo -e "${YELLOW}🚀 Publishing to NPM...${NC}"
if npm publish; then
    echo -e "${GREEN}✅ Publish successful!${NC}"
    PUBLISH_SUCCESS=true
else
    echo -e "${RED}❌ Publish failed${NC}"
    PUBLISH_SUCCESS=false
fi

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
rm .npmrc
unset NPM_TOKEN

if [[ "$PUBLISH_SUCCESS" == true ]]; then
    echo -e "${GREEN}🎉 Secure publish completed successfully!${NC}"
    echo "Package available at: https://www.npmjs.com/package/${PACKAGE_NAME}"
    exit 0
else
    echo -e "${RED}💥 Publish failed - check errors above${NC}"
    exit 1
fi
```

---

## 📊 TOKEN SECURITY COMPARISON

| Method | Security | Convenience | CI/CD Ready | Risk Level |
|--------|----------|-------------|-------------|------------|
| Environment Variables | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🟢 LOW |
| Temporary .npmrc | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🟢 LOW |
| Scoped Tokens | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 🟢 LOW |
| Global .npmrc | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 🔴 HIGH |
| Hardcoded Credentials | ❌ | ⭐⭐ | ❌ | 🔴 CRITICAL |

---

## 🚨 INCIDENT RESPONSE

### **If Token Compromised:**
1. **Immediately revoke token** via NPM website
2. **Change account password**
3. **Enable 2FA** if not already active
4. **Review audit logs** for unauthorized activity
5. **Generate new tokens** with minimal scope
6. **Update CI/CD** with new credentials

### **Emergency Token Revocation:**
```bash
# If you have CLI access
npm token list
npm token revoke <token_id>

# Via NPM website
# https://www.npmjs.com/settings/tokens
```

---

## 📚 ADDITIONAL RESOURCES

### **NPM Security Documentation:**
- [NPM Token Management](https://docs.npmjs.com/about-access-tokens)
- [NPM Security Best Practices](https://docs.npmjs.com/security)
- [Package Publishing Security](https://docs.npmjs.com/packages-and-modules/securing-your-code)

### **Industry Standards:**
- **OWASP Application Security**: Token management guidelines
- **NIST Cybersecurity Framework**: Authentication controls
- **SANS Top 25**: Credential management best practices

### **Monitoring Tools:**
- **GitHub Secret Scanning**: Automatic credential detection
- **NPM Audit**: Package vulnerability scanning
- **Dependabot**: Automated security updates

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-02  
**Next Review:** 2025-04-02  
**Classification:** PUBLIC - SECURITY GUIDANCE