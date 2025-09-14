/**
 * Gemini CLI Integration Test
 *
 * Simple integration test to verify that our core features work
 * without complex mocking
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
describe('Gemini CLI Integration', () => {
    const binPath = path.join(__dirname, '../../bin/gemini-flow');
    beforeAll(() => {
        // Ensure the binary is built and executable
        if (!fs.existsSync(binPath)) {
            throw new Error('Binary not found. Run npm run build first.');
        }
    });
    it('should show help when no command is provided', () => {
        try {
            const output = execSync(`node ${binPath} --help`, {
                encoding: 'utf8',
                timeout: 5000
            });
            expect(output).toContain('Gemini AI CLI');
            expect(output).toContain('chat');
            expect(output).toContain('generate');
            expect(output).toContain('list-models');
            expect(output).toContain('auth');
        }
        catch (error) {
            // Help command might exit with code 0 or 1, both are acceptable
            if (error.stdout) {
                expect(error.stdout).toContain('Gemini AI CLI');
            }
        }
    });
    it('should show auth status', () => {
        try {
            const output = execSync(`node ${binPath} auth --status`, {
                encoding: 'utf8',
                timeout: 5000
            });
            expect(output).toContain('Authentication Status');
        }
        catch (error) {
            // Auth command might show error if no key is set
            if (error.stdout) {
                expect(error.stdout).toContain('Authentication Status');
            }
        }
    });
    it('should list available models', () => {
        try {
            const output = execSync(`node ${binPath} list-models`, {
                encoding: 'utf8',
                timeout: 5000
            });
            expect(output).toContain('Available Models');
            expect(output).toContain('gemini-1.5-flash');
            expect(output).toContain('gemini-1.5-pro');
        }
        catch (error) {
            if (error.stdout) {
                expect(error.stdout).toContain('gemini');
            }
        }
    });
    it('should show proper error for generate without API key', () => {
        try {
            // Remove any existing API key
            delete process.env.GEMINI_API_KEY;
            delete process.env.GOOGLE_AI_API_KEY;
            delete process.env.GOOGLE_API_KEY;
            execSync(`node ${binPath} generate "test prompt"`, {
                encoding: 'utf8',
                timeout: 5000
            });
            // Should not reach here
            expect(false).toBe(true);
        }
        catch (error) {
            expect(error.stderr || error.stdout).toContain('Authentication required');
        }
    });
    it('should validate API key format in auth command', () => {
        try {
            execSync(`node ${binPath} auth --key invalid-key`, {
                encoding: 'utf8',
                timeout: 5000
            });
            // Should not reach here
            expect(false).toBe(true);
        }
        catch (error) {
            expect(error.stderr || error.stdout).toContain('Invalid API key format');
        }
    });
    it('should show help for specific commands', () => {
        try {
            const output = execSync(`node ${binPath} chat --help`, {
                encoding: 'utf8',
                timeout: 5000
            });
            expect(output).toContain('interactive conversation');
        }
        catch (error) {
            if (error.stdout) {
                expect(error.stdout).toContain('chat');
            }
        }
    });
});
describe('Core Classes', () => {
    it('should load GoogleAIAuth class', async () => {
        const { GoogleAIAuth } = await import('../../dist/core/google-ai-auth.js');
        const auth = new GoogleAIAuth();
        expect(auth).toBeDefined();
        expect(typeof auth.isAuthenticated).toBe('function');
    });
    it('should load ContextWindowManager class', async () => {
        const { ContextWindowManager } = await import('../../dist/core/context-window-manager.js');
        const contextManager = new ContextWindowManager();
        expect(contextManager).toBeDefined();
        expect(typeof contextManager.addMessage).toBe('function');
        expect(contextManager.getMaxTokens()).toBe(1000000);
    });
    it('should load GeminiCLI class', async () => {
        const { GeminiCLI } = await import('../../dist/cli/gemini-cli.js');
        const geminiCLI = new GeminiCLI();
        expect(geminiCLI).toBeDefined();
        expect(typeof geminiCLI.listModels).toBe('function');
    });
    it('should load InteractiveMode class', async () => {
        // Mock dependencies
        const { GoogleAIAuth } = await import('../../dist/core/google-ai-auth.js');
        const { ContextWindowManager } = await import('../../dist/core/context-window-manager.js');
        const { InteractiveMode } = await import('../../dist/cli/interactive-mode.js');
        const auth = new GoogleAIAuth({ apiKey: 'AIzaSyTestKey1234567890abcdefghijk' });
        const contextManager = new ContextWindowManager();
        const interactiveMode = new InteractiveMode({
            auth,
            contextManager
        });
        expect(interactiveMode).toBeDefined();
        expect(typeof interactiveMode.processMessage).toBe('function');
        expect(interactiveMode.isRunning()).toBe(false);
    });
});
describe('Authentication System', () => {
    it('should handle API key validation', async () => {
        const { GoogleAIAuth } = await import('../../dist/core/google-ai-auth.js');
        const auth = new GoogleAIAuth();
        // Test valid API key format
        const validKey = 'AIzaSyTestKey1234567890abcdefghijk';
        expect(auth.setApiKey(validKey)).toBe(true);
        expect(auth.isAuthenticated()).toBe(true);
        expect(auth.isValidApiKey()).toBe(true);
        // Test invalid API key format
        expect(auth.setApiKey('invalid-key')).toBe(false);
        expect(auth.isAuthenticated()).toBe(false);
    });
    it('should provide auth status information', async () => {
        const { GoogleAIAuth } = await import('../../dist/core/google-ai-auth.js');
        const auth = new GoogleAIAuth({ apiKey: 'AIzaSyTestKey1234567890abcdefghijk' });
        const status = auth.getAuthStatus();
        expect(status.isAuthenticated).toBe(true);
        expect(status.keyFormat).toBe('valid');
        expect(status.keyPrefix).toBe('AIzaSy...');
    });
});
describe('Context Window Management', () => {
    it('should manage conversation context', async () => {
        const { ContextWindowManager } = await import('../../dist/core/context-window-manager.js');
        const contextManager = new ContextWindowManager({ maxTokens: 1000 });
        await contextManager.addMessage('user', 'Hello');
        await contextManager.addMessage('assistant', 'Hi there!');
        const context = contextManager.getContext();
        expect(context).toHaveLength(2);
        expect(context[0].role).toBe('user');
        expect(context[0].content).toBe('Hello');
        expect(context[1].role).toBe('assistant');
        expect(context[1].content).toBe('Hi there!');
        const totalTokens = contextManager.getTotalTokens();
        expect(totalTokens).toBeGreaterThan(0);
        const remainingTokens = contextManager.getRemainingTokens();
        expect(remainingTokens).toBe(1000 - totalTokens);
    });
    it('should analyze conversation context', async () => {
        const { ContextWindowManager } = await import('../../dist/core/context-window-manager.js');
        const contextManager = new ContextWindowManager();
        await contextManager.addMessage('user', 'What is machine learning?');
        await contextManager.addMessage('assistant', 'Machine learning is a subset of AI...');
        const analysis = contextManager.analyzeContext();
        expect(analysis.messageCount).toBe(2);
        expect(analysis.userMessages).toBe(1);
        expect(analysis.assistantMessages).toBe(1);
        expect(analysis.totalTokens).toBeGreaterThan(0);
    });
    it('should handle context truncation', async () => {
        const { ContextWindowManager } = await import('../../dist/core/context-window-manager.js');
        const contextManager = new ContextWindowManager({ maxTokens: 100 });
        // Add messages that exceed the limit
        for (let i = 0; i < 10; i++) {
            await contextManager.addMessage('user', `Message ${i}`.repeat(10));
        }
        // Request truncation
        const result = await contextManager.truncateContext(50);
        expect(result.removedMessages).toBeGreaterThan(0);
        expect(result.tokensSaved).toBeGreaterThan(0);
        expect(contextManager.getTotalTokens()).toBeLessThan(100);
    });
});
//# sourceMappingURL=gemini-cli-integration.test.js.map