import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs";
import path from "node:path";

type ServerSpec = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: "inherit" | "pipe" | "overlapped";
};

export class MCPClientWrapper {
  private clients = new Map<string, Client>();
  private transports = new Map<string, StdioClientTransport>();

  async connect(name: string, spec: ServerSpec): Promise<Client> {
    if (this.clients.has(name)) return this.clients.get(name)!;

    const transport = new StdioClientTransport({
      command: spec.command,
      args: spec.args ?? [],
      env: { ...process.env, ...(spec.env ?? {}) },
      stderr: spec.stderr ?? "inherit",
      cwd: spec.cwd,
    });

    const client = new Client({ name: `gemini-flow:${name}`, version: "1.0.0" });
    await client.connect(transport, { timeout: 20000 });
    this.clients.set(name, client);
    this.transports.set(name, transport);
    return client;
  }

  async connectAllFromConfig(configPath = path.join(process.cwd(), ".mcp-config.json")) {
    const raw = fs.readFileSync(configPath, "utf8");
    const json = JSON.parse(raw);
    const servers: Record<string, ServerSpec> = json.mcpServers || {};
    for (const [name, spec] of Object.entries(servers)) {
      await this.connect(name, spec);
    }
  }

  getClient(name: string): Client | undefined {
    return this.clients.get(name);
  }

  async listTools(name: string) {
    const client = this.clients.get(name);
    if (!client) throw new Error(`MCP client not connected: ${name}`);
    return client.listTools();
  }

  async callTool(name: string, tool: string, args?: any) {
    const client = this.clients.get(name);
    if (!client) throw new Error(`MCP client not connected: ${name}`);
    return client.callTool({ name: tool, arguments: args ?? {} });
  }

  async closeAll() {
    for (const client of this.clients.values()) {
      try { await client.close(); } catch {}
    }
    this.clients.clear();
    this.transports.clear();
  }
}

export const mcp = new MCPClientWrapper();

