/**
 * JSON to YAML Conversion Layer
 *
 * Intelligent conversion between JSON and YAML formats with token-awareness.
 * YAML offers superior token efficiency for nested configurations, making it
 * ideal for LLM context windows and configuration management.
 *
 * Token Efficiency Comparison:
 * - JSON: ~100 tokens for typical config
 * - YAML: ~70 tokens for same config
 * - Savings: ~30% token reduction
 *
 * Use Cases:
 * - Service configurations
 * - MCP server definitions
 * - Agent workspace configs
 * - SLA definitions
 * - Nested data structures
 */

import YAML from 'yaml';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Conversion strategy for JSON to YAML
 */
export type ConversionStrategy = 'auto' | 'always' | 'never' | 'threshold';

/**
 * Conversion result with metrics
 */
export interface ConversionResult {
  success: boolean;
  format: 'json' | 'yaml';
  content: string;
  metrics: {
    originalTokens: number;
    convertedTokens: number;
    savings: number;
    savingsPercent: number;
  };
  reason: string;
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  strategy?: ConversionStrategy;
  tokenThreshold?: number; // Min tokens to consider conversion (default: 100)
  savingsThreshold?: number; // Min savings % to convert (default: 20)
  indentSize?: number; // YAML indent size (default: 2)
  preserveComments?: boolean; // Preserve JSON comments if present
  minifyJSON?: boolean; // Minify JSON before comparison
}

/**
 * Token estimation (simplified approximation)
 * Real tokenization would use a proper tokenizer like tiktoken
 */
function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  // More accurate for code/config: ~3.5 characters per token
  const avgCharsPerToken = 3.5;
  return Math.ceil(text.length / avgCharsPerToken);
}

/**
 * YAMLConverter - Intelligent JSON to YAML conversion
 */
export class YAMLConverter extends EventEmitter {
  private options: Required<ConversionOptions>;

  constructor(options: ConversionOptions = {}) {
    super();

    this.options = {
      strategy: options.strategy || 'auto',
      tokenThreshold: options.tokenThreshold || 100,
      savingsThreshold: options.savingsThreshold || 20,
      indentSize: options.indentSize || 2,
      preserveComments: options.preserveComments || false,
      minifyJSON: options.minifyJSON || false,
    };
  }

  /**
   * Convert JSON to YAML with intelligent decision making
   */
  convert(json: any, options?: Partial<ConversionOptions>): ConversionResult {
    const opts = { ...this.options, ...options };

    try {
      // Serialize to JSON
      const jsonString = opts.minifyJSON
        ? JSON.stringify(json)
        : JSON.stringify(json, null, opts.indentSize);

      // Estimate JSON tokens
      const jsonTokens = estimateTokens(jsonString);

      // Strategy: never convert
      if (opts.strategy === 'never') {
        return {
          success: true,
          format: 'json',
          content: jsonString,
          metrics: {
            originalTokens: jsonTokens,
            convertedTokens: jsonTokens,
            savings: 0,
            savingsPercent: 0,
          },
          reason: 'Strategy set to never convert',
        };
      }

      // Strategy: check threshold
      if (opts.strategy === 'threshold' && jsonTokens < opts.tokenThreshold) {
        return {
          success: true,
          format: 'json',
          content: jsonString,
          metrics: {
            originalTokens: jsonTokens,
            convertedTokens: jsonTokens,
            savings: 0,
            savingsPercent: 0,
          },
          reason: `JSON tokens (${jsonTokens}) below threshold (${opts.tokenThreshold})`,
        };
      }

      // Convert to YAML
      const yamlString = YAML.stringify(json, {
        indent: opts.indentSize,
        lineWidth: 0, // No line wrapping
        minContentWidth: 0,
      });

      const yamlTokens = estimateTokens(yamlString);
      const savings = jsonTokens - yamlTokens;
      const savingsPercent = (savings / jsonTokens) * 100;

      // Strategy: always convert
      if (opts.strategy === 'always') {
        return {
          success: true,
          format: 'yaml',
          content: yamlString,
          metrics: {
            originalTokens: jsonTokens,
            convertedTokens: yamlTokens,
            savings,
            savingsPercent,
          },
          reason: 'Strategy set to always convert',
        };
      }

      // Strategy: auto (convert if savings > threshold)
      if (savingsPercent >= opts.savingsThreshold) {
        this.emit('conversion', {
          from: 'json',
          to: 'yaml',
          savings,
          savingsPercent,
        });

        return {
          success: true,
          format: 'yaml',
          content: yamlString,
          metrics: {
            originalTokens: jsonTokens,
            convertedTokens: yamlTokens,
            savings,
            savingsPercent,
          },
          reason: `YAML saves ${savings} tokens (${savingsPercent.toFixed(1)}%)`,
        };
      }

      // Not enough savings, keep JSON
      return {
        success: true,
        format: 'json',
        content: jsonString,
        metrics: {
          originalTokens: jsonTokens,
          convertedTokens: yamlTokens,
          savings,
          savingsPercent,
        },
        reason: `Insufficient savings (${savingsPercent.toFixed(1)}% < ${opts.savingsThreshold}%)`,
      };
    } catch (error) {
      return {
        success: false,
        format: 'json',
        content: JSON.stringify(json, null, opts.indentSize),
        metrics: {
          originalTokens: 0,
          convertedTokens: 0,
          savings: 0,
          savingsPercent: 0,
        },
        reason: `Conversion failed: ${error}`,
      };
    }
  }

  /**
   * Parse YAML or JSON string to object
   */
  parse(content: string, format?: 'json' | 'yaml' | 'auto'): any {
    const detectedFormat = format || this.detectFormat(content);

    try {
      if (detectedFormat === 'yaml') {
        return YAML.parse(content);
      } else {
        return JSON.parse(content);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${detectedFormat}: ${error}`);
    }
  }

  /**
   * Detect format from content
   */
  detectFormat(content: string): 'json' | 'yaml' {
    const trimmed = content.trim();

    // JSON detection
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      return 'json';
    }

    // YAML detection (simple heuristics)
    // YAML typically has key: value pairs without quotes on keys
    if (/^[a-zA-Z_]\w*:/.test(trimmed) || trimmed.includes('\n  ')) {
      return 'yaml';
    }

    // Default to JSON
    return 'json';
  }

  /**
   * Convert file from JSON to YAML
   */
  async convertFile(
    inputPath: string,
    outputPath?: string,
    options?: Partial<ConversionOptions>
  ): Promise<ConversionResult> {
    try {
      // Read input file
      const content = await fs.readFile(inputPath, 'utf-8');
      const ext = path.extname(inputPath).toLowerCase();

      // Parse based on extension
      let data: any;
      if (ext === '.json') {
        data = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        data = YAML.parse(content);
      } else {
        // Try auto-detect
        data = this.parse(content, 'auto');
      }

      // Convert
      const result = this.convert(data, options);

      // Write output if path provided
      if (outputPath && result.success) {
        await fs.writeFile(outputPath, result.content, 'utf-8');

        this.emit('file-converted', {
          input: inputPath,
          output: outputPath,
          format: result.format,
          savings: result.metrics.savings,
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        format: 'json',
        content: '',
        metrics: {
          originalTokens: 0,
          convertedTokens: 0,
          savings: 0,
          savingsPercent: 0,
        },
        reason: `File conversion failed: ${error}`,
      };
    }
  }

  /**
   * Batch convert multiple files
   */
  async convertDirectory(
    dirPath: string,
    outputDir?: string,
    options?: Partial<ConversionOptions>
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile() && /\.(json|yaml|yml)$/.test(file)) {
          const ext = path.extname(file);
          const baseName = path.basename(file, ext);
          const outputPath = outputDir
            ? path.join(outputDir, `${baseName}.yaml`)
            : undefined;

          const result = await this.convertFile(filePath, outputPath, options);
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      this.emit('error', { message: `Directory conversion failed: ${error}` });
      return results;
    }
  }

  /**
   * Get conversion recommendations for a data structure
   */
  analyze(data: any): {
    shouldConvert: boolean;
    jsonTokens: number;
    yamlTokens: number;
    savings: number;
    savingsPercent: number;
    recommendation: string;
  } {
    const result = this.convert(data, { strategy: 'always' });

    return {
      shouldConvert: result.metrics.savingsPercent >= this.options.savingsThreshold,
      jsonTokens: result.metrics.originalTokens,
      yamlTokens: result.metrics.convertedTokens,
      savings: result.metrics.savings,
      savingsPercent: result.metrics.savingsPercent,
      recommendation:
        result.metrics.savingsPercent >= this.options.savingsThreshold
          ? `Convert to YAML for ${result.metrics.savings} token savings (${result.metrics.savingsPercent.toFixed(1)}%)`
          : `Keep as JSON (only ${result.metrics.savingsPercent.toFixed(1)}% savings)`,
    };
  }
}

/**
 * Singleton converter instance
 */
let globalConverter: YAMLConverter | null = null;

/**
 * Get global YAML converter
 */
export function getYAMLConverter(options?: ConversionOptions): YAMLConverter {
  if (!globalConverter) {
    globalConverter = new YAMLConverter(options);
  }
  return globalConverter;
}

/**
 * Quick conversion helper
 */
export function toYAML(data: any, options?: ConversionOptions): string {
  const converter = getYAMLConverter(options);
  const result = converter.convert(data, options);
  return result.content;
}

/**
 * Quick parse helper
 */
export function fromYAML(content: string): any {
  return YAML.parse(content);
}

/**
 * Smart serializer - uses YAML if beneficial, JSON otherwise
 */
export function smartSerialize(data: any, options?: ConversionOptions): string {
  const converter = getYAMLConverter(options);
  const result = converter.convert(data, { strategy: 'auto', ...options });
  return result.content;
}

/**
 * Token-efficient configuration loader
 */
export class ConfigLoader {
  private converter: YAMLConverter;
  private cache = new Map<string, any>();

  constructor(options?: ConversionOptions) {
    this.converter = new YAMLConverter(options);
  }

  /**
   * Load config from file (auto-detects format)
   */
  async load(filePath: string, useCache: boolean = true): Promise<any> {
    if (useCache && this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const format = this.converter.detectFormat(content);
    const data = this.converter.parse(content, format);

    if (useCache) {
      this.cache.set(filePath, data);
    }

    return data;
  }

  /**
   * Save config to file (auto-selects format for efficiency)
   */
  async save(
    filePath: string,
    data: any,
    options?: Partial<ConversionOptions>
  ): Promise<void> {
    const result = this.converter.convert(data, options);

    // Update file extension if format changed
    const ext = path.extname(filePath);
    let outputPath = filePath;

    if (result.format === 'yaml' && ext === '.json') {
      outputPath = filePath.replace(/\.json$/, '.yaml');
    } else if (result.format === 'json' && (ext === '.yaml' || ext === '.yml')) {
      outputPath = filePath.replace(/\.ya?ml$/, '.json');
    }

    await fs.writeFile(outputPath, result.content, 'utf-8');

    // Update cache
    this.cache.set(outputPath, data);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
