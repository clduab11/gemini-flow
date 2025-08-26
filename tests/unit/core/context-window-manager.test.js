/**
 * Context Window Manager Tests
 *
 * Test suite for 1M+ token context window management
 * with smart truncation and conversation persistence
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextWindowManager } from '../../../src/core/context-window-manager';
import * as fs from 'fs';
import * as path from 'path';
// Mock filesystem operations
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn()
}));
jest.mock('path', () => ({
    join: jest.fn(),
    resolve: jest.fn(),
    dirname: jest.fn()
}));
const mockFs = fs;
const mockPath = path;
describe('ContextWindowManager', () => {
    let contextManager;
    const maxTokens = 1000000; // 1M tokens
    const sessionId = 'test-session-123';
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Setup default mock behavior
        mockPath.join.mockImplementation((...args) => args.join('/'));
        mockFs.existsSync.mockReturnValue(false);
        mockFs.readFileSync.mockReturnValue('[]');
        mockFs.writeFileSync.mockImplementation();
        mockFs.mkdirSync.mockImplementation();
        contextManager = new ContextWindowManager({
            maxTokens,
            sessionPath: '/test/sessions'
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('initialization', () => {
        it('should initialize with default options', () => {
            const manager = new ContextWindowManager();
            expect(manager).toBeDefined();
            expect(manager.getMaxTokens()).toBe(1000000);
        });
        it('should initialize with custom options', () => {
            const options = {
                maxTokens: 500000,
                sessionPath: '/custom/sessions',
                truncationStrategy: 'sliding'
            };
            const manager = new ContextWindowManager(options);
            expect(manager).toBeDefined();
            expect(manager.getMaxTokens()).toBe(500000);
        });
    });
    describe('addMessage()', () => {
        it('should add user message to context', async () => {
            const message = 'Hello, how are you?';
            await contextManager.addMessage('user', message);
            const context = contextManager.getContext();
            expect(context).toHaveLength(1);
            expect(context[0]).toEqual({
                role: 'user',
                content: message,
                timestamp: expect.any(Date),
                tokens: expect.any(Number)
            });
        });
        it('should add assistant message to context', async () => {
            const message = 'I am doing well, thank you!';
            await contextManager.addMessage('assistant', message);
            const context = contextManager.getContext();
            expect(context).toHaveLength(1);
            expect(context[0]).toEqual({
                role: 'assistant',
                content: message,
                timestamp: expect.any(Date),
                tokens: expect.any(Number)
            });
        });
        it('should estimate token count for messages', async () => {
            const shortMessage = 'Hi';
            const longMessage = 'This is a much longer message that should have more tokens estimated for it.';
            await contextManager.addMessage('user', shortMessage);
            await contextManager.addMessage('user', longMessage);
            const context = contextManager.getContext();
            expect(context[0].tokens).toBeLessThan(context[1].tokens);
        });
        it('should maintain chronological order', async () => {
            const messages = ['First message', 'Second message', 'Third message'];
            for (const message of messages) {
                await contextManager.addMessage('user', message);
                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            const context = contextManager.getContext();
            expect(context).toHaveLength(3);
            expect(context[0].content).toBe('First message');
            expect(context[1].content).toBe('Second message');
            expect(context[2].content).toBe('Third message');
        });
    });
    describe('token management', () => {
        it('should track total tokens correctly', async () => {
            await contextManager.addMessage('user', 'Hello');
            await contextManager.addMessage('assistant', 'Hi there!');
            const totalTokens = contextManager.getTotalTokens();
            expect(totalTokens).toBeGreaterThan(0);
        });
        it('should calculate remaining tokens', async () => {
            await contextManager.addMessage('user', 'Test message');
            const totalTokens = contextManager.getTotalTokens();
            const remainingTokens = contextManager.getRemainingTokens();
            expect(remainingTokens).toBe(maxTokens - totalTokens);
        });
        it('should handle token overflow', async () => {
            // Create a message that would exceed the token limit
            const largeMessage = 'x'.repeat(4000000); // ~1M tokens worth of content
            await contextManager.addMessage('user', largeMessage);
            const totalTokens = contextManager.getTotalTokens();
            expect(totalTokens).toBeLessThanOrEqual(maxTokens);
        });
    });
    describe('context truncation', () => {
        beforeEach(() => {
            // Use smaller token limit for easier testing
            contextManager = new ContextWindowManager({
                maxTokens: 1000,
                sessionPath: '/test/sessions'
            });
        });
        it('should truncate context when approaching limit', async () => {
            // Add messages until we approach the limit
            const messageSize = 100; // tokens
            const messageCount = 15; // Should exceed 1000 tokens
            for (let i = 0; i < messageCount; i++) {
                const message = 'x'.repeat(400); // ~100 tokens
                await contextManager.addMessage('user', message);
            }
            // Request truncation
            await contextManager.truncateContext(200);
            const totalTokens = contextManager.getTotalTokens();
            expect(totalTokens).toBeLessThan(1000);
        });
        it('should preserve recent messages during truncation', async () => {
            // Add older messages
            for (let i = 0; i < 5; i++) {
                await contextManager.addMessage('user', `Old message ${i}`);
            }
            // Add recent important message
            await contextManager.addMessage('user', 'Important recent message');
            // Truncate
            await contextManager.truncateContext(100);
            const context = contextManager.getContext();
            const lastMessage = context[context.length - 1];
            expect(lastMessage.content).toBe('Important recent message');
        });
        it('should use sliding window strategy', async () => {
            contextManager = new ContextWindowManager({
                maxTokens: 1000,
                truncationStrategy: 'sliding'
            });
            // Fill context
            for (let i = 0; i < 10; i++) {
                await contextManager.addMessage('user', `Message ${i}`.repeat(25));
            }
            await contextManager.truncateContext(200);
            const context = contextManager.getContext();
            // Should keep recent messages
            expect(context.length).toBeGreaterThan(0);
            expect(context.length).toBeLessThan(10);
        });
        it('should use importance-based strategy', async () => {
            contextManager = new ContextWindowManager({
                maxTokens: 1000,
                truncationStrategy: 'importance'
            });
            // Add messages with varying importance (based on length/content)
            await contextManager.addMessage('user', 'Short');
            await contextManager.addMessage('assistant', 'This is a very detailed and important response with lots of context');
            await contextManager.addMessage('user', 'Ok');
            await contextManager.truncateContext(100);
            const context = contextManager.getContext();
            // Should preserve the important detailed response
            expect(context.some(msg => msg.content.includes('detailed and important'))).toBe(true);
        });
    });
    describe('clearContext()', () => {
        it('should clear all messages', async () => {
            await contextManager.addMessage('user', 'Message 1');
            await contextManager.addMessage('assistant', 'Response 1');
            expect(contextManager.getContext()).toHaveLength(2);
            contextManager.clearContext();
            expect(contextManager.getContext()).toHaveLength(0);
            expect(contextManager.getTotalTokens()).toBe(0);
        });
    });
    describe('session persistence', () => {
        it('should save session to file', async () => {
            await contextManager.addMessage('user', 'Test message');
            await contextManager.saveSession(sessionId);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining(sessionId), expect.stringContaining('Test message'));
        });
        it('should restore session from file', async () => {
            const sessionData = JSON.stringify([
                {
                    role: 'user',
                    content: 'Restored message',
                    timestamp: new Date().toISOString(),
                    tokens: 20
                }
            ]);
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(sessionData);
            await contextManager.restoreSession(sessionId);
            const context = contextManager.getContext();
            expect(context).toHaveLength(1);
            expect(context[0].content).toBe('Restored message');
        });
        it('should handle missing session file gracefully', async () => {
            mockFs.existsSync.mockReturnValue(false);
            await expect(contextManager.restoreSession('nonexistent')).resolves.toBeUndefined();
            expect(contextManager.getContext()).toHaveLength(0);
        });
        it('should handle corrupted session file', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('invalid json');
            await expect(contextManager.restoreSession(sessionId)).rejects.toThrow();
        });
        it('should create session directory if not exists', async () => {
            await contextManager.saveSession(sessionId);
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        });
    });
    describe('exportSession()', () => {
        it('should export session to JSON file', async () => {
            await contextManager.addMessage('user', 'Hello');
            await contextManager.addMessage('assistant', 'Hi there!');
            const exportPath = await contextManager.exportSession();
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(exportPath, expect.stringContaining('"role": "user"'));
            expect(exportPath).toContain('.json');
        });
        it('should export to custom path', async () => {
            await contextManager.addMessage('user', 'Test');
            const customPath = '/custom/export.json';
            const exportPath = await contextManager.exportSession(customPath);
            expect(exportPath).toBe(customPath);
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(customPath, expect.any(String));
        });
    });
    describe('performance optimization', () => {
        it('should handle large context efficiently', async () => {
            const startTime = performance.now();
            // Add many messages
            for (let i = 0; i < 1000; i++) {
                await contextManager.addMessage('user', `Message ${i}`);
            }
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000);
        });
        it('should efficiently calculate token counts', () => {
            const testTexts = [
                'Short',
                'Medium length message with some content',
                'Very long message '.repeat(100)
            ];
            testTexts.forEach(text => {
                const tokens = contextManager.estimateTokens(text);
                expect(tokens).toBeGreaterThan(0);
                expect(tokens).toBeLessThan(text.length); // Should be less than character count
            });
        });
    });
    describe('context analysis', () => {
        it('should analyze conversation patterns', async () => {
            await contextManager.addMessage('user', 'What is the weather?');
            await contextManager.addMessage('assistant', 'I cannot access weather data.');
            await contextManager.addMessage('user', 'Can you help with coding?');
            await contextManager.addMessage('assistant', 'Yes, I can help with programming!');
            const analysis = contextManager.analyzeContext();
            expect(analysis).toEqual({
                messageCount: 4,
                userMessages: 2,
                assistantMessages: 2,
                averageMessageLength: expect.any(Number),
                totalTokens: expect.any(Number),
                conversationTopics: expect.any(Array)
            });
        });
        it('should identify conversation topics', async () => {
            await contextManager.addMessage('user', 'Tell me about machine learning');
            await contextManager.addMessage('assistant', 'Machine learning is a subset of AI...');
            const analysis = contextManager.analyzeContext();
            expect(analysis.conversationTopics).toContain('machine learning');
        });
    });
    describe('error handling', () => {
        it('should handle file system errors gracefully', async () => {
            mockFs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });
            await expect(contextManager.saveSession(sessionId)).rejects.toThrow('Disk full');
        });
        it('should handle invalid message content', async () => {
            const invalidContent = null;
            await expect(contextManager.addMessage('user', invalidContent)).rejects.toThrow();
        });
        it('should handle extremely long messages', async () => {
            const hugeMessage = 'x'.repeat(10000000); // 10MB of text
            await contextManager.addMessage('user', hugeMessage);
            // Should not crash and should manage tokens appropriately
            const totalTokens = contextManager.getTotalTokens();
            expect(totalTokens).toBeLessThanOrEqual(maxTokens);
        });
    });
});
//# sourceMappingURL=context-window-manager.test.js.map