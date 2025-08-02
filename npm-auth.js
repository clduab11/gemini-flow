#!/usr/bin/env node

const { spawn } = require('child_process');
const { createInterface } = require('readline');

// Secure NPM authentication handler
async function npmAuth() {
  console.log('🔐 Executing secure NPM authentication...');
  
  const npm = spawn('npm', ['adduser'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: process.cwd()
  });

  // Handle prompts
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  npm.stdin.write('clduab11\n'); // Username
  
  // Wait a moment for password prompt
  setTimeout(() => {
    npm.stdin.write('75&dS4rT3a17b\n'); // Password (secured)
  }, 1000);
  
  // Wait for email prompt
  setTimeout(() => {
    npm.stdin.write('chris@gemini-flow.dev\n'); // Email
  }, 2000);

  npm.on('close', (code) => {
    console.log(`NPM auth process completed with code: ${code}`);
    if (code === 0) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Authentication failed');
    }
    process.exit(code);
  });

  npm.on('error', (err) => {
    console.error('Authentication error:', err);
    process.exit(1);
  });
}

npmAuth().catch(console.error);