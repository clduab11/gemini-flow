/**
 * MCP Server Manager
 * Manages lifecycle of MCP servers
 */

import { EventEmitter } from 'events';
import {
  MCPServerConfig,
  MCPServerStatus,
  MCPServerInfo
} from './types.js';

export class MCPServerManager extends EventEmitter {
  private servers: Map<string, MCPServerInfo> = new Map();

  /**
   * Register MCP server
   */
  registerServer(config: MCPServerConfig): void {
    const info: MCPServerInfo = {
      name: config.name,
      status: MCPServerStatus.STOPPED,
      config
    };

    this.servers.set(config.name, info);
    console.log(`[MCP] Registered server: ${config.name}`);
    this.emit('server:registered', info);
  }

  /**
   * Start MCP server (stub - actual implementation would spawn process)
   */
  async startServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server not found: ${name}`);
    }

    if (server.status === MCPServerStatus.RUNNING) {
      console.log(`[MCP] Server already running: ${name}`);
      return;
    }

    server.status = MCPServerStatus.STARTING;
    this.emit('server:starting', server);

    try {
      // In production, this would:
      // 1. Spawn process using server.config.command and args
      // 2. Set up IPC/stdio communication
      // 3. Wait for server ready signal
      // 4. Store process PID

      // Simulated startup
      await new Promise(resolve => setTimeout(resolve, 100));

      server.status = MCPServerStatus.RUNNING;
      server.pid = Math.floor(Math.random() * 100000); // Simulated PID
      server.uptime = 0;

      console.log(`[MCP] Server started: ${name}`);
      this.emit('server:started', server);
    } catch (error: any) {
      server.status = MCPServerStatus.ERROR;
      server.lastError = error.message;

      console.error(`[MCP] Failed to start server ${name}:`, error.message);
      this.emit('server:error', { server, error });

      throw error;
    }
  }

  /**
   * Stop MCP server
   */
  async stopServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server not found: ${name}`);
    }

    if (server.status === MCPServerStatus.STOPPED) {
      console.log(`[MCP] Server already stopped: ${name}`);
      return;
    }

    // In production, would terminate the process
    server.status = MCPServerStatus.STOPPED;
    server.pid = undefined;
    server.uptime = undefined;

    console.log(`[MCP] Server stopped: ${name}`);
    this.emit('server:stopped', server);
  }

  /**
   * Restart MCP server
   */
  async restartServer(name: string): Promise<void> {
    await this.stopServer(name);
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.startServer(name);
  }

  /**
   * Start all registered servers
   */
  async startAll(): Promise<void> {
    const servers = Array.from(this.servers.values());
    const enabledServers = servers.filter(s => s.config.enabled !== false);

    console.log(`[MCP] Starting ${enabledServers.length} servers...`);

    for (const server of enabledServers) {
      try {
        await this.startServer(server.name);
      } catch (error) {
        console.error(`[MCP] Failed to start ${server.name}, continuing...`);
      }
    }

    console.log('[MCP] All servers started');
  }

  /**
   * Stop all running servers
   */
  async stopAll(): Promise<void> {
    const servers = Array.from(this.servers.values());
    const runningServers = servers.filter(s => s.status === MCPServerStatus.RUNNING);

    console.log(`[MCP] Stopping ${runningServers.length} servers...`);

    for (const server of runningServers) {
      try {
        await this.stopServer(server.name);
      } catch (error) {
        console.error(`[MCP] Failed to stop ${server.name}, continuing...`);
      }
    }

    console.log('[MCP] All servers stopped');
  }

  /**
   * Get server info
   */
  getServer(name: string): MCPServerInfo | undefined {
    return this.servers.get(name);
  }

  /**
   * Get all servers
   */
  getAllServers(): MCPServerInfo[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get running servers
   */
  getRunningServers(): MCPServerInfo[] {
    return Array.from(this.servers.values()).filter(
      s => s.status === MCPServerStatus.RUNNING
    );
  }

  /**
   * Check if server is running
   */
  isRunning(name: string): boolean {
    const server = this.servers.get(name);
    return server?.status === MCPServerStatus.RUNNING;
  }

  /**
   * Get server count by status
   */
  getServerCountByStatus(): Record<MCPServerStatus, number> {
    const counts = {
      [MCPServerStatus.STOPPED]: 0,
      [MCPServerStatus.STARTING]: 0,
      [MCPServerStatus.RUNNING]: 0,
      [MCPServerStatus.ERROR]: 0
    };

    for (const server of this.servers.values()) {
      counts[server.status]++;
    }

    return counts;
  }

  /**
   * Clear all servers
   */
  clear(): void {
    this.servers.clear();
    this.removeAllListeners();
    console.log('[MCP] Cleared all servers');
  }
}

/**
 * Load MCP servers from gemini-extension.json
 */
export function loadMCPServersFromConfig(configPath: string): MCPServerConfig[] {
  try {
    // In production, would read from file
    // For now, return hardcoded configuration
    return [
      {
        name: 'Redis',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-redis', 'redis://localhost:6379'],
        description: 'Redis MCP server for key-value storage and caching',
        enabled: true
      },
      {
        name: 'Sequential Thinking',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        description: 'Sequential thinking and planning MCP server',
        enabled: true
      },
      {
        name: 'Filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.env.HOME || '/tmp'],
        description: 'Filesystem operations MCP server',
        enabled: true
      },
      {
        name: 'GitHub',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ''
        },
        description: 'GitHub integration MCP server',
        enabled: !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN
      },
      {
        name: 'Memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        description: 'Memory management MCP server',
        enabled: true
      }
    ];
  } catch (error) {
    console.error('[MCP] Failed to load config:', error);
    return [];
  }
}
