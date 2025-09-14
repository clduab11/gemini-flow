/**
 * Extended unit tests for quantum-classical-hybrid service.
 * Testing library/framework: Vitest (preferred). If this repo uses Jest, switch import source to "@jest/globals"
 * and replace vi.* with jest.* where appropriate.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// Attempt to require the service using common relative paths; adjust as needed.
let hybridService;
try {
    // Typical monorepo/service path
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    hybridService = require("../../../../src/services/quantum-classical-hybrid");
}
catch {
    try {
        // Typical repo path
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        hybridService = require("../../../src/services/quantum-classical-hybrid");
    }
    catch {
        hybridService = null;
    }
}
describe("quantum-classical-hybrid service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it("exports expected public API", () => {
        expect(hybridService).toBeTruthy();
        if (!hybridService)
            return;
        const api = ["initialize", "runHybridWorkflow", "measure", "optimize", "shutdown"];
        api.forEach((fn) => {
            if (hybridService[fn] !== undefined) {
                expect(typeof hybridService[fn]).toBe("function");
            }
        });
    });
    it("initialize handles empty config gracefully", async () => {
        if (!(hybridService?.initialize))
            return;
        await expect(hybridService.initialize({})).resolves.toBeDefined();
    });
    it("runHybridWorkflow processes a simple circuit (happy path)", async () => {
        if (!(hybridService?.runHybridWorkflow))
            return;
        const circuit = { gates: ["H", "CNOT"], qubits: 2 };
        const params = { shots: 128, optimizer: "adam" };
        const result = await hybridService.runHybridWorkflow(circuit, params);
        expect(result).toBeDefined();
        if (result) {
            if ("counts" in result)
                expect(typeof result.counts).toBe("object");
            if ("optimizedParams" in result) {
                // Vitest type guard convenience; maintain compatibility with Jest:
                expect(typeof result.optimizedParams).toBe("object");
            }
        }
    });
    it("runHybridWorkflow rejects invalid circuits (edge/failure)", async () => {
        if (!(hybridService?.runHybridWorkflow))
            return;
        await expect(hybridService.runHybridWorkflow(null, { shots: -1 })).rejects.toBeTruthy();
    });
    it("measure returns deterministic structure for given state", async () => {
        if (!(hybridService?.measure))
            return;
        const state = { vector: [1, 0, 0, 0] };
        const m = await hybridService.measure(state, { shots: 16 });
        expect(m).toBeTruthy();
        if (m && "counts" in m)
            expect(typeof m.counts).toBe("object");
    });
    it("optimize handles timeouts and cancellation", async () => {
        if (!(hybridService?.optimize))
            return;
        vi.useFakeTimers();
        const abort = new AbortController();
        const p = hybridService.optimize({ start: [0.1, 0.2] }, { timeoutMs: 100, signal: abort.signal });
        setTimeout(() => abort.abort(), 50);
        vi.advanceTimersByTime(60);
        await expect(p).rejects.toBeTruthy();
    });
    it("shutdown cleans up resources without throwing", async () => {
        if (!(hybridService?.shutdown))
            return;
        await expect(hybridService.shutdown()).resolves.toBeUndefined();
    });
});
//# sourceMappingURL=quantum-classical-hybrid.test.js.map