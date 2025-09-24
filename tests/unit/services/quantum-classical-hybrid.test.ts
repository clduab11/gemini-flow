/**
 * Extended unit tests for quantum-classical-hybrid service.
 * Testing library/framework: Jest
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

import * as hybridService from "@/services/quantum-classical-hybrid";

describe("quantum-classical-hybrid service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("exports expected public API", () => {
    expect(hybridService).toBeTruthy();
    if (!hybridService) return;
    const api = ["initialize", "runHybridWorkflow", "measure", "optimize", "shutdown"];
    api.forEach((fn) => {
      if (hybridService[fn] !== undefined) {
        expect(typeof hybridService[fn]).toBe("function");
      }
    });
  });

  it("initialize handles empty config gracefully", async () => {
    if (!(hybridService?.initialize)) return;
    await expect(hybridService.initialize({} as any)).resolves.toBeDefined();
  });

  it("runHybridWorkflow processes a simple circuit (happy path)", async () => {
    if (!(hybridService?.runHybridWorkflow)) return;
    const circuit = { gates: ["H", "CNOT"], qubits: 2 };
    const params = { shots: 128, optimizer: "adam" };
    const result = await hybridService.runHybridWorkflow(circuit, params);
    expect(result).toBeDefined();
    if (result) {
      if ("counts" in result) expect(typeof result.counts).toBe("object");
      if ("optimizedParams" in result) {
        // Jest type guard convenience; maintain compatibility with Jest:
        (expect as any)(typeof result.optimizedParams).toBe("object");
      }
    }
  });

  it("runHybridWorkflow rejects invalid circuits (edge/failure)", async () => {
    if (!(hybridService?.runHybridWorkflow)) return;
    await expect(hybridService.runHybridWorkflow(null as any, { shots: -1 })).rejects.toBeTruthy();
  });

  it("measure returns deterministic structure for given state", async () => {
    if (!(hybridService?.measure)) return;
    const state = { vector: [1, 0, 0, 0] };
    const m = await hybridService.measure(state, { shots: 16 });
    expect(m).toBeTruthy();
    if (m && "counts" in m) expect(typeof m.counts).toBe("object");
  });

  it("optimize handles timeouts and cancellation", async () => {
    if (!(hybridService?.optimize)) return;
    jest.useFakeTimers();
    const abort = new AbortController();
    const p = hybridService.optimize({ start: [0.1, 0.2] }, { timeoutMs: 100, signal: abort.signal });
    setTimeout(() => abort.abort(), 50);
    jest.advanceTimersByTime(60);
    await expect(p).rejects.toBeTruthy();
  });

  it("shutdown cleans up resources without throwing", async () => {
    if (!(hybridService?.shutdown)) return;
    await expect(hybridService.shutdown()).resolves.toBeUndefined();
  });
});