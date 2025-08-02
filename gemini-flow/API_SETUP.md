# 🔐 API Key Setup Guide - MUST READ!

## ⚠️ CRITICAL: You MUST Use Your Own API Keys

This project requires **YOUR OWN** Google Gemini API key. Never use someone else's API credentials!

## 🚀 Quick Setup (3 minutes)

### Step 1: Get Your Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Configure Your Environment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   GOOGLE_AI_API_KEY=your-actual-api-key-here
   ```

3. Verify your setup:
   ```bash
   npm run verify-setup
   ```

## 🛡️ Security Best Practices

### DO:
- ✅ Keep your API key secret
- ✅ Use environment variables
- ✅ Add `.env` to `.gitignore`
- ✅ Restrict API key usage in Google Console
- ✅ Monitor your usage and costs

### DON'T:
- ❌ Share your API key with anyone
- ❌ Commit API keys to version control
- ❌ Use API keys in client-side code
- ❌ Post API keys in issues or forums

## 💰 Cost Management

**YOU are responsible for all API usage costs!**

- Free tier: $0 (limited usage)
- Monitor usage: https://console.cloud.google.com
- Set up billing alerts to avoid surprises

## 🆘 Troubleshooting

### "API key not found" error:
```bash
# Check if .env file exists
ls -la .env

# Verify environment variable is set
echo $GOOGLE_AI_API_KEY
```

### "Invalid API key" error:
1. Verify key is copied correctly (no spaces)
2. Check key is enabled in Google Console
3. Ensure key has Gemini API access

## 📚 Additional Resources

- [Google AI Studio](https://makersuite.google.com)
- [Gemini API Documentation](https://ai.google.dev)
- [Pricing Information](https://ai.google.dev/pricing)

---

**Remember: YOUR API key = YOUR responsibility!**