/**
 * Tests for CLI entry point dynamic mode selection and fallbacks.
 *
 * Testing library/framework:
 * - Prefers Vitest (vi, describe, it, expect, beforeEach, afterEach) if configured in the repo.
 * - These tests also work under Jest with minimal shims when jest is configured to transpile TS.
 */

// Lightweight test-runner shims to support Jest if Vitest isn't present:
const isVitest = (() => {
  try { return !!(global as any).vi; } catch (e) { return false; }
})();
const t = isVitest ? (global as any).vi : (global as any).jest;

type Spy = ReturnType<typeof t.spyOn> | ReturnType<typeof t.fn>;
const beforeAllFn = (global as any).beforeAll || (global as any).before || ((fn: any) => fn());
const beforeEachFn = (global as any).beforeEach || ((fn: any) => fn());
const afterEachFn = (global as any).afterEach || ((fn: any) => fn());
const describeFn = (global as any).describe || ((name: string, fn: any) => fn());
const itFn = (global as any).it || (global as any).test || ((name: string, fn: any) => fn());
const expectFn = (global as any).expect;

async function importFresh(modulePath: string) {
  // ESM fresh import by cache-busting query
  const ts = Date.now() + Math.random();
  // @ts-ignore - query param cache buster for test environment module graph
  return await import(modulePath + `?t=${ts}`);
}

// Paths relative to CLI entry (assume source file lives alongside simple-index.js/full-index.js)
const CLI_ENTRY_GLOBS = [
  'src/cli/index.ts',
  'src/cli/index.js',
  'bin/index.ts',
  'bin/index.js',
  'packages/*/src/cli/index.ts',
  'packages/*/bin/index.ts',
  'cli/index.ts',
  'cli/index.js'
];

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function resolveCliEntry(): Promise<string> {
  // Attempt to resolve an existing file matching known locations
  const root = process.cwd();
  const candidates = [
    'src/cli/index.ts',
    'src/cli/index.js',
    'bin/index.ts',
    'bin/index.js',
    'cli/index.ts',
    'cli/index.js'
  ];
  for (const rel of candidates) {
    try {
      const p = join(root, rel);
      await fs.stat(p);
      return `file://${p}`;
    } catch {}
  }
  // Fallback: try to locate by reading package.json bin field
  try {
    const pkgPath = join(root, 'package.json');
    const pkgRaw = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgRaw);
    if (pkg && pkg.bin) {
      const binRel = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0];
      if (binRel) {
        const p = join(root, binRel);
        await fs.stat(p);
        return `file://${p}`;
      }
    }
  } catch {}
  // Last resort: assume tests live next to CLI and import via relative when run under Vitest/Jest
  // This will fail with a readable error if file doesn't exist.
  return 'file://' + join(process.cwd(), 'src/cli/index.ts');
}

// Create stub modules for dynamic imports that the CLI performs
function installModuleStubs({ simpleOk = true, fullOk = true }: { simpleOk?: boolean; fullOk?: boolean }) {
  const implOk = { default: t.fn() };
  const implThrow = new Proxy({}, {
    get() { throw new Error('stub-load-failure'); }
  });

  // Vitest/Jest ESM mocking:
  const mock = (isVitest ? (global as any).vi.mock : (global as any).jest.mock).bind(isVitest ? (global as any).vi : (global as any).jest);

  mock('./simple-index.js', () => simpleOk ? implOk : implThrow, { virtual: true });
  mock('./full-index.js', () => fullOk ? implOk : implThrow, { virtual: true });

  return { implOk };
}

let stderrSpy: Spy;
let exitSpy: Spy;

beforeEachFn(() => {
  // Reset argv and env; isolate module system
  process.env.GEMINI_FLOW_SIMPLE_MODE = undefined;
  process.argv = ['node', 'cli'];

  // Spy on console.error and process.exit
  stderrSpy = t.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = t.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code ?? 0}) called`);
  }) as any);

  // Reset module mocks between tests
  if (isVitest) {
    (global as any).vi.resetModules();
    (global as any).vi.clearAllMocks();
  } else {
    (global as any).jest.resetModules();
    (global as any).jest.clearAllMocks();
  }
});

afterEachFn(() => {
  stderrSpy && (stderrSpy as any).mockRestore && (stderrSpy as any).mockRestore();
  exitSpy && (exitSpy as any).mockRestore && (exitSpy as any).mockRestore();
});

describeFn('CLI mode selection and dynamic import behavior', () => {
  itFn('loads simple CLI when GEMINI_FLOW_SIMPLE_MODE="true"', async () => {
    process.env.GEMINI_FLOW_SIMPLE_MODE = 'true';
    installModuleStubs({ simpleOk: true, fullOk: true });
    const cliPath = await resolveCliEntry();

    await importFresh(cliPath);

    expectFn(stderrSpy).not.toHaveBeenCalled();
    expectFn(exitSpy).not.toHaveBeenCalled();
  });

  itFn('loads simple CLI when --simple-mode flag provided', async () => {
    process.argv = ['node', 'cli', '--simple-mode'];
    installModuleStubs({ simpleOk: true, fullOk: true });
    const cliPath = await resolveCliEntry();

    await importFresh(cliPath);

    expectFn(stderrSpy).not.toHaveBeenCalled();
    expectFn(exitSpy).not.toHaveBeenCalled();
  });

  const simpleCommands = ['chat', 'c', 'generate', 'g', 'list-models', 'models', 'auth'] as const;
  simpleCommands.forEach((cmd) => {
    itFn(`loads simple CLI when first arg is "${cmd}"`, async () => {
      process.argv = ['node', 'cli', cmd];
      installModuleStubs({ simpleOk: true, fullOk: true });
      const cliPath = await resolveCliEntry();

      await importFresh(cliPath);

      expectFn(stderrSpy).not.toHaveBeenCalled();
      expectFn(exitSpy).not.toHaveBeenCalled();
    });
  });

  itFn('loads full CLI when no simple-mode triggers', async () => {
    process.argv = ['node', 'cli', 'orchestrate'];
    installModuleStubs({ simpleOk: true, fullOk: true });
    const cliPath = await resolveCliEntry();

    await importFresh(cliPath);

    expectFn(stderrSpy).not.toHaveBeenCalled();
    expectFn(exitSpy).not.toHaveBeenCalled();
  });

  itFn('falls back to simple CLI if full CLI import fails', async () => {
    process.argv = ['node', 'cli', 'orchestrate'];
    installModuleStubs({ simpleOk: true, fullOk: false });
    const cliPath = await resolveCliEntry();

    await importFresh(cliPath);

    // Should log the full CLI failure message, but not exit
    expectFn(stderrSpy).toHaveBeenCalledWith(expectFn.stringContaining('Failed to load full CLI, falling back to simple mode...'));
    expectFn(exitSpy).not.toHaveBeenCalled();
  });

  itFn('exits with error if simple CLI fails when explicitly in simple mode (env/flag/command)', async () => {
    process.env.GEMINI_FLOW_SIMPLE_MODE = 'true';
    installModuleStubs({ simpleOk: false, fullOk: true });
    const cliPath = await resolveCliEntry();

    let threw = false;
    try {
      await importFresh(cliPath);
    } catch (e: any) {
      threw = true;
      // thrown by our process.exit spy
      expectFn(String(e.message)).toMatch(/process\.exit\(1\) called/);
    }
    expectFn(threw).toBe(true);
    expectFn(stderrSpy).toHaveBeenCalledWith(expectFn.stringContaining('Failed to load simple CLI:'));
  });

  itFn('exits with error if full CLI fails and fallback simple CLI also fails', async () => {
    process.argv = ['node', 'cli', 'orchestrate'];
    installModuleStubs({ simpleOk: false, fullOk: false });
    const cliPath = await resolveCliEntry();

    let threw = false;
    try {
      await importFresh(cliPath);
    } catch (e: any) {
      threw = true;
      expectFn(String(e.message)).toMatch(/process\.exit\(1\) called/);
    }
    expectFn(threw).toBe(true);
    // Expect both failure logs
    expectFn(stderrSpy).toHaveBeenCalledWith(expectFn.stringContaining('Failed to load full CLI, falling back to simple mode...'));
    expectFn(stderrSpy).toHaveBeenCalledWith(expectFn.stringContaining('Failed to load fallback CLI:'));
  });

  itFn('handles empty args without crashing (no simple-mode -> full CLI)', async () => {
    process.argv = ['node', 'cli']; // no extra args
    installModuleStubs({ simpleOk: true, fullOk: true });
    const cliPath = await resolveCliEntry();
    await importFresh(cliPath);

    expectFn(stderrSpy).not.toHaveBeenCalled();
    expectFn(exitSpy).not.toHaveBeenCalled();
  });
});