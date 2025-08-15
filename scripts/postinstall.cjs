#!/usr/bin/env node

/**
 * Conditional postinstall script for husky
 * Only runs husky install if we're in a development environment
 * This prevents npm error 127 during global installs or production deployments
 */

const fs = require('fs');
const path = require('path');

function isProductionInstall() {
  // Check if NODE_ENV is production
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  // Check if this is a global install
  if (process.env.npm_config_global === 'true') {
    return true;
  }

  // Check if we're in CI environment (common CI flags)
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
    return true;
  }

  // Check if node_modules/husky exists (devDependencies installed)
  const huskyPath = path.join(__dirname, '..', 'node_modules', 'husky');
  if (!fs.existsSync(huskyPath)) {
    return true;
  }

  return false;
}

function setupHusky() {
  try {
    // Only proceed if we're not in production/global install
    if (isProductionInstall()) {
      console.log('Skipping husky installation (production/global/CI environment detected)');
      return;
    }

    // Try to require and install husky
    const husky = require('husky');
    
    if (typeof husky.install === 'function') {
      husky.install();
      console.log('Husky git hooks installed successfully');
    } else {
      console.log('Husky install method not found, skipping');
    }
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Husky not found in dependencies, skipping git hooks setup');
    } else {
      console.warn('Warning: Could not set up husky git hooks:', error.message);
    }
  }
}

// Run the setup
setupHusky();