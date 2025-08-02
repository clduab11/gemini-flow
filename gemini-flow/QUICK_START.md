# 🚀 Quick Start Guide

## ⚡ Get Up and Running in 3 Minutes

### Step 1: Get Your API Key (30 seconds)
1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with Google
3. Click "Create API Key" 
4. Copy your key (starts with `AIza`)

### Step 2: Setup Environment (1 minute)
```bash
# Clone and setup
git clone <this-repo>
cd gemini-flow

# Quick setup
npm run setup

# Edit .env with your API key
code .env  # or nano .env
```

### Step 3: Verify Setup (30 seconds)
```bash
# Test your configuration
npm run verify-api-key

# Start developing
npm start
```

## 🔧 What `npm run setup` Does:
- ✅ Copies `.env.example` to `.env`
- ✅ Installs all dependencies
- ✅ Runs API key verification
- ✅ Shows next steps

## 🛠️ Available Commands:
```bash
npm run verify-api-key  # Test API connection
npm start              # Run the application
npm run dev            # Development mode
npm test               # Run tests
npm run lint           # Code quality check
```

## 🚨 Important Notes:
- **You MUST use your own Google Gemini API key**
- **Never commit `.env` files to git**
- **The free tier has generous limits for development**

## 🆘 Having Issues?
1. Check `SETUP.md` for detailed instructions
2. Run `npm run verify-api-key` for diagnostics
3. Ensure your API key starts with `AIza`
4. Check the console for error messages

## 🎯 Next Steps:
- Read `API_SECURITY.md` for security best practices
- Explore the example code in `/examples`
- Check out the documentation in `README.md`

**🎉 Happy coding with Gemini Flow!**