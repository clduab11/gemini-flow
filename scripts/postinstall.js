#!/usr/bin/env node

/**
 * Conditional postinstall script to handle husky installation
 * Only runs in development environments, skips for global installs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if we're in a global install
const isGlobalInstall = process.env.npm_config_global === 'true';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Check if we're in CI
const isCI = process.env.CI || process.env.CONTINUOUS_INTEGRATION;

// Check if husky is available
const huskyPath = path.join(__dirname, '..', 'node_modules', 'husky');
const hasHusky = fs.existsSync(huskyPath);

// Only install husky in development environments
if (!isGlobalInstall && !isProduction && !isCI && hasHusky) {
  try {
    console.log('📦 Setting up git hooks with husky...');
    execSync('husky install', { stdio: 'inherit' });
    console.log('✅ Git hooks installed successfully');
  } catch (error) {
    console.warn('⚠️  Could not install git hooks:', error.message);
    // Don't fail the installation
  }
} else {
  const reasons = [];
  if (isGlobalInstall) reasons.push('global installation');
  if (isProduction) reasons.push('production environment');
  if (isCI) reasons.push('CI environment');
  if (!hasHusky) reasons.push('husky not available');
  
  console.log(`ℹ️  Skipping git hooks setup (${reasons.join(', ')})`);
}