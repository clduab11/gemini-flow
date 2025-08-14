/**
 * Simple MCP Bridge (Fallback Implementation)
 *
 * Minimal implementation for environments where full MCP protocol is not available
 */

import { Logger } from "../utils/logger.js";
import { TopologyType } from "./protocol-activator.js";

export class SimpleMCPBridge {
  private logger: Logger;
  private initialized = false;
  private topology: TopologyType;

  constructor(options: { topology: TopologyType }) {
    this.logger = new Logger("SimpleMCPBridge");
    this.topology = options.topology;
  }

  async initialize(): Promise<void> {
    this.logger.info(
      `Simple MCP bridge initialized (fallback mode) with ${this.topology} topology`,
    );
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async bridge(request: any): Promise<any> {
    this.logger.debug("MCP request bridged (no-op in fallback mode)", {
      request,
    });
    return { status: "fallback", message: "MCP not available" };
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
  }
}
