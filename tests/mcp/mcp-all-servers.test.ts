import { mcp } from "../../src/mcp/mcp-client-wrapper.js";
import path from "node:path";

jest.setTimeout(60000);

beforeAll(async () => {
  process.env.MCP_SERVERS_CONFIG = path.join(process.cwd(), ".mcp-config.json");
  await mcp.connectAllFromConfig(process.env.MCP_SERVERS_CONFIG);
});

afterAll(async () => {
  await mcp.closeAll();
});

test("All servers list tools", async () => {
  const names = [
    "Redis",
    "Git Tools",
    "Puppeteer",
    "Sequential Thinking",
    "Filesystem",
    "GitHub",
    "Mem0",
    "Supabase",
    "mcp-omnisearch",
  ];
  for (const name of names) {
    const tools = await mcp.listTools(name);
    expect(Array.isArray(tools.tools)).toBe(true);
  }
});

test("Redis set/get roundtrip", async () => {
  const key = `mcp_test_${Date.now()}`;
  await mcp.callTool("Redis", "set", { key, value: "1" });
  const res = await mcp.callTool("Redis", "get", { key });
  const value = res?.result?.value ?? res?.value;
  expect(value).toBeDefined();
});

test("Filesystem list_directory current repo", async () => {
  const res = await mcp.callTool("Filesystem", "list_directory", { path: process.cwd() });
  const items = res.items || res.result?.items;
  expect(Array.isArray(items)).toBe(true);
});

test("Omnisearch tavily_search", async () => {
  const res = await mcp.callTool("mcp-omnisearch", "tavily_search", { query: "gemini-flow" });
  expect(res).toBeTruthy();
});

