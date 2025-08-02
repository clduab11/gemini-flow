// ESM Loader for Jest compatibility
export async function resolve(specifier, context, defaultResolve) {
  // Handle .js imports that should resolve to .ts files
  if (specifier.endsWith('.js') && !specifier.includes('node_modules')) {
    const tsSpecifier = specifier.replace(/\.js$/, '.ts');
    try {
      return await defaultResolve(tsSpecifier, context);
    } catch {
      // If .ts doesn't exist, try the original .js
      return await defaultResolve(specifier, context);
    }
  }
  
  return await defaultResolve(specifier, context);
}

export async function getFormat(url, context, defaultGetFormat) {
  // Treat .ts files as ESM
  if (url.endsWith('.ts') || url.endsWith('.mts')) {
    return { format: 'module' };
  }
  
  return await defaultGetFormat(url, context);
}