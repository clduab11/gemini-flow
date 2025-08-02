# 🛡️ API Security Guide

## 🚨 CRITICAL: API Key Security Best Practices

This document outlines essential security practices for managing API keys in the Gemini Flow project.

---

## 🔐 API Key Management

### 1. Never Hardcode API Keys

**❌ WRONG:**
```javascript
const apiKey = "AIzaSyC8UgQSomeRealAPIKey123"; // NEVER DO THIS!
const genAI = new GoogleGenerativeAI(apiKey);
```

**✅ CORRECT:**
```javascript
const apiKey = process.env.GEMINI_API_KEY; // Use environment variables
const genAI = new GoogleGenerativeAI(apiKey);
```

### 2. Use Environment Variables

Create a `.env` file (never commit this):
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

Load it in your application:
```javascript
require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;
```

### 3. Gitignore Protection

Ensure `.env` is in your `.gitignore`:
```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development

# API keys
*.key
*.pem
config/secrets.json
```

---

## 🔒 Google Cloud Security Settings

### API Key Restrictions

1. **Go to Google Cloud Console**
   - Navigate to "APIs & Services" > "Credentials"
   - Click on your API key

2. **Set Application Restrictions**
   - **HTTP referrers**: For web applications
   - **IP addresses**: For server applications
   - **Android apps**: For mobile applications
   - **iOS apps**: For iOS applications

3. **Set API Restrictions**
   - Restrict to "Generative Language API" only
   - Don't allow access to other Google services

### Example Restrictions:
```
Application restrictions:
├── HTTP referrers: https://yourdomain.com/*
├── IP addresses: 203.0.113.0/24
└── None (for development only)

API restrictions:
└── Generative Language API only
```

---

## 🚨 Common Security Mistakes

### ❌ What NOT to Do:

1. **Committing keys to version control**
   ```bash
   git add .env  # NEVER!
   git commit -m "Added API keys"  # DISASTER!
   ```

2. **Sharing keys in plain text**
   - Slack messages
   - Email
   - Discord/Teams chat
   - Stack Overflow posts

3. **Using production keys for development**
   ```javascript
   const apiKey = "prod_key_12345"; // Use separate dev keys!
   ```

4. **Logging API keys**
   ```javascript
   console.log(`API Key: ${apiKey}`); // Keys will appear in logs!
   ```

5. **Client-side exposure**
   ```html
   <script>
     const apiKey = "AIzaSyC..."; // Visible to everyone!
   </script>
   ```

### ✅ What TO Do:

1. **Use separate keys for each environment**
   ```bash
   # Development
   GEMINI_API_KEY=dev_key_here
   
   # Production  
   GEMINI_API_KEY=prod_key_here
   ```

2. **Implement key rotation**
   ```javascript
   // Rotate keys every 90 days
   const keyRotationDate = new Date('2024-04-01');
   if (Date.now() > keyRotationDate) {
     console.warn('API key rotation needed!');
   }
   ```

3. **Monitor usage**
   ```javascript
   // Track API calls
   let apiCallCount = 0;
   const MAX_CALLS_PER_HOUR = 1000;
   
   function makeAPICall() {
     if (apiCallCount >= MAX_CALLS_PER_HOUR) {
       throw new Error('Rate limit exceeded');
     }
     apiCallCount++;
     // ... make API call
   }
   ```

---

## 🔍 Security Auditing

### Regular Security Checks

1. **Scan for exposed keys**
   ```bash
   # Use tools like gitleaks
   gitleaks detect --source . --verbose
   
   # Or truffleHog
   truffleHog git file://. --json
   ```

2. **Check git history**
   ```bash
   # Search for potential keys in git history
   git log -p | grep -i "api.*key\|secret\|token"
   ```

3. **Review access logs**
   - Monitor Google Cloud Console logs
   - Check for unusual API usage patterns
   - Set up alerts for unexpected activity

### Automated Security Tools

Add these to your CI/CD pipeline:

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🔔 Incident Response

### If Your API Key is Compromised:

1. **Immediate Actions:**
   ```bash
   # 1. Revoke the compromised key immediately
   # Go to Google Cloud Console > Credentials > Delete key
   
   # 2. Generate a new key
   # Create new API key with restrictions
   
   # 3. Update environment variables
   export GEMINI_API_KEY="new_secure_key_here"
   ```

2. **Investigate:**
   - Check API usage logs for unauthorized activity
   - Review recent commits for exposed keys
   - Audit team access to repositories

3. **Prevent Future Incidents:**
   - Add pre-commit hooks to scan for secrets
   - Implement automated key rotation
   - Train team on security best practices

### Pre-commit Hook Example:
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Check for potential API keys
if grep -r "AIza" . --exclude-dir=.git; then
    echo "❌ Potential API key found! Commit blocked."
    exit 1
fi

echo "✅ No API keys detected."
exit 0
```

---

## 📊 Monitoring & Alerts

### Set Up Usage Monitoring:

```javascript
// monitoring.js
const { GoogleAuth } = require('google-auth-library');

async function monitorAPIUsage() {
  // Check daily usage
  const usage = await getAPIUsage();
  
  if (usage.requestsToday > 10000) {
    console.warn('🚨 High API usage detected!');
    // Send alert to team
  }
  
  if (usage.errorRate > 0.05) {
    console.warn('🚨 High error rate detected!');
    // Check for potential abuse
  }
}

// Run monitoring every hour
setInterval(monitorAPIUsage, 3600000);
```

### Google Cloud Monitoring:

1. **Set up billing alerts**
2. **Configure usage quotas**
3. **Enable audit logging**
4. **Set up anomaly detection**

---

## 📚 Additional Resources

### Security Tools:
- **gitleaks**: https://github.com/gitleaks/gitleaks
- **truffleHog**: https://github.com/trufflesecurity/truffleHog
- **git-secrets**: https://github.com/awslabs/git-secrets

### Google Cloud Security:
- **Security Best Practices**: https://cloud.google.com/docs/security
- **API Key Best Practices**: https://cloud.google.com/docs/authentication/api-keys
- **Identity and Access Management**: https://cloud.google.com/iam/docs

### General Security:
- **OWASP API Security**: https://owasp.org/www-project-api-security/
- **Security Headers**: https://securityheaders.com/
- **SSL/TLS Configuration**: https://ssl-config.mozilla.org/

---

## ✅ Security Checklist

Before deploying your application:

- [ ] All API keys are in environment variables
- [ ] `.env` files are in `.gitignore`
- [ ] API keys have appropriate restrictions
- [ ] Separate keys for dev/staging/production
- [ ] Monitoring and alerts are configured
- [ ] Team trained on security practices
- [ ] Pre-commit hooks are installed
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] Key rotation schedule established

---

**Remember: Security is everyone's responsibility! 🛡️**

Report security issues to: [Your security contact]