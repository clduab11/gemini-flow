#!/usr/bin/env node

/**
 * Gemini-Flow Setup Verification Script
 * Ensures users have properly configured their API keys
 */

console.log('\n🔍 Verifying Gemini-Flow Setup...\n');

// Check for .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Step 1: Check .env file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env file not found!');
  console.log('\n📋 To fix this:');
  console.log('1. Copy .env.example to .env:');
  console.log('   cp .env.example .env');
  console.log('2. Add your API key to .env file');
  console.log('\n');
  process.exit(1);
}

// Step 2: Load environment variables
require('dotenv').config();

// Step 3: Check for API key
const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.length < 10) {
  console.error('❌ ERROR: Valid Gemini API key not found!');
  console.log('\n📋 To fix this:');
  console.log('1. Get your API key from: https://makersuite.google.com/app/apikey');
  console.log('2. Add it to your .env file:');
  console.log('   GOOGLE_AI_API_KEY=your-actual-api-key-here');
  console.log('\n⚠️  REMEMBER: You MUST use your own API key!');
  console.log('\n');
  process.exit(1);
}

// Step 4: Test API key format (basic validation)
if (!apiKey.startsWith('AIza')) {
  console.warn('⚠️  WARNING: API key format looks unusual.');
  console.log('   Gemini API keys typically start with "AIza"');
  console.log('   Please verify you copied the correct key.');
}

// Step 5: Success!
console.log('✅ Environment file found');
console.log('✅ API key is configured');
console.log(`✅ API key format looks valid (${apiKey.substring(0, 8)}...)`);
console.log('\n🎉 Setup verification complete!');
console.log('\n📌 Next steps:');
console.log('1. Run: npm start');
console.log('2. Try the examples in the examples/ directory');
console.log('\n💡 Remember: You are responsible for your API usage and costs.');
console.log('   Monitor your usage at: https://console.cloud.google.com\n');

process.exit(0);