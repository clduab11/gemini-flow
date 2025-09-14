/**
 * MCP Integration Smoke Test
 * Connects to Filesystem server and lists a directory.
 */

import { mcp } from "../../src/mcp/mcp-client-wrapper.js";
import path from "node:path";

jest.setTimeout(30000);

describe("MCP Integration", () => {
  beforeAll(async () => {
    process.env.MCP_SERVERS_CONFIG = path.join(process.cwd(), ".mcp-config.json");
    await mcp.connectAllFromConfig(process.env.MCP_SERVERS_CONFIG);
  });

  afterAll(async () => {
    await mcp.closeAll();
  });

  it("lists filesystem tools", async () => {
    const tools = await mcp.listTools("Filesystem");
    expect(tools.tools.length).toBeGreaterThan(0);
  });

  it("lists project root via filesystem server", async () => {
    // The Filesystem server is configured with root at ~/Desktop
    const repoPath = path.join(process.cwd());
    const res = await mcp.callTool("Filesystem", "list_directory", { path: repoPath });
    expect(Array.isArray(res.items || res.result?.items)).toBeTruthy();
  });
});

