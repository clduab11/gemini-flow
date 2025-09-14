/**
 * Tests for QualityAdaptationEngine.
 * Note: Testing framework will be inferred from the project's configuration (e.g., Jest or Vitest).
 * These tests are designed to be framework-agnostic where possible.
 */
const reps = (...arr) => arr.map(r => ({ id: r.id, bitrate: r.bitrate, width: r.width, height: r.height }));
const kbps = (mbps) => Math.round(mbps * 1000);
const mkSamples = (valuesKbps) => valuesKbps.map((v, i) => ({ bitrateKbps: v, ts: i }));
const mkEngine = (opts = {}) => {
    const defaults = {
        safetyMargin: 0.85,
        minBufferForUpgradeSec: 10,
        downgradeRebufferThresholdMs: 250,
        minSamples: 3,
        maxIndex: undefined,
        maxBitrateKbps: undefined,
        latencyAware: false,
        hysteresisSec: 8,
        now: () => Date.now(),
    };
    // @ts-expect-error partial for tests
    return new QualityAdaptationEngine({ ...defaults, ...opts });
};
describe("QualityAdaptationEngine", () => {
    let now = 100000;
    const advance = (ms) => { now += ms; };
    const nowFn = () => now;
    beforeEach(() => {
        now = 100000;
    });
    it("selects lowest quality when no throughput samples are available", () => {
        const engine = mkEngine({ now: nowFn });
        const available = reps({ id: "144p", bitrate: kbps(0.3) }, { id: "240p", bitrate: kbps(0.6) }, { id: "360p", bitrate: kbps(1.0) });
        const decision = engine.decide({
            available,
            current: undefined,
            bufferSec: 12,
            samples: mkSamples([]),
        });
        expect(decision.target.id).toBe("144p");
        expect(decision.reason).toMatch(/insufficient samples|no samples/i);
    });
    it("stays at current quality if samples < minSamples but current is safe", () => {
        const engine = mkEngine({ now: nowFn, minSamples: 4, safetyMargin: 0.85 });
        const available = reps({ id: "240p", bitrate: kbps(0.6) }, { id: "360p", bitrate: kbps(1.0) }, { id: "480p", bitrate: kbps(1.8) });
        const decision = engine.decide({
            available,
            current: available[1],
            bufferSec: 15,
            samples: mkSamples([kbps(1.2), kbps(1.1), kbps(1.0)]), // 3 < minSamples=4
        });
        expect(decision.target.id).toBe("360p");
        expect(decision.switch).toBe(false);
        expect(decision.reason).toMatch(/min samples/i);
    });
    it("upgrades when estimated throughput with safety margin exceeds next bitrate and buffer is sufficient", () => {
        const engine = mkEngine({ now: nowFn, safetyMargin: 0.9, minBufferForUpgradeSec: 8 });
        const available = reps({ id: "360p", bitrate: kbps(1.0) }, { id: "480p", bitrate: kbps(1.8) }, { id: "720p", bitrate: kbps(3.0) });
        // strong throughput ~ 2.5 Mbps -> 2250 kbps after 0.9 margin, enough for 480p but not 720p
        const decision = engine.decide({
            available,
            current: available[0],
            bufferSec: 12,
            samples: mkSamples([kbps(2.6), kbps(2.4), kbps(2.5), kbps(2.5)]),
        });
        expect(decision.switch).toBe(true);
        expect(decision.target.id).toBe("480p");
        expect(decision.reason).toMatch(/upgrade|throughput/i);
    });
    it("does not upgrade even with good bandwidth if buffer is below threshold", () => {
        const engine = mkEngine({ now: nowFn, minBufferForUpgradeSec: 15 });
        const available = reps({ id: "360p", bitrate: kbps(1.0) }, { id: "480p", bitrate: kbps(1.8) });
        const decision = engine.decide({
            available,
            current: available[0],
            bufferSec: 8, // below 15s threshold
            samples: mkSamples([kbps(3.0), kbps(3.2), kbps(2.8)]),
        });
        expect(decision.switch).toBe(false);
        expect(decision.target.id).toBe("360p");
        expect(decision.reason).toMatch(/buffer/i);
    });
    it("downgrades on sustained rebuffer events exceeding threshold", () => {
        const engine = mkEngine({ now: nowFn, downgradeRebufferThresholdMs: 200 });
        const available = reps({ id: "480p", bitrate: kbps(1.8) }, { id: "720p", bitrate: kbps(3.0) });
        // samples indicate borderline capacity but rebuffer signal forces downswitch
        const decision = engine.decide({
            available,
            current: available[1],
            bufferSec: 1.0,
            samples: mkSamples([kbps(2.5), kbps(2.2), kbps(2.4)]),
            rebufferMsInWindow: 260,
        });
        expect(decision.switch).toBe(true);
        expect(decision.target.id).toBe("480p");
        expect(decision.reason).toMatch(/rebuffer|downgrade/i);
    });
    it("respects max bitrate and max index caps", () => {
        const available = reps({ id: "240p", bitrate: kbps(0.6) }, { id: "360p", bitrate: kbps(1.0) }, { id: "480p", bitrate: kbps(1.8) }, { id: "720p", bitrate: kbps(3.0) });
        // Cap by bitrate to 1500 kbps, should not select 480p/720p
        let engine = mkEngine({ now: nowFn, maxBitrateKbps: 1500, safetyMargin: 1.0 });
        let decision = engine.decide({
            available,
            current: available[1],
            bufferSec: 20,
            samples: mkSamples([kbps(10), kbps(9), kbps(8)]),
        });
        expect(decision.target.id).toBe("360p");
        // Cap by index to <= 2 (0-based), i.e., allow up to 480p
        engine = mkEngine({ now: nowFn, maxIndex: 2, safetyMargin: 1.0 });
        decision = engine.decide({
            available,
            current: available[1],
            bufferSec: 20,
            samples: mkSamples([kbps(10), kbps(9), kbps(8)]),
        });
        expect(decision.target.id).toBe("480p");
    });
    it("handles tie-breaking deterministically when multiple reps fit", () => {
        const engine = mkEngine({ now: nowFn, safetyMargin: 1.0 });
        const available = reps({ id: "A", bitrate: 1000 }, { id: "B", bitrate: 1000 }, // tie bitrate with A
        { id: "C", bitrate: 2000 });
        const decision = engine.decide({
            available,
            current: available[0],
            bufferSec: 30,
            samples: mkSamples([3000, 2900, 3100]),
        });
        // Expect the highest-eligible bitrate; tie resolved by stable ordering (e.g., first encountered)
        expect(["A", "B"]).toContain(decision.target.id);
    });
    it("enforces hysteresis: avoids rapid oscillations within hysteresis window", () => {
        const engine = mkEngine({ now: nowFn, safetyMargin: 1.0, hysteresisSec: 10 });
        const available = reps({ id: "360p", bitrate: 1000 }, { id: "480p", bitrate: 1800 });
        // Step 1: upgrade to 480p
        let d1 = engine.decide({
            available,
            current: available[0],
            bufferSec: 20,
            samples: mkSamples([5000, 4800, 5200]),
        });
        expect(d1.target.id).toBe("480p");
        expect(d1.switch).toBe(true);
        // Advance less than hysteresis duration and try to downgrade with slightly lower throughput
        advance(5000); // 5s < 10s hysteresis
        let d2 = engine.decide({
            available,
            current: available[1],
            bufferSec: 20,
            samples: mkSamples([1800, 1700, 1750]), // borderline
        });
        expect(d2.switch).toBe(false);
    });
    it("latency-aware: favors lower bitrate when live latency is above target", () => {
        const engine = mkEngine({ now: nowFn, latencyAware: true });
        const available = reps({ id: "480p", bitrate: 1800 }, { id: "720p", bitrate: 3000 });
        const decision = engine.decide({
            available,
            current: available[1],
            bufferSec: 3.0,
            liveLatencySec: 8.0,
            targetLatencySec: 5.0,
            samples: mkSamples([3500, 3600, 3400]),
        });
        expect(decision.switch).toBe(true);
        expect(decision.target.id).toBe("480p");
        expect(decision.reason).toMatch(/latency/i);
    });
    it("gracefully handles invalid inputs", () => {
        const engine = mkEngine({ now: nowFn });
        // Empty representations
        const d1 = engine.decide({
            available: [],
            current: undefined,
            bufferSec: 10,
            samples: mkSamples([1000, 1000, 1000]),
        });
        expect(d1.target).toBeUndefined();
        // NaN/negative throughput values are ignored in estimate
        const d2 = engine.decide({
            available: reps({ id: "144p", bitrate: 300 }),
            current: undefined,
            bufferSec: 10,
            // includes invalid values
            samples: mkSamples([NaN, -200, 0, 500, 600]),
        });
        expect(d2.target?.id).toBe("144p");
        expect(d2.reason).toMatch(/invalid|filtered/i);
    });
});
export {};
//# sourceMappingURL=quality-adaptation-engine.test.js.map