import { WasmNeuralEngine } from '../neural/wasm-engine';
/**
 * @interface WasmManagerConfig
 * @description Configuration for the WASM Performance Manager.
 */
export interface WasmManagerConfig {
    maxWorkers: number;
    memoryAllocationStrategy: 'shared' | 'dedicated';
}
/**
 * @interface WasmManagerOperations
 * @description Defines operations for managing WASM module lifecycle and optimization.
 */
export interface WasmManagerOperations {
    loadWasmModule(modulePath: string): Promise<WebAssembly.Module>;
    executeWasmFunction(module: WebAssembly.Module, functionName: string, args: any[]): Promise<any>;
    offloadTaskToWasm(taskData: any): Promise<any>;
    profileWasmModule(module: WebAssembly.Module, durationSeconds: number): Promise<any>;
    autoScaleWasmWorkers(demand: number): Promise<void>;
}
/**
 * @class WasmPerformanceManager
 * @description Manages WebAssembly module lifecycle, memory, and task offloading for performance enhancement.
 */
export declare class WasmPerformanceManager implements WasmManagerOperations {
    private config;
    private logger;
    private wasmEngine;
    private loadedModules;
    constructor(config: WasmManagerConfig, wasmEngine: WasmNeuralEngine);
    /**
     * Loads a WebAssembly module.
     * @param {string} modulePath The path to the WASM binary or WAT file.
     * @returns {Promise<WebAssembly.Module>} The loaded WebAssembly module.
     */
    loadWasmModule(modulePath: string): Promise<WebAssembly.Module>;
    /**
     * Executes a function within a loaded WebAssembly module.
     * @param {WebAssembly.Module} module The loaded WASM module.
     * @param {string} functionName The name of the function to execute.
     * @param {any[]} args Arguments to pass to the WASM function.
     * @returns {Promise<any>} The result of the WASM function execution.
     */
    executeWasmFunction(module: WebAssembly.Module, functionName: string, args: any[]): Promise<any>;
    /**
     * Offloads a CPU-intensive task to a WASM module for accelerated processing.
     * @param {any} taskData The data for the task to offload.
     * @returns {Promise<any>} The result from the WASM-accelerated task.
     */
    offloadTaskToWasm(taskData: any): Promise<any>;
    /**
     * Profiles a WASM module's performance.
     * @param {WebAssembly.Module} module The WASM module to profile.
     * @param {number} durationSeconds The duration for profiling.
     * @returns {Promise<any>} Profiling results.
     */
    profileWasmModule(module: WebAssembly.Module, durationSeconds: number): Promise<any>;
    /**
     * Auto-scales WASM workers based on computational demand (conceptual).
     * @param {number} demand The current computational demand.
     * @returns {Promise<void>}
     */
    autoScaleWasmWorkers(demand: number): Promise<void>;
}
//# sourceMappingURL=wasm-manager.d.ts.map