/**
 * GeminiCLI unit tests
 *
 * Testing library note:
 * - These tests are compatible with Jest or Vitest (they use describe/it/expect globals only).
 * - We avoid jest/vi-specific APIs and monkeypatch console/process manually.
 * - If your repository uses Jest, no changes are required.
 * - If your repository uses Vitest, no changes are required.
 */

describe('GeminiCLI', () => {
  // Dynamically locate and load GeminiCLI from common paths so tests don't depend on a specific layout.

  let GeminiCLI: any;

  const candidateModules = [
    // Typical source locations
    '../../../src/cli/gemini-cli',
    '../../../src/cli/gemini',
    '../../../src/gemini-cli',
    // Built output locations
    '../../../lib/cli/gemini-cli',
    '../../../dist/cli/gemini-cli',
    '../../../build/cli/gemini-cli',
  ];

  const req: any = (global as any).require ? (global as any).require : undefined;

  async function loadGeminiCLI() {
    for (const p of candidateModules) {
      try {
        const mod = req(p);
        const C = mod.GeminiCLI ?? mod.default ?? mod;
        if (typeof C === 'function') return C;
      } catch (err) {
        // fall through and try dynamic import next
        try {
          const mod = await import(p);
          const C = (mod as any).GeminiCLI ?? (mod as any).default ?? mod;
          if (typeof C === 'function') return C;
        } catch (_e) {
          // try next path
        }
      }
    }
    throw new Error('Unable to resolve GeminiCLI from known locations. ' +
      'Please adjust candidateModules in tests/unit/cli/gemini-cli.test.ts to match project structure.');
  }

  beforeAll(async () => {
    GeminiCLI = await loadGeminiCLI();
  });

  async function runCLI(args: string[], options: { env?: Record<string, string | undefined> } = {}) {
    const logs: string[] = [];
    const original = {
      argv: process.argv.slice(),
      log: console.log,
      error: console.error,
      exit: process.exit,
      env: { ...process.env },
    };

    // Patch console to capture output
    console.log = (...a: any[]) => {
      try {
        logs.push(a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
      } catch {
        logs.push(String(a));
      }
    };
    console.error = (...a: any[]) => {
      try {
        logs.push(a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
      } catch {
        logs.push(String(a));
      }
    };

    // Patch exit to prevent terminating the test runner
    let exitCode: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = ((code?: number) => {
      exitCode = code ?? 0;
      return undefined as never;
    }) as any;

    // Configure argv and env
    process.argv = ['node', 'gemini-flow', ...args];

    if (options.env) {
      for (const [k, v] of Object.entries(options.env)) {
        if (typeof v === 'undefined') {
          delete (process.env as any)[k];
        } else {
          process.env[k] = String(v);
        }
      }
    }

    try {
      const cli = new GeminiCLI();
      await cli.run();
    } finally {
      // Restore env
      const backup = original.env;
      // Remove keys not in backup
      for (const key of Object.keys(process.env)) {
        if (!(key in backup)) {
          delete (process.env as any)[key];
        }
      }
      // Restore backup values
      for (const [k, v] of Object.entries(backup)) {
        process.env[k] = v as string;
      }

      // Restore process and console
      process.argv = original.argv;
      console.log = original.log;
      console.error = original.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process as any).exit = original.exit as any;
    }

    return { logs, exitCode };
  }

  // Helper to check presence of multiple substrings
  function expectLogsToContainAll(logs: string[], substrings: string[]) {
    const joined = logs.join('\n');
    for (const s of substrings) {
      expect(joined).toContain(s);
    }
  }

  it('shows help when no args are provided', async () => {
    const { logs, exitCode } = await runCLI([]);
    expect(exitCode).toBeUndefined();
    expectLogsToContainAll(logs, [
      'Gemini-Flow CLI',
      'Usage:',
      'Commands:',
      'chat, c',
      'generate, g',
      'list-models, models',
      'auth'
    ]);
  });

  it('shows help for --help and -h flags', async () => {
    const r1 = await runCLI(['--help']);
    expectLogsToContainAll(r1.logs, ['Usage:', 'Commands:']);
    expect(r1.exitCode).toBeUndefined();

    const r2 = await runCLI(['-h']);
    expectLogsToContainAll(r2.logs, ['Usage:', 'Commands:']);
    expect(r2.exitCode).toBeUndefined();
  });

  it('prints error and exits with code 1 for unknown command', async () => {
    const { logs, exitCode } = await runCLI(['unknown-cmd']);
    expect(exitCode).toBe(1);
    expect(logs.join('\n')).toContain('Unknown command: unknown-cmd');
    expect(logs.join('\n')).toContain('Usage:');
  });

  describe('chat command', () => {
    it('shows chat header without prompt', async () => {
      const { logs, exitCode } = await runCLI(['chat']);
      expect(exitCode).toBeUndefined();
      expectLogsToContainAll(logs, [
        '🤖 Gemini Chat Mode',
        '(Basic implementation - install dependencies for full functionality)',
        'Use Ctrl+C to exit'
      ]);
    });

    it('shows chat header and echoes prompt when args provided', async () => {
      const { logs } = await runCLI(['chat', 'Hello', 'Gemini']);
      expectLogsToContainAll(logs, [
        '🤖 Gemini Chat Mode',
        'You: Hello Gemini',
        'Assistant: Hello! This is a basic CLI implementation.'
      ]);
    });

    it('supports alias "c"', async () => {
      const { logs } = await runCLI(['c', 'Hi']);
      expect(logs.join('\n')).toContain('You: Hi');
    });
  });

  describe('generate command', () => {
    it('errors when no prompt is provided', async () => {
      const { logs, exitCode } = await runCLI(['generate']);
      expect(exitCode).toBeUndefined();
      expect(logs.join('\n')).toContain('Error: Please provide a prompt for generation');
    });

    it('generates output and shows note for provided prompt', async () => {
      const { logs } = await runCLI(['generate', 'Write', 'a', 'haiku']);
      const out = logs.join('\n');
      expect(out).toContain('Generating response for: "Write a haiku"');
      expect(out).toContain('Note: This is a basic CLI implementation.');
    });

    it('supports alias "g"', async () => {
      const { logs } = await runCLI(['g', 'test']);
      expect(logs.join('\n')).toContain('Generating response for: "test"');
    });
  });

  describe('list-models command', () => {
    it('prints available models', async () => {
      const { logs } = await runCLI(['list-models']);
      const out = logs.join('\n');
      expect(out).toContain('Available models:');
      expect(out).toContain('- gemini-1.5-flash');
      expect(out).toContain('- gemini-1.5-pro');
    });

    it('supports alias "models"', async () => {
      const { logs } = await runCLI(['models']);
      const out = logs.join('\n');
      expect(out).toContain('Available models:');
    });
  });

  describe('auth command', () => {
    it('configures API key when --key is provided with value', async () => {
      const { logs } = await runCLI(['auth', '--key', 'dummy-key']);
      const out = logs.join('\n');
      expect(out).toContain('✅ API key configured (basic implementation)');
      expect(out).toContain('Note: In full version, this would save your API key securely.');
    });

    it('errors when --key is missing value', async () => {
      const { logs } = await runCLI(['auth', '--key']);
      const out = logs.join('\n');
      expect(out).toContain('❌ Error: Please provide an API key');
      expect(out).toContain('Usage: gemini-flow auth --key YOUR_API_KEY');
    });

    it('status shows Found when GEMINI_API_KEY is set', async () => {
      const { logs } = await runCLI(['auth', '--status'], { env: { GEMINI_API_KEY: 'present', GOOGLE_AI_API_KEY: undefined } });
      const out = logs.join('\n');
      expect(out).toContain('Authentication Status:');
      expect(out).toContain('API Key in Environment: ✅ Found');
    });

    it('status shows Not found and guidance when no env keys are set', async () => {
      const { logs } = await runCLI(['auth', '--status'], { env: { GEMINI_API_KEY: undefined, GOOGLE_AI_API_KEY: undefined } });
      const out = logs.join('\n');
      expect(out).toContain('API Key in Environment: ❌ Not found');
      expect(out).toContain('To set your API key:');
      expect(out).toContain('export GEMINI_API_KEY="your-key-here"');
    });

    it('test flag prints testing message', async () => {
      const { logs } = await runCLI(['auth', '--test']);
      expect(logs.join('\n')).toContain('🔧 Testing API key...');
    });

    it('clear flag prints cleared message', async () => {
      const { logs } = await runCLI(['auth', '--clear']);
      expect(logs.join('\n')).toContain('🧹 API key cleared (basic implementation)');
    });

    it('no flags prints auth help', async () => {
      const { logs } = await runCLI(['auth']);
      const out = logs.join('\n');
      expect(out).toContain('Auth Commands:');
      expect(out).toContain('--key <key>');
      expect(out).toContain('--status');
      expect(out).toContain('--test');
      expect(out).toContain('--clear');
    });
  });
});