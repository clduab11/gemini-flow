/**
 * @interface WasmEngineConfig
 * @description Configuration for the WASM Neural Engine.
 */
export interface WasmEngineConfig {
    simdEnabled: boolean;
    threading: 'multi' | 'single';
    memoryLimit: string;
    optimization: 'speed' | 'size' | 'balanced';
}
/**
 * @interface WasmEngineOperations
 * @description Defines operations for the WASM Neural Engine.
 */
export interface WasmEngineOperations {
    loadModel(modelPath: string): Promise<any>;
    runInference(model: any, inputData: any): Promise<any>;
    compileWasmModule(sourceCode: string): Promise<WebAssembly.Module>;
    optimizeWasmModule(module: WebAssembly.Module): Promise<WebAssembly.Module>;
}
/**
 * @class WasmNeuralEngine
 * @description Provides high-performance neural processing with WebAssembly acceleration.
 */
export declare class WasmNeuralEngine implements WasmEngineOperations {
    private config;
    private logger;
    constructor(config: WasmEngineConfig);
    /**
     * Loads a neural network model into the WASM engine.
     * @param {string} modelPath The path to the model (e.g., URL or local file).
     * @returns {Promise<any>} The loaded model instance.
     */
    loadModel(modelPath: string): Promise<any>;
    /**
     * Runs inference on a loaded neural network model using WASM.
     * @param {any} model The loaded model instance.
     * @param {any} inputData The input data for inference (e.g., tensor).
     * @returns {Promise<any>} The inference result.
     */
    runInference(model: any, inputData: any): Promise<any>;
    /**
     * Compiles WebAssembly source code into a module.
     * @param {string} sourceCode The WebAssembly text format (WAT) or binary code.
     * @returns {Promise<WebAssembly.Module>} The compiled WebAssembly module.
     */
    compileWasmModule(sourceCode: string): Promise<WebAssembly.Module>;
    /**
     * Optimizes a compiled WebAssembly module (conceptual).
     * @param {WebAssembly.Module} module The WebAssembly module to optimize.
     * @returns {Promise<WebAssembly.Module>} The optimized WebAssembly module.
     */
    optimizeWasmModule(module: WebAssembly.Module): Promise<WebAssembly.Module>;
}
//# sourceMappingURL=wasm-engine.d.ts.map