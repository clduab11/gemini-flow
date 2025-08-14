/**
 * Simple A2A Adapter (Fallback Implementation)
 *
 * Minimal implementation for environments where full A2A protocol is not available
 */

import { Logger } from "../utils/logger.js";
import { TopologyType } from "./protocol-activator.js";

export class SimpleA2AAdapter {
  private logger: Logger;
  private initialized = false;
  private topology: TopologyType;

  constructor(options: { topology: TopologyType }) {
    this.logger = new Logger("SimpleA2AAdapter");
    this.topology = options.topology;
  }

  async initialize(): Promise<void> {
    this.logger.info(
      `Simple A2A adapter initialized (fallback mode) with ${this.topology} topology`,
    );
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async send(message: any): Promise<any> {
    this.logger.debug("A2A message sent (no-op in fallback mode)", { message });
    return { status: "fallback", message: "A2A not available" };
  }

  async receive(): Promise<any[]> {
    return [];
  }

  async cleanup(): Promise<void> {
    this.initialized = false;
  }
}
