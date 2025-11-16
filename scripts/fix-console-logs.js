#!/usr/bin/env node
/**
 * Automated Console.log Replacement Script
 *
 * Replaces console.log statements with proper structured logging
 * Preserves intentional console output in examples and scripts
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Files/directories to exclude from replacement
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/*.md',
  '**/examples/**',
  '**/demo/**',
  '**/docs/**',
  '**/scripts/postinstall.cjs',
  '**/*.config.js',
  '**/build.js',
  '**/Dockerfile'
];

// Pattern to match console.log statements
const CONSOLE_LOG_PATTERN = /console\.log\(/g;

async function replaceConsoleLogs(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const matches = content.match(CONSOLE_LOG_PATTERN);

    if (!matches || matches.length === 0) {
      return { path: filePath, count: 0, changed: false };
    }

    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isBackend = filePath.includes('/backend/');

    let newContent = content;
    let hasLoggerImport = content.includes('import') && (
      content.includes('from \'pino\'') ||
      content.includes('from "pino"') ||
      content.includes('from \'./utils/logger') ||
      content.includes('from "../utils/logger')
    );

    // Add logger import if not present
    if (!hasLoggerImport && matches.length > 0) {
      const importStatement = isBackend
        ? "import { logger } from './utils/logger.js';\n"
        : isTypeScript
        ? "import { Logger, LogLevel } from '../utils/logger.js';\nconst logger = new Logger('" + path.basename(filePath, path.extname(filePath)) + "');\n"
        : "import { logger } from '../utils/logger.js';\n";

      // Find the last import statement or add at the beginning
      const lastImportMatch = newContent.match(/import[^;]+;/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        newContent = newContent.replace(lastImport, lastImport + '\n' + importStatement);
      } else {
        newContent = importStatement + newContent;
      }
    }

    // Replace console.log with logger.info
    newContent = newContent.replace(
      /console\.log\(/g,
      'logger.info('
    );

    // Replace console.error with logger.error
    newContent = newContent.replace(
      /console\.error\(/g,
      'logger.error('
    );

    // Replace console.warn with logger.warn
    newContent = newContent.replace(
      /console\.warn\(/g,
      'logger.warn('
    );

    // Replace console.debug with logger.debug
    newContent = newContent.replace(
      /console\.debug\(/g,
      'logger.debug('
    );

    if (!DRY_RUN && newContent !== content) {
      await writeFile(filePath, newContent, 'utf-8');
    }

    return {
      path: filePath,
      count: matches.length,
      changed: newContent !== content
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { path: filePath, count: 0, changed: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Scanning for console.log statements...\n');

  const files = await glob('src/**/*.{js,ts,jsx,tsx}', {
    ignore: EXCLUDE_PATTERNS,
    absolute: true
  });

  console.log(`Found ${files.length} files to process\n`);

  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No files will be modified\n');
  }

  const results = await Promise.all(files.map(replaceConsoleLogs));

  const changed = results.filter(r => r.changed);
  const totalConsoleLogsFound = results.reduce((sum, r) => sum + r.count, 0);

  console.log('\n📊 Summary:');
  console.log(`  Total files scanned: ${files.length}`);
  console.log(`  Files with console.log: ${results.filter(r => r.count > 0).length}`);
  console.log(`  Total console.log statements: ${totalConsoleLogsFound}`);
  console.log(`  Files modified: ${changed.length}`);

  if (VERBOSE && changed.length > 0) {
    console.log('\n📝 Modified files:');
    changed.forEach(r => {
      console.log(`  - ${r.path} (${r.count} replacements)`);
    });
  }

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else if (changed.length > 0) {
    console.log('\n✅ Console.log statements replaced successfully!');
  }
}

main().catch(console.error);
