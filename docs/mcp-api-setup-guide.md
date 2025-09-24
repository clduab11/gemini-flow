# MCP API Keys Setup Guide

## Overview

This guide provides comprehensive instructions for setting up all required API keys for MCP (Model Context Protocol) server authentication. The MCP servers in this project require various API keys for external services including GitHub, Supabase, and multiple search providers.

## Security Warning

⚠️ **CRITICAL**: Never commit API keys to version control. Always use environment variables and secure credential management practices.

## Required API Keys

### 1. GitHub Personal Access Token

**Service**: GitHub MCP Server
**Purpose**: Repository management, issue tracking, PR operations

#### Obtaining the Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select appropriate scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
   - `read:org` (Read organization membership)
   - `read:user` (Read user profile data)
4. Set expiration (90 days recommended)
5. Copy the generated token immediately

#### Environment Variable
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
```

---

### 2. Supabase Access Token

**Service**: Supabase MCP Server
**Purpose**: Database operations, edge functions, project management

#### Obtaining the Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Settings → API
3. Copy your project's service role key
4. **Note**: Never use the `anon` key for server-side operations

#### Environment Variable
```bash
export SUPABASE_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. Search Provider API Keys

The mcp-omnisearch server requires multiple search provider API keys for comprehensive web research capabilities.

#### 3.1 Tavily API Key

**Service**: Tavily Search
**Purpose**: Web search with focus on recent, high-quality sources

##### Obtaining the Token

1. Visit [Tavily API](https://tavily.com/)
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new API key

##### Environment Variable
```bash
export TAVILY_API_KEY="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 3.2 Perplexity AI API Key

**Service**: Perplexity AI
**Purpose**: AI-powered search with citations and reasoning

##### Obtaining the Token

1. Go to [Perplexity AI Platform](https://www.perplexity.ai/settings/api)
2. Sign in with your Perplexity account
3. Navigate to API section
4. Generate new API key

##### Environment Variable
```bash
export PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 3.3 Kagi Search API Key

**Service**: Kagi Search
**Purpose**: Privacy-focused search with minimal advertising influence

##### Obtaining the Token

1. Visit [Kagi Search](https://kagi.com/)
2. Create an account and subscribe to a plan
3. Go to Settings → API Keys
4. Generate a new API key

##### Environment Variable
```bash
export KAGI_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 3.4 Jina AI API Key

**Service**: Jina AI
**Purpose**: Content extraction and web scraping

##### Obtaining the Token

1. Go to [Jina AI Platform](https://jina.ai/)
2. Create an account
3. Navigate to API Keys section
4. Generate a new API key

##### Environment Variable
```bash
export JINA_AI_API_KEY="jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 3.5 Brave Search API Key

**Service**: Brave Search
**Purpose**: Privacy-focused search engine

##### Obtaining the Token

1. Visit [Brave Search API](https://api.search.brave.com/)
2. Sign up for an account
3. Subscribe to an API plan
4. Generate API credentials

##### Environment Variable
```bash
export BRAVE_API_KEY="BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 3.6 Firecrawl API Key

**Service**: Firecrawl
**Purpose**: Web scraping and content extraction

##### Obtaining the Token

1. Go to [Firecrawl](https://firecrawl.dev/)
2. Create an account
3. Navigate to API Keys section
4. Generate a new API key

##### Environment Variable
```bash
export FIRECRAWL_API_KEY="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## Environment Setup

### Option 1: Local Environment File (.env)

Create a `.env` file in your project root:

```bash
# MCP API Keys Configuration
GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
SUPABASE_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Search Provider API Keys
TAVILY_API_KEY="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
KAGI_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
JINA_AI_API_KEY="jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
BRAVE_API_KEY="BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
FIRECRAWL_API_KEY="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Option 2: System Environment Variables

Set environment variables in your shell profile:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
export SUPABASE_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export TAVILY_API_KEY="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export PERPLEXITY_API_KEY="pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export KAGI_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export JINA_AI_API_KEY="jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export BRAVE_API_KEY="BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export FIRECRAWL_API_KEY="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Option 3: Docker Environment

For containerized deployments, use Docker environment variables:

```bash
docker run -e GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..." \
           -e SUPABASE_ACCESS_TOKEN="eyJhbGci..." \
           -e TAVILY_API_KEY="tvly-..." \
           -e PERPLEXITY_API_KEY="pplx-..." \
           -e KAGI_API_KEY="..." \
           -e JINA_AI_API_KEY="jina_..." \
           -e BRAVE_API_KEY="BSA..." \
           -e FIRECRAWL_API_KEY="fc-..." \
           your-app
```

---

## Configuration Files

### MCP Configuration

The `.mcp-config.json` file automatically references environment variables:

```json
{
  "mcpServers": {
    "GitHub": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "Supabase": {
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${env:SUPABASE_ACCESS_TOKEN}"
      }
    },
    "mcp-omnisearch": {
      "env": {
        "TAVILY_API_KEY": "${env:TAVILY_API_KEY}",
        "PERPLEXITY_API_KEY": "${env:PERPLEXITY_API_KEY}",
        "KAGI_API_KEY": "${env:KAGI_API_KEY}",
        "JINA_AI_API_KEY": "${env:JINA_AI_API_KEY}",
        "BRAVE_API_KEY": "${env:BRAVE_API_KEY}",
        "FIRECRAWL_API_KEY": "${env:FIRECRAWL_API_KEY}"
      }
    }
  }
}
```

### VS Code Settings

For VS Code integration, update your MCP settings:

```json
{
  "mcp.servers": {
    "GitHub": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{{GITHUB_PERSONAL_ACCESS_TOKEN}}"
      }
    }
  }
}
```

---

## Security Best Practices

### 1. API Key Management

- ✅ **Rotate keys regularly** (every 90 days for GitHub tokens)
- ✅ **Use separate keys** for different environments (dev/staging/prod)
- ✅ **Monitor key usage** through service dashboards
- ✅ **Revoke compromised keys** immediately
- ❌ **Never share keys** via email or chat
- ❌ **Never commit keys** to version control

### 2. Environment Variable Security

```bash
# Good: Export in shell session
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."

# Better: Use a secure credential manager
# macOS: Security → Keychain Access
# Linux: Use keyring or credential helper
# Windows: Use Windows Credential Manager

# Best: Use a secrets management service
# HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
```

### 3. Access Control

- **Principle of Least Privilege**: Grant only necessary permissions
- **Network Security**: Use VPN for API access when possible
- **IP Restrictions**: Configure API services to allow only known IP ranges
- **Rate Limiting**: Monitor and respect API rate limits

---

## Validation and Testing

### Using the MCP Integration Test

Run the built-in test suite to validate your configuration:

```bash
# Run comprehensive MCP server tests
npx tsx src/core/mcp-integration-test.ts

# Expected output shows server status:
# ✅ GitHub: Server configuration validated successfully
# ✅ Supabase: Server configuration validated successfully
# ✅ mcp-omnisearch: All search providers configured
```

### Manual Testing

Test individual servers:

```bash
# Test filesystem server
node -e "
const fs = require('fs');
console.log('Filesystem access:', fs.existsSync('.'));
"

# Test environment variables
node -e "
console.log('GitHub Token:', process.env.GITHUB_PERSONAL_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
console.log('Supabase Token:', process.env.SUPABASE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
"
```

---

## Troubleshooting

### Common Issues

#### 1. "Token not configured" Error

**Symptom**: MCP server reports missing or invalid token

**Solutions**:
- Verify environment variable is set: `echo $GITHUB_PERSONAL_ACCESS_TOKEN`
- Check token format and expiration
- Ensure token has required permissions
- Restart your development environment

#### 2. "API rate limit exceeded" Error

**Symptom**: Services reject requests due to rate limiting

**Solutions**:
- Check your usage in service dashboard
- Upgrade your API plan if necessary
- Implement request caching
- Add retry logic with exponential backoff

#### 3. "Invalid API key" Error

**Symptom**: Authentication fails with 401/403 errors

**Solutions**:
- Verify key is correct and not expired
- Check if key was accidentally truncated
- Ensure key has proper permissions
- Try regenerating the key

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
export DEBUG="mcp:*"
export LOG_LEVEL="debug"

# Run with debug output
npm run dev 2>&1 | tee debug.log
```

### Service Status Checks

```bash
# Check if Redis is running
redis-cli ping

# Check environment variables
env | grep -E "(GITHUB|SUPABASE|TAVILY|PERPLEXITY|KAGI|JINA|BRAVE|FIRECRAWL)_API_KEY"

# Validate JSON configuration
cat .mcp-config.json | jq .
```

---

## Service-Specific Setup

### GitHub Setup

1. **Token Scope**: Ensure your token has `repo` scope for private repositories
2. **Organization Access**: Use `read:org` scope for organization features
3. **Webhooks**: Configure webhooks for real-time updates
4. **Branch Protection**: Set up branch protection rules

### Supabase Setup

1. **Project Settings**: Configure your project in Supabase dashboard
2. **Database**: Set up tables and RLS policies
3. **Edge Functions**: Deploy any required edge functions
4. **Environment**: Use appropriate project reference (dev/staging/prod)

### Search Providers Setup

1. **API Plans**: Choose appropriate subscription tiers
2. **Rate Limits**: Monitor your usage quotas
3. **Content Filtering**: Configure content filters if needed
4. **Caching**: Implement response caching for better performance

---

## Production Deployment

### Secure Credential Storage

```bash
# Use a secrets management service
# Example with AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id mcp-api-keys

# Example with HashiCorp Vault
vault kv get secret/mcp-keys

# Example with Docker secrets
docker secret create github_token ./github_token.txt
```

### Environment-Specific Configuration

```yaml
# docker-compose.yml
services:
  mcp-service:
    environment:
      - GITHUB_PERSONAL_ACCESS_TOKEN_FILE=/run/secrets/github_token
      - SUPABASE_ACCESS_TOKEN_FILE=/run/secrets/supabase_token
    secrets:
      - github_token
      - supabase_token
```

### Monitoring and Alerts

1. **API Usage Monitoring**: Set up alerts for quota usage
2. **Error Tracking**: Monitor authentication failures
3. **Performance Monitoring**: Track API response times
4. **Security Monitoring**: Alert on suspicious API activity

---

## Support and Resources

### Official Documentation

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Tavily API Documentation](https://docs.tavily.com/)
- [Perplexity AI API](https://docs.perplexity.ai/)
- [Kagi API Documentation](https://help.kagi.com/kagi/api/intro.html)
- [Jina AI API](https://jina.ai/api)
- [Brave Search API](https://api.search.brave.com/app/documentation)
- [Firecrawl Documentation](https://docs.firecrawl.dev/)

### Community Support

- [MCP Community Forum](https://community.modelcontextprotocol.org/)
- [GitHub Discussions](https://github.com/modelcontextprotocol/mcp/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mcp)

### Reporting Issues

If you encounter issues with MCP server authentication:

1. Check the troubleshooting section above
2. Run the integration test suite
3. Verify your environment variables
4. Check service status pages
5. Create an issue with detailed logs

---

## Quick Setup Script

Use this script to quickly validate your environment setup:

```bash
#!/bin/bash
# MCP API Keys Validation Script

echo "🔍 Checking MCP API Keys Configuration..."
echo "========================================"

required_keys=(
  "GITHUB_PERSONAL_ACCESS_TOKEN"
  "SUPABASE_ACCESS_TOKEN"
  "TAVILY_API_KEY"
  "PERPLEXITY_API_KEY"
  "KAGI_API_KEY"
  "JINA_AI_API_KEY"
  "BRAVE_API_KEY"
  "FIRECRAWL_API_KEY"
)

all_good=true

for key in "${required_keys[@]}"; do
  if [ -n "${!key}" ] && [ "${!key}" != "YOUR_${key}_HERE" ]; then
    echo "✅ $key: Configured"
  else
    echo "❌ $key: Missing or using placeholder"
    all_good=false
  fi
done

echo ""
if [ "$all_good" = true ]; then
  echo "🎉 All API keys are properly configured!"
  echo "🚀 Ready to run MCP servers"
else
  echo "⚠️  Some API keys need configuration"
  echo "📖 See setup guide for instructions"
fi

echo "========================================"
```

Save this script as `validate-mcp-keys.sh`, make it executable with `chmod +x validate-mcp-keys.sh`, and run it with `./validate-mcp-keys.sh`.

---

## Summary

This guide provides everything needed to securely configure API keys for MCP servers. Remember the key principles:

1. **Security First**: Never commit keys to version control
2. **Environment Variables**: Use env vars for all credentials
3. **Least Privilege**: Grant minimum required permissions
4. **Regular Rotation**: Rotate keys regularly
5. **Monitoring**: Monitor usage and security

With proper configuration, your MCP servers will operate securely and efficiently across all integrated services.