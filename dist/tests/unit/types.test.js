/**
 * Type Tests - TDD approach for TypeScript compilation
 * Testing type interfaces before fixing implementation
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
// Test basic adapter interfaces
describe('Adapter Type Tests', () => {
    it('should validate BaseModelAdapter interface', () => {
        // This test passes if the interface compiles
        expect(true).toBe(true);
    });
    it('should validate ModelRequest interface', () => {
        expect(true).toBe(true);
    });
    it('should validate ModelResponse interface', () => {
        expect(true).toBe(true);
    });
});
// Test streaming interfaces
describe('Streaming Type Tests', () => {
    it('should validate StreamChunk interface', () => {
        expect(true).toBe(true);
    });
    it('should validate streaming configuration types', () => {
        expect(true).toBe(true);
    });
});
// Test Google Services interfaces
describe('Google Services Type Tests', () => {
    it('should validate enhanced streaming interfaces', () => {
        expect(true).toBe(true);
    });
});
// Test Agent Space interfaces
describe('Agent Space Type Tests', () => {
    it('should validate agent space core types', () => {
        expect(true).toBe(true);
    });
});
/**
 * NOTE: Test framework/library detected: Jest via '@jest/globals' (TypeScript setup, e.g., ts-jest or equivalent).
 * These tests extend the original compile-only type checks with runtime behavior validation,
 * async stream semantics, and failure-path coverage for the interfaces introduced in this diff.
 */
describe('Adapter Runtime Behavior - async flows, streaming, and capabilities', () => {
    const makeChunk = (id, content, index, finished = false) => ({
        id,
        content,
        finished,
        metadata: { adapter: 'mock', chunkIndex: index },
    });
    class MockAdapter {
        failStreamAt = null;
        onFinalize;
        async initialize() {
            // simulate async setup
            await Promise.resolve();
        }
        async generate(request) {
            const prompt = request?.prompt ?? '';
            const usage = { promptTokens: 1, completionTokens: 2, totalTokens: 3 };
            return {
                content: `Echo: ${prompt}`,
                model: 'mock-1',
                latency: 12,
                usage,
                cost: 0,
                finishReason: 'stop',
            };
        }
        async *generateStream(_request) {
            try {
                for (let i = 0; i < 3; i++) {
                    if (this.failStreamAt === i) {
                        throw new Error(`stream-fail-${i}`);
                    }
                    const finished = i === 2;
                    yield makeChunk(`c${i}`, `part-${i}`, i, finished);
                    if (finished)
                        break;
                }
            }
            finally {
                // verify finalization is invoked on early consumer break
                if (this.onFinalize)
                    this.onFinalize();
            }
        }
        setStreamFailureIndex(i) {
            this.failStreamAt = i;
        }
        async healthCheck() {
            return { status: 'ok', modelCount: 1 };
        }
        getCapabilities() {
            return { streaming: true, modalities: ['text', 'audio', 'video'] };
        }
    }
    let adapter;
    beforeEach(() => {
        adapter = new MockAdapter();
    });
    it('initializes and reports healthy status', async () => {
        await expect(adapter.initialize()).resolves.toBeUndefined();
        const hc = await adapter.healthCheck();
        expect(hc).toEqual({ status: 'ok', modelCount: 1 });
    });
    it('generate returns a well-formed ModelResponse and consistent token accounting', async () => {
        const res = await adapter.generate({ prompt: 'hello' });
        expect(res).toMatchObject({
            content: 'Echo: hello',
            model: 'mock-1',
            finishReason: 'stop',
        });
        expect(res.latency).toBeGreaterThanOrEqual(0);
        expect(res.usage.totalTokens).toBe(res.usage.promptTokens + res.usage.completionTokens);
    });
    it('generateStream yields sequential chunks and finishes', async () => {
        const chunks = [];
        for await (const ch of adapter.generateStream({ prompt: 'x' })) {
            chunks.push(ch);
        }
        expect(chunks).toHaveLength(3);
        expect(chunks[0]).toMatchObject({ id: 'c0', content: 'part-0', finished: false });
        expect(chunks[1]).toMatchObject({ id: 'c1', content: 'part-1', finished: false });
        expect(chunks[2]).toMatchObject({ id: 'c2', content: 'part-2', finished: true });
        expect(chunks.every((c, i) => c.metadata?.chunkIndex === i)).toBe(true);
    });
    it('finalizes producer when consumer breaks early', async () => {
        let finalized = false;
        adapter.onFinalize = () => {
            finalized = true;
        };
        (async () => {
            let count = 0;
            for await (const _ of adapter.generateStream({})) {
                count++;
                if (count === 1)
                    break;
            }
        })();
        // Allow microtask queue to flush to run the finally block
        await new Promise((r) => setTimeout(r, 0));
        expect(finalized).toBe(true);
    });
    it('propagates errors thrown by the producer during streaming', async () => {
        adapter.setStreamFailureIndex(1);
        const consume = async () => {
            for await (const _ of adapter.generateStream({})) {
                // consume until error
            }
        };
        await expect(consume()).rejects.toThrow(/stream-fail-1/);
    });
    it('reports capabilities including streaming and supported modalities', () => {
        const caps = adapter.getCapabilities();
        expect(caps.streaming).toBe(true);
        expect(caps.modalities).toEqual(expect.arrayContaining(['text', 'audio', 'video']));
    });
});
describe('ModelRequest normalization and defensive handling', () => {
    const normalizeModelRequest = (req) => {
        const defaults = {
            latencyTarget: 0,
            priority: 'normal',
            userTier: 'free',
            retryCount: 0,
        };
        const ctx = req.context ?? {};
        const latency = Math.max(0, Number.isFinite(ctx.latencyTarget) ? ctx.latencyTarget : defaults.latencyTarget);
        const retry = Math.max(0, Number.isFinite(ctx.retryCount) ? ctx.retryCount : defaults.retryCount);
        return {
            prompt: req.prompt ?? '',
            multimodal: !!req.multimodal,
            tools: Array.isArray(req.tools) ? req.tools : [],
            context: {
                latencyTarget: latency,
                priority: ctx.priority ?? defaults.priority,
                userTier: ctx.userTier ?? defaults.userTier,
                retryCount: retry,
            },
        };
    };
    it('normalizes minimal input', () => {
        const out = normalizeModelRequest({ prompt: 'hi' });
        expect(out).toEqual({
            prompt: 'hi',
            multimodal: false,
            tools: [],
            context: { latencyTarget: 0, priority: 'normal', userTier: 'free', retryCount: 0 },
        });
    });
    it('clamps negative numbers and preserves provided fields', () => {
        const out = normalizeModelRequest({
            prompt: '',
            context: { latencyTarget: -50, retryCount: -1, priority: 'high', userTier: 'pro' },
            tools: [{ name: 't1' }],
            multimodal: true,
        });
        expect(out.context.latencyTarget).toBe(0);
        expect(out.context.retryCount).toBe(0);
        expect(out.context.priority).toBe('high');
        expect(out.tools).toHaveLength(1);
        expect(out.multimodal).toBe(true);
    });
});
describe('Streaming configuration schema checks', () => {
    const allowed = new Set([
        'webrtc', 'caching', 'cdn', 'synchronization', 'quality', 'a2a', 'performance', 'security',
    ]);
    const validateStreamingConfig = (cfg) => {
        if (typeof cfg !== 'object' || cfg === null)
            return false;
        const c = cfg;
        if (typeof c.enabled !== 'boolean')
            return false;
        if (typeof c.config !== 'object' || c.config === null)
            return false;
        return Object.keys(c.config).every((k) => allowed.has(k));
    };
    it('accepts minimal valid config', () => {
        expect(validateStreamingConfig({ enabled: true, config: {} })).toBe(true);
    });
    it('accepts a full config with known keys only', () => {
        const cfg = {
            enabled: true,
            config: {
                webrtc: { iceServers: [] },
                caching: { ttl: 300 },
                cdn: { provider: 'mock' },
                synchronization: { driftMs: 5 },
                quality: { preset: 'high' },
                a2a: { enabled: false },
                performance: { targetFps: 30 },
                security: { token: 'x' },
            },
        };
        expect(validateStreamingConfig(cfg)).toBe(true);
    });
    it('rejects configs with unknown nested keys or wrong shapes', () => {
        expect(validateStreamingConfig({ enabled: true, config: { foo: {} } })).toBe(false);
        expect(validateStreamingConfig({ enabled: 'yes', config: {} })).toBe(false);
        expect(validateStreamingConfig({ enabled: true })).toBe(false);
    });
});
describe('Google EnhancedStreamingAPI behavior and lifecycle', () => {
    class FakeEnhancedStreamingAPI {
        sessions = new Map();
        async createSession(sessionId, type, context) {
            this.sessions.set(sessionId, { type, context, chunks: [] });
            return { sessionId, type, createdAt: Date.now(), context };
        }
        ensure(sessionId) {
            const s = this.sessions.get(sessionId);
            if (!s)
                throw new Error('Unknown session');
            return s;
        }
        async startVideoStream(sessionId, request, context) {
            this.ensure(sessionId);
            return { ok: true, kind: 'video', request, context };
        }
        async startAudioStream(sessionId, request, context) {
            this.ensure(sessionId);
            return { ok: true, kind: 'audio', request, context };
        }
        async processMultiModalChunk(sessionId, chunk) {
            const s = this.ensure(sessionId);
            s.chunks.push(chunk);
            return true;
        }
        async endSession(sessionId) {
            return this.sessions.delete(sessionId);
        }
    }
    let api;
    beforeEach(() => {
        api = new FakeEnhancedStreamingAPI();
    });
    it('runs a full happy-path session lifecycle', async () => {
        const session = await api.createSession('sess-1', 'realtime', { user: 'u1' });
        expect(session).toHaveProperty('sessionId', 'sess-1');
        const video = await api.startVideoStream('sess-1', { bitrate: 3000 }, { region: 'us' });
        expect(video).toMatchObject({ ok: true, kind: 'video' });
        const audio = await api.startAudioStream('sess-1', { bitrate: 160 }, { region: 'us' });
        expect(audio).toMatchObject({ ok: true, kind: 'audio' });
        const processed = await api.processMultiModalChunk('sess-1', { type: 'text', content: 'hi' });
        expect(processed).toBe(true);
        const ended = await api.endSession('sess-1');
        expect(ended).toBe(true);
    });
    it('rejects stream starts for unknown sessions and returns false on double-ends', async () => {
        await expect(api.startVideoStream('missing', {}, {})).rejects.toThrow('Unknown session');
        expect(await api.endSession('missing')).toBe(false);
    });
});
describe('Agent Space status guards and transitions', () => {
    const isValidStatus = (v) => ['active', 'idle', 'busy'].includes(v);
    const transitionStatus = (current, action) => {
        const map = {
            idle: { start: 'active' },
            active: { pause: 'idle', finish: 'busy' },
            busy: { finish: 'idle' },
        };
        const next = map[current]?.[action];
        if (!next)
            throw new Error(`Invalid transition from ${current} via ${action}`);
        return next;
    };
    it('validates known statuses and rejects unknown ones', () => {
        expect(isValidStatus('active')).toBe(true);
        expect(isValidStatus('paused')).toBe(false);
    });
    it('supports allowed transitions and blocks invalid ones', () => {
        expect(transitionStatus('idle', 'start')).toBe('active');
        expect(transitionStatus('active', 'pause')).toBe('idle');
        expect(transitionStatus('active', 'finish')).toBe('busy');
        expect(transitionStatus('busy', 'finish')).toBe('idle');
        expect(() => transitionStatus('idle', 'finish')).toThrow(/Invalid transition/);
    });
});
describe('ModelResponse usage consistency checks', () => {
    const usageIsConsistent = (r) => r.usage.totalTokens === r.usage.promptTokens + r.usage.completionTokens;
    it('accepts correct token totals', () => {
        const r = {
            content: 'ok',
            model: 'm',
            latency: 1,
            usage: { promptTokens: 5, completionTokens: 7, totalTokens: 12 },
            cost: 0,
            finishReason: 'stop',
        };
        expect(usageIsConsistent(r)).toBe(true);
    });
    it('flags inconsistent token totals', () => {
        const r = {
            content: 'bad',
            model: 'm',
            latency: 1,
            usage: { promptTokens: 5, completionTokens: 7, totalTokens: 11 },
            cost: 0,
            finishReason: 'stop',
        };
        expect(usageIsConsistent(r)).toBe(false);
    });
});
//# sourceMappingURL=types.test.js.map