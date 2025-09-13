/**
 * Custom Jest Resolver
 * Handles .js imports that should resolve to .ts files
 */

const { defaultResolver } = require('jest-resolve');
const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  // If the request ends with .js, try to resolve to .ts
  if (request.endsWith('.js')) {
    const tsRequest = request.replace(/\.js$/, '.ts');
    const tsPath = path.resolve(options.basedir, tsRequest);
    
    // Check if the .ts file exists
    if (fs.existsSync(tsPath)) {
      return tsPath;
    }
    
    // Also try relative paths
    if (request.startsWith('./') || request.startsWith('../')) {
      const absoluteTsPath = path.resolve(path.dirname(options.basedir), tsRequest);
      if (fs.existsSync(absoluteTsPath)) {
        return absoluteTsPath;
      }
    }
  }
  
  // Fall back to default resolver
  return defaultResolver(request, options);
};