#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.mcp.local') });

const services = [
  { key: 'AgentSpace', q: 'Google AgentSpace collaborative AI workspace September 2025 site:google.com OR site:ai.google' },
  { key: 'Co-Scientist', q: 'Google Co-Scientist research AI September 2025 site:google.com OR site:ai.google' },
  { key: 'Project Mariner', q: 'Google Project Mariner web automation September 2025 site:google.com OR site:ai.google' },
  { key: 'Lyria', q: 'Google Lyria music generation September 2025 site:google.com OR site:ai.google' },
  { key: 'Chirp', q: 'Google Chirp speech synthesis September 2025 site:google.com OR site:ai.google' },
  { key: 'Veo3', q: 'Google Veo 3 video generation September 2025 site:google.com OR site:ai.google' },
  { key: 'Imagen4', q: 'Google Imagen 4 image generation September 2025 site:google.com OR site:ai.google' },
  { key: 'Multi-modal Streaming', q: 'Google multimodal streaming API latency throughput September 2025 site:google.com OR site:ai.google' }
];

function normalizeItems(result) {
  // mcp-omnisearch often returns { content: [{ type: 'text', text: JSON-string }] }
  let items = result?.result?.items || result?.items || [];
  if ((!items || items.length === 0) && Array.isArray(result?.content) && result.content.length > 0) {
    const txt = result.content[0]?.text;
    try {
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed)) items = parsed;
    } catch {}
  }
  return (items || []).map((it) => ({
    title: it.title || it.name || it.url || 'Untitled',
    url: it.url || it.link || '',
    snippet: it.snippet || it.content || it.description || ''
  }));
}

function mdEscape(s) { return s.replace(/\|/g, '\\|'); }

async function main() {
  const transport = new StdioClientTransport({ command: 'npx', args: ['-y', 'mcp-omnisearch'], stderr: 'pipe', env: process.env });
  const client = new Client({ name: 'google-services-research', version: '1.0.0' });
  await client.connect(transport, { timeout: 20000 });

  const sectionResults = [];
  const debugDump = {};
  for (const srv of services) {
    const res = await client.callTool({ name: 'tavily_search', arguments: { query: srv.q, max_results: 5 } });
    debugDump[srv.key] = res;
    const items = normalizeItems(res).slice(0, 5);
    sectionResults.push({ service: srv.key, items });
  }

  const lines = [];
  lines.push('# Google AI Services – Research (September 2025)');
  lines.push('');
  lines.push('This report aggregates public information via MCP Omnisearch (Tavily). Validate details against official Google sources before relying in production.');
  lines.push('');
  for (const sec of sectionResults) {
    lines.push(`## ${sec.service}`);
    for (const it of sec.items) {
      const title = mdEscape(it.title || 'Untitled');
      const url = it.url || '';
      const snippet = (it.snippet || '').trim().slice(0, 380);
      lines.push(`- [${title}](${url})`);
      if (snippet) lines.push(`  - ${snippet}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('Notes:');
  lines.push('- Include API endpoints, auth, and pricing after validating vendor docs.');
  lines.push('- Mark services as production/preview based on official release notes.');

  const outPath = path.join(process.cwd(), 'docs', 'GOOGLE_SERVICES_RESEARCH_SEP2025.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n')); 
  console.log('Wrote', outPath);

  const debugPath = path.join(process.cwd(), 'docs', '.omnisearch-debug.json');
  fs.writeFileSync(debugPath, JSON.stringify(debugDump, null, 2));

  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
