#!/usr/bin/env node

/**
 * 🔑 API Key Verification Script
 * 
 * This script verifies that your API keys are properly configured
 * and can successfully connect to the Gemini API.
 * 
 * Usage: npm run verify-api-key
 */

require('dotenv').config();

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bright}${colors.cyan}🔑 ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.bright}${colors.green}`, `✅ ${message}`);
}

function logError(message) {
  log(`${colors.bright}${colors.red}`, `❌ ${message}`);
}

function logWarning(message) {
  log(`${colors.bright}${colors.yellow}`, `⚠️  ${message}`);
}

function logInfo(message) {
  log(`${colors.blue}`, `ℹ️  ${message}`);
}

async function verifyEnvironment() {
  logHeader('Environment Verification');
  
  // Check .env file exists
  const fs = require('fs');
  if (!fs.existsSync('.env')) {
    logError('.env file not found!');
    logInfo('Copy .env.example to .env and add your API keys');
    logInfo('cp .env.example .env');
    return false;
  }
  logSuccess('.env file found');
  
  // Check required environment variables
  const requiredVars = ['GEMINI_API_KEY'];
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
      
      // Validate API key format
      if (varName.includes('GEMINI') && !process.env[varName].startsWith('AIza')) {
        logWarning(`${varName} should start with 'AIza' for Gemini API keys`);
      }
    } else {
      logError(`${varName} is not set`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function verifyGeminiAPI() {
  logHeader('Gemini API Connection Test');
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    if (!process.env.GEMINI_API_KEY) {
      logError('GEMINI_API_KEY not found in environment');
      return false;
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    logInfo('Testing connection to Gemini API...');
    
    const result = await model.generateContent('Hello! Please respond with just "API connection successful"');
    const response = result.response.text();
    
    if (response.toLowerCase().includes('successful') || response.toLowerCase().includes('hello')) {
      logSuccess('Gemini API connection successful!');
      logInfo(`Response: ${response.trim()}`);
      return true;
    } else {
      logWarning('Unexpected response from Gemini API');
      logInfo(`Response: ${response.trim()}`);
      return true; // Still consider it working
    }
    
  } catch (error) {
    logError('Failed to connect to Gemini API');
    
    if (error.message.includes('API key')) {
      logError('Invalid API key - check your GEMINI_API_KEY');
      logInfo('Get your API key at: https://makersuite.google.com/app/apikey');
    } else if (error.message.includes('quota')) {
      logError('API quota exceeded - check your usage limits');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      logError('Network error - check your internet connection');
    } else {
      logError(`Error details: ${error.message}`);
    }
    
    return false;
  }
}

async function verifyDependencies() {
  logHeader('Dependencies Check');
  
  try {
    require('@google/generative-ai');
    logSuccess('@google/generative-ai package is installed');
  } catch (error) {
    logError('@google/generative-ai package not found');
    logInfo('Run: npm install @google/generative-ai');
    return false;
  }
  
  try {
    require('dotenv');
    logSuccess('dotenv package is installed');
  } catch (error) {
    logError('dotenv package not found');
    logInfo('Run: npm install dotenv');
    return false;
  }
  
  return true;
}

function displaySecurityReminders() {
  logHeader('🛡️  Security Reminders');
  
  console.log(`
${colors.yellow}🔒 CRITICAL SECURITY PRACTICES:${colors.reset}

${colors.green}✅ DO:${colors.reset}
  • Use your own API keys only
  • Keep .env file in .gitignore
  • Rotate API keys regularly (every 90 days)
  • Monitor your API usage and billing
  • Set up Google Cloud billing alerts
  • Use API key restrictions when possible

${colors.red}❌ DON'T:${colors.reset}
  • Hardcode API keys in source code
  • Share API keys via chat/email
  • Commit .env files to version control
  • Use production keys for development
  • Ignore usage monitoring

${colors.cyan}📊 Cost Management:${colors.reset}
  • Gemini Pro has a free tier
  • Monitor token usage
  • Implement caching when possible
  • Use appropriate model sizes

${colors.blue}🔗 Useful Links:${colors.reset}
  • Get API Key: https://makersuite.google.com/app/apikey
  • Documentation: https://ai.google.dev/docs
  • Pricing: https://ai.google.dev/pricing
  • Support: https://discuss.ai.google.dev/
`);
}

async function main() {
  console.log(`${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════════════════╗
║                    🔑 API KEY VERIFICATION                     ║
║                      Gemini Flow Project                      ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const checks = [];
  
  // Run all verification checks
  checks.push(await verifyDependencies());
  checks.push(await verifyEnvironment());
  checks.push(await verifyGeminiAPI());
  
  // Summary
  logHeader('Verification Summary');
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  if (passed === total) {
    logSuccess(`All checks passed! (${passed}/${total})`);
    logSuccess('Your API configuration is ready to use! 🚀');
  } else {
    logError(`Some checks failed (${passed}/${total})`);
    logWarning('Please fix the issues above before proceeding');
  }
  
  displaySecurityReminders();
  
  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  logError('Unhandled error occurred:');
  console.error(error);
  process.exit(1);
});

// Run the verification
main().catch((error) => {
  logError('Verification script failed:');
  console.error(error);
  process.exit(1);
});