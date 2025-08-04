#!/usr/bin/env node

/**
 * Build script for Gemini Flow VSCode Extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Gemini Flow VSCode Extension...');

// Check if TypeScript is installed
try {
  execSync('tsc --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ TypeScript not found. Please install it globally: npm install -g typescript');
  process.exit(1);
}

// Clean previous build
const outDir = path.join(__dirname, 'out');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log('🧹 Cleaned previous build');
}

// Compile TypeScript
try {
  console.log('🔨 Compiling TypeScript...');
  execSync('tsc -p ./', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ TypeScript compilation completed');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}

// Validate package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📋 Validating package.json...');

// Check required fields
const requiredFields = ['name', 'displayName', 'version', 'publisher', 'engines', 'main'];
for (const field of requiredFields) {
  if (!packageJson[field]) {
    console.error(`❌ Missing required field in package.json: ${field}`);
    process.exit(1);
  }
}

// Check if main file exists
const mainFile = path.join(__dirname, packageJson.main);
if (!fs.existsSync(mainFile)) {
  console.error(`❌ Main file not found: ${packageJson.main}`);
  process.exit(1);
}

console.log('✅ Package.json validation passed');

// Create VSIX package if vsce is available
try {
  execSync('vsce --version', { stdio: 'ignore' });
  
  console.log('📦 Creating VSIX package...');
  execSync('vsce package', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ VSIX package created successfully');
} catch (error) {
  console.log('ℹ️  VSCE not found. Skipping VSIX creation.');
  console.log('   To create a VSIX package, install vsce: npm install -g @vscode/vsce');
}

console.log('🎉 Build completed successfully!');
console.log('');
console.log('Next steps:');
console.log('1. Test the extension by pressing F5 in VSCode');
console.log('2. Install vsce to create publishable packages: npm install -g @vscode/vsce');
console.log('3. Create VSIX package: vsce package');
console.log('4. Publish to marketplace: vsce publish');