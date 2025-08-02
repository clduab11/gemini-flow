# 🔑 API Key Setup - CRITICAL SECURITY REQUIREMENTS

## 🚨 CRITICAL WARNING: YOU MUST USE YOUR OWN API KEYS

**⚠️ NEVER USE SOMEONE ELSE'S API CREDENTIALS**
**⚠️ NEVER COMMIT API KEYS TO VERSION CONTROL**
**⚠️ YOU ARE RESPONSIBLE FOR YOUR OWN API USAGE AND COSTS**

---

## 🔐 Google Gemini API Key Setup (REQUIRED)

### Step 1: Get Your Own Gemini API Key

**🌟 Official Google AI Studio**: https://makersuite.google.com/app/apikey

1. Visit the Google AI Studio
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your new API key (starts with `AIza...`)
5. **NEVER SHARE THIS KEY WITH ANYONE**

### Step 2: Environment Variable Setup

Create a `.env` file in your project root:

```bash
# Copy this template and add YOUR API key
GEMINI_API_KEY=your_actual_api_key_here
GOOGLE_AI_API_KEY=your_actual_api_key_here

# Optional: Rate limiting
GEMINI_RATE_LIMIT=60
GEMINI_TIMEOUT=30000
```

**⚠️ Important**: The `.env` file is already in `.gitignore` - DO NOT remove it from there!

### Step 3: Verify Your Setup

Run the verification script:

```bash
npm run verify-api-key
```

Or manually test:

```bash
node -e "
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
"
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- Use your own API keys only
- Store keys in environment variables
- Use `.env` files (never committed)
- Rotate keys regularly
- Monitor your usage and billing
- Set up usage alerts in Google Cloud Console

### ❌ DON'T:
- Hardcode keys in source code
- Share keys in chat/email
- Commit `.env` files to git
- Use production keys for development
- Ignore usage monitoring

### 🔒 Additional Security Measures

1. **API Key Restrictions** (Recommended):
   - Go to Google Cloud Console
   - Navigate to APIs & Services > Credentials
   - Click on your API key
   - Add application restrictions (IP/domain)
   - Limit to Generative AI API only

2. **Usage Monitoring**:
   - Set up billing alerts
   - Monitor daily/monthly usage
   - Review API logs regularly

3. **Key Rotation**:
   - Rotate keys every 90 days
   - Use multiple keys for different environments
   - Have a backup key ready

---

## 🚀 Quick Setup Script

Run this to set up your environment quickly:

```bash
# Copy environment template
cp .env.example .env

# Edit with your API key
nano .env  # or code .env or vim .env

# Install dependencies
npm install

# Verify setup
npm run verify-api-key

# Run tests
npm test
```

---

## 🔧 Alternative API Providers

If you prefer other providers, you can also configure:

### OpenAI (Optional)
```bash
OPENAI_API_KEY=your_openai_key_here
```

### Anthropic Claude (Optional)
```bash
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### Ollama (Local, Free)
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest
```

---

## 📊 Cost Management

### Gemini API Pricing (as of 2024)
- **Gemini Pro**: Free tier available
- **Rate limits**: 60 requests per minute (free)
- **Token limits**: Varies by model

### Cost Optimization Tips:
1. Use caching when possible
2. Optimize prompt length
3. Use appropriate model sizes
4. Implement request batching
5. Monitor token usage

---

## 🆘 Troubleshooting

### Common Issues:

**"API key not found"**
```bash
# Check if .env file exists
ls -la .env

# Check if key is loaded
echo $GEMINI_API_KEY
```

**"Invalid API key"**
- Verify key format (starts with `AIza`)
- Check for extra spaces/characters
- Regenerate key if needed

**"Rate limit exceeded"**
- Reduce request frequency
- Implement exponential backoff
- Upgrade to paid tier

**"Permission denied"**
- Enable Generative AI API in Google Cloud Console
- Check API key restrictions
- Verify billing account

---

## 📞 Support

### Google AI Support:
- Documentation: https://ai.google.dev/docs
- Community: https://discuss.ai.google.dev/
- Issues: Google Cloud Support

### Project Support:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See README.md
- Examples: Check `/examples` directory

---

## ⚖️ Legal & Compliance

### Terms of Service:
- Review Google AI Terms of Service
- Understand usage limitations
- Comply with data privacy regulations
- Follow content policy guidelines

### Data Privacy:
- Your API calls are logged by Google
- Don't send sensitive/personal data
- Review data retention policies
- Implement data minimization

---

**🔥 Remember: You are 100% responsible for your API key security and usage costs!**

**⭐ Star this repo if this documentation helped you!**