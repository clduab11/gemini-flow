#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

function log(label, msg) {
  console.log(`[${label}] ${msg}`);
}

async function loadConfig() {
  const configPath = path.join(ROOT, '.mcp-config.json');
  const raw = await readFile(configPath, 'utf8');
  const json = JSON.parse(raw);
  if (!json.mcpServers || typeof json.mcpServers !== 'object') {
    throw new Error('Invalid .mcp-config.json: missing mcpServers');
  }
  return json.mcpServers;
}

function loadEnv() {
  const envPath = path.join(ROOT, '.env.mcp.local');
  dotenv.config({ path: envPath });
}

async function smokeOne(name, spec) {
  const start = Date.now();
  const label = name;
  const command = spec.command;
  const args = Array.isArray(spec.args) ? spec.args : [];

  const transport = new StdioClientTransport({
    command,
    args,
    env: process.env,
    stderr: 'pipe',
  });

  let stderrBuf = '';
  if (transport.stderr) {
    transport.stderr.on('data', (d) => {
      // limit stderr accumulation
      if (stderrBuf.length < 5000) {
        stderrBuf += d.toString();
      }
    });
  }

  const client = new Client({ name: 'gemini-flow-smoke', version: '1.0.0' });
  try {
    await client.connect(transport, { timeout: 15000 });
    const tools = await client.listTools(undefined, { timeout: 15000 });
    const took = Date.now() - start;
    log(label, `PASS in ${took}ms — tools: ${tools.tools.map(t => t.name).slice(0, 5).join(', ')}${tools.tools.length > 5 ? '…' : ''}`);
    await client.close();
    return { name, ok: true };
  } catch (err) {
    const took = Date.now() - start;
    log(label, `FAIL in ${took}ms — ${err?.message || err}`);
    if (stderrBuf) {
      const excerpt = stderrBuf.split('\n').slice(0, 6).join('\n');
      log(label, `stderr excerpt:\n${excerpt}`);
    }
    try { await client.close(); } catch {}
    return { name, ok: false, error: err?.message || String(err) };
  }
}

async function main() {
  loadEnv();
  const servers = await loadConfig();
  const names = Object.keys(servers);
  console.log(`Running MCP smoke-checks for ${names.length} servers...`);

  const results = [];
  for (const name of names) {
    console.log('—'.repeat(60));
    console.log(`Starting ${name} ...`);
    const res = await smokeOne(name, servers[name]);
    results.push(res);
  }

  console.log('—'.repeat(60));
  const passed = results.filter(r => r.ok).length;
  const failed = results.length - passed;
  console.log(`MCP smoke-check complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Smoke-check fatal error:', e);
  process.exit(2);
});

