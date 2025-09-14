#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.mcp.local') });

const SERVICES = [
  { key: 'AgentSpace', queries: [
    'site:cloud.google.com/products/agentspace',
    'site:cloud.google.com agentspace pricing',
    'site:cloud.google.com agentspace authentication'
  ]},
  { key: 'Project Mariner', queries: [
    'site:ai.google project mariner',
    'site:cloud.google.com mariner ai agent',
    'site:developers.google.com mariner'
  ]},
  { key: 'Veo3', queries: [
    'site:cloud.google.com veo video generation Vertex AI',
    'site:ai.google veo 3',
    'site:developers.generativeai.google veo api endpoint'
  ]},
  { key: 'Imagen4', queries: [
    'site:cloud.google.com imagen 4 Vertex AI',
    'site:developers.generativeai.google image generation endpoint',
    'site:ai.google imagen 4'
  ]},
  { key: 'Lyria', queries: [
    'site:ai.google lyria music generation',
    'site:cloud.google.com lyria',
    'site:developers.generativeai.google music generation api'
  ]},
  { key: 'Chirp', queries: [
    'site:ai.google chirp speech',
    'site:cloud.google.com chirp speech generation',
    'site:developers.generativeai.google speech api'
  ]},
  { key: 'Co-Scientist', queries: [
    'site:research.google co-scientist',
    'site:ai.google co-scientist',
    'site:cloud.google.com co-scientist'
  ]},
  { key: 'Streaming API', queries: [
    'site:cloud.google.com Vertex AI streaming realtime API',
    'site:developers.generativeai.google realtime streaming',
    'site:cloud.google.com docs realtime api latency quotas'
  ]},
];

const SERVICE_FILE_MAP = {
  'AgentSpace': ['src/services/google-services/agent-space-manager.ts'],
  'Project Mariner': ['src/services/google-services/mariner-automation.ts'],
  'Veo3': ['src/services/google-services/veo3-video-generator.ts'],
  'Imagen4': ['src/services/google-services/imagen4-generator.ts'],
  'Lyria': ['src/services/google-services/lyria-music-composer.ts'],
  'Chirp': ['src/services/google-services/chirp-audio-processor.ts'],
  'Co-Scientist': ['src/services/google-services/co-scientist-research.ts'],
  'Streaming API': ['src/services/google-services/enhanced-streaming-api.ts', 'src/streaming/enhanced-streaming-api.ts']
};

function pickOfficial(items) {
  return (items || []).filter(it => {
    const u = (it.url || '').toLowerCase();
    return u.includes('cloud.google.com') || u.includes('developers.google.com') || u.includes('ai.google') || u.includes('research.google');
  }).slice(0, 5);
}

function extractCandidates(text) {
  const endpoints = [];
  const re = /(https:\/\/[a-z0-9.-]*googleapis\.com[^\s)"']*)/gi;
  let m; while ((m = re.exec(text)) !== null) endpoints.push(m[1]);
  return Array.from(new Set(endpoints));
}

async function summarizeUrl(client, url) {
  try {
    const res = await client.callTool({ name: 'kagi_summarizer_process', arguments: { url } });
    // Fallback to jina reader if kagi not available
    if (!res?.result) {
      const res2 = await client.callTool({ name: 'jina_reader_process', arguments: { url } });
      return res2?.result?.summary || JSON.stringify(res2?.result || res2 || {});
    }
    return res?.result?.summary || JSON.stringify(res?.result || {});
  } catch (e) {
    return '';
  }
}

async function run() {
  const transport = new StdioClientTransport({ command: 'npx', args: ['-y', 'mcp-omnisearch'], stderr: 'pipe', env: process.env });
  const client = new Client({ name: 'google-services-verify', version: '1.0.0' });
  await client.connect(transport, { timeout: 30000 });

  const verified = [];
  for (const srv of SERVICES) {
    const collected = [];
    for (const q of srv.queries) {
      const r = await client.callTool({ name: 'tavily_search', arguments: { query: q, max_results: 6 } });
      const items = (r?.result?.items || r?.items || []).map(it => ({ title: it.title || it.name || it.url, url: it.url || it.link || '', snippet: it.snippet || it.content || it.description || '' }));
      collected.push(...items);
    }
    // Dedup by URL
    const seen = new Set();
    const deduped = collected.filter(i => i.url && !seen.has(i.url) && seen.add(i.url));
    const officials = pickOfficial(deduped);

    // Summarize a few official pages
    const summaries = [];
    for (const it of officials.slice(0,3)) {
      const sum = await summarizeUrl(client, it.url);
      summaries.push({ url: it.url, summary: sum, endpoints: extractCandidates(sum) });
    }

    // Heuristics for auth/pricing/quotas
    const textBlob = summaries.map(s => s.summary).join('\n');
    const auth = /oauth|oidc|service account|application default credentials|adc/i.test(textBlob) ? 'Google Cloud Auth (OAuth2/IAM/Service Accounts)' : 'Likely Google Cloud authentication (verify)';
    const pricingUrls = officials.filter(i => /pricing/i.test(i.title || '') || /pricing/i.test(i.url)).map(i => i.url);
    const quotas = /quota|rate limit|requests per/i.test(textBlob) ? 'Quotas documented (see links)' : 'No explicit quotas found in summaries (see links)';

    verified.push({
      service: srv.key,
      links: officials,
      endpoints: Array.from(new Set(summaries.flatMap(s => s.endpoints))).slice(0,10),
      auth,
      pricingLinks: pricingUrls.slice(0,3),
      notes: quotas
    });
  }

  // Capability matrix by scanning repo files
  const matrix = [];
  for (const [service, files] of Object.entries(SERVICE_FILE_MAP)) {
    const presentFiles = files.filter(f => fs.existsSync(path.join(process.cwd(), f)));
    let functional = false;
    for (const f of presentFiles) {
      try {
        const content = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
        if (/@google\/generative-ai|@google-cloud\/aiplatform|googleapis|google-auth-library/i.test(content)) {
          functional = true; break;
        }
      } catch {}
    }
    matrix.push({ service, files: presentFiles, status: functional ? 'Functional (uses Google libs)' : 'Conceptual (adapters/examples)', tests: [] });
  }

  // Update docs/GOOGLE_SERVICES_RESEARCH_SEP2025.md
  const docPath = path.join(process.cwd(), 'docs', 'GOOGLE_SERVICES_RESEARCH_SEP2025.md');
  const existing = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : '# Google AI Services – Research (September 2025)\n\n';
  const lines = [];
  lines.push('', '---', '## ✅ Official Verification (Auto-collected)', '', `Verified: ${new Date().toISOString()}`, '');
  for (const v of verified) {
    lines.push(`### ${v.service}`);
    if (v.links.length) {
      lines.push('- Official Links:');
      for (const l of v.links) lines.push(`  - [${l.title || l.url}](${l.url})`);
    }
    if (v.endpoints.length) {
      lines.push('- Candidate API Endpoints:');
      for (const e of v.endpoints) lines.push(`  - ${e}`);
    }
    lines.push(`- Authentication: ${v.auth}`);
    if (v.pricingLinks.length) {
      lines.push('- Pricing:');
      for (const p of v.pricingLinks) lines.push(`  - ${p}`);
    }
    lines.push(`- Notes: ${v.notes}`, '');
  }

  lines.push('', '---', '## 🧭 Capability Matrix (Repo vs Service)');
  lines.push('', '| Service | Code Files | Status |', '|---|---|---|');
  for (const row of matrix) {
    const fileList = row.files.length ? row.files.join('<br />') : '—';
    lines.push(`| ${row.service} | ${fileList} | ${row.status} |`);
  }

  fs.writeFileSync(docPath, existing + '\n' + lines.join('\n'));
  console.log('Updated', docPath);

  await client.close();
}

run().catch(e => { console.error(e); process.exit(1); });

