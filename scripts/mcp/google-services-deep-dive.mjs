#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.mcp.local') });

const TARGETS = [
  { key: 'Imagen4', focus: ['site:cloud.google.com/vertex-ai/generative-ai/docs image generation', 'site:cloud.google.com vertex ai text-to-image rest', 'site:cloud.google.com vertex ai generate images'], alt: ['developers.generativeai.google image api'] },
  { key: 'Veo3', focus: ['site:cloud.google.com/vertex-ai/generative-ai/docs video generation', 'site:cloud.google.com vertex ai text-to-video rest', 'site:cloud.google.com vertex ai generative video'], alt: ['ai.google veo video'] },
  { key: 'Streaming API', focus: ['site:cloud.google.com/vertex-ai/generative-ai/docs realtime api', 'site:cloud.google.com vertex ai streaming websocket', 'site:cloud.google.com vertex ai realtime'], alt: ['developers.generativeai.google realtime websocket'] },
];

const FALLBACK_DOCS = {
  'Imagen4': [
    'https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview',
    'https://cloud.google.com/vertex-ai/generative-ai/docs/image/text-image',
  ],
  'Veo3': [
    'https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview',
  ],
  'Streaming API': [
    'https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/realtime',
  ],
};

function isOfficial(u) {
  const h = (u||'').toLowerCase();
  return h.includes('cloud.google.com') || h.includes('developers.generativeai.google') || h.includes('ai.google');
}

function mdEsc(s){ return (s||'').replace(/\|/g,'\\|'); }

async function searchOfficialDocs(query) {
  const transport = new StdioClientTransport({ command: 'npx', args: ['-y', 'mcp-omnisearch'], stderr: 'pipe', env: process.env });
  const client = new Client({ name: 'gs-deep-dive-search', version: '1.0.0' });
  await client.connect(transport, { timeout: 25000 });
  try {
    const r = await client.callTool({ name: 'tavily_search', arguments: { query, max_results: 8 } });
    const items = (r?.result?.items || r?.items || []).map(it => ({ title: it.title || it.name || it.url, url: it.url || it.link || '' }));
    return items.filter(x => isOfficial(x.url));
  } finally {
    await client.close();
  }
}

async function createPuppeteerClient() {
  const transport = new StdioClientTransport({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'], stderr: 'pipe', env: process.env });
  const client = new Client({ name: 'gs-deep-dive-puppeteer', version: '1.0.0' });
  await client.connect(transport, { timeout: 60000 });
  return client;
}

async function extractFromPageWithClient(client, url){
  try {
    // Navigate with timeout guard
    const nav = client.callTool({ name: 'puppeteer_navigate', arguments: { url } });
    await Promise.race([
      nav,
      new Promise((_, rej) => setTimeout(() => rej(new Error('navigate timeout')), 30000)),
    ]);
    // Extract text and code blocks with guards
    const pageText = await Promise.race([
      client.callTool({ name: 'puppeteer_evaluate', arguments: { script: '() => document.body.innerText' } }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('innerText timeout')), 20000)),
    ]);
    const codeBlocks = await Promise.race([
      client.callTool({ name: 'puppeteer_evaluate', arguments: { script: `() => Array.from(document.querySelectorAll('pre, code')).map(n => n.innerText).slice(0,80)` } }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('code scrape timeout')), 20000)),
    ]);
    const text = pageText?.result || '';
    const codes = (codeBlocks?.result || []).map(x => (x||'').trim()).filter(Boolean);

    // Pull endpoints and curl/node samples
    const endpointRe = /(https?:\/\/[a-z0-9.-]*googleapis\.com[^\s"'<>]*)/gi;
    const endpoints = [];
    let m; while((m = endpointRe.exec(text))!==null){ endpoints.push(m[1]); }
    codes.forEach(c => { let km; while((km = endpointRe.exec(c))!==null){ endpoints.push(km[1]); }});

    const curlSamples = codes.filter(c => /\bcurl\b/i.test(c) && /googleapis\.com/i.test(c)).slice(0,2);
    const nodeSamples = codes.filter(c => /(node|javascript)/i.test(c) && /googleapis|aiplatform|generative/i.test(c)).slice(0,2);
    const grpcHints = text.match(/gRPC|grpc\s+method|rpc\s+/gi) || [];

    // Auth & rate limits
    const auth = (/application default credentials|gcloud auth|service account|oauth/i.test(text) ? 'Google Cloud OAuth2 / Service Accounts / ADC' : 'See docs — likely Google Cloud auth');
    const quotas = (text.match(/quota|rate limit|requests per|qps|rpm/gi) || []).length ? 'Published quotas present on page' : 'No explicit quotas detected on page';

    // API versions
    const versions = Array.from(new Set((text.match(/\bv1(beta\d?)?\b/gi) || []).map(s => s.toLowerCase())));

    return {
      url,
      endpoints: Array.from(new Set(endpoints)).slice(0, 12),
      curlSamples,
      nodeSamples,
      grpcMentioned: grpcHints.length > 0,
      auth,
      quotas,
      versions
    };
  } catch (e) {
    return { url, error: String(e) };
  }
}

async function deepDiveOne(target){
  // Gather a few official pages
  const queries = [...target.focus, ...(target.alt||[])];
  const found = [];
  for (const q of queries) {
    try{
      const items = await searchOfficialDocs(q);
      for (const it of items) if (!found.find(f => f.url===it.url)) found.push(it);
    }catch{}
    if (found.length >= 6) break;
  }

  // Scrape top 3-4 pages
  let picks = found.slice(0,4);
  if (picks.length === 0) {
    const fb = (FALLBACK_DOCS[target.key]||[]).map(u => ({ title: u, url: u }));
    picks = fb.slice(0,4);
  }
  const extracts = [];
  const pClient = await createPuppeteerClient();
  try {
    for (const it of picks) {
      const e = await extractFromPageWithClient(pClient, it.url);
      extracts.push(e);
    }
  } finally {
    try { await pClient.close(); } catch {}
  }

  // Merge endpoints, versions, pick best samples
  const allEndpoints = Array.from(new Set(extracts.flatMap(x => x.endpoints||[])));
  const versions = Array.from(new Set(extracts.flatMap(x => x.versions||[])));
  const curl = extracts.flatMap(x => x.curlSamples||[]).slice(0,2);
  const node = extracts.flatMap(x => x.nodeSamples||[]).slice(0,2);
  const auth = extracts.find(x => x.auth)?.auth || 'See docs';
  const quotas = extracts.find(x => x.quotas)?.quotas || 'See docs';
  const refs = picks.map(p => `- ${mdEsc(p.title||p.url)}: ${p.url}`).join('\n');

  return { service: target.key, refs, endpoints: allEndpoints, versions, auth, quotas, curl, node };
}

function suggestSdkImports(service){
  // Recommend SDKs for realistic implementation
  switch(service){
    case 'Imagen4':
    case 'Veo3':
      return ['@google-cloud/aiplatform'];
    case 'Streaming API':
      return ['@google-cloud/aiplatform', '@google/generative-ai'];
    default:
      return ['@google-cloud/aiplatform'];
  }
}

async function run(){
  const results = [];
  for (const t of TARGETS) {
    const r = await deepDiveOne(t);
    results.push(r);
  }

  const docPath = path.join(process.cwd(), 'docs', 'GOOGLE_SERVICES_RESEARCH_SEP2025.md');
  const existing = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : '# Google AI Services – Research (September 2025)\n\n';
  const lines = [];
  lines.push('', '---', '## 🧩 Implementation Guides (Verified)');
  lines.push('', '_Puppeteer-verified extracts from official docs. Always confirm with latest docs before deployment._', '');

  for (const r of results) {
    lines.push(`### ${r.service}`);
    lines.push('**Official References:**');
    lines.push(r.refs || '- (none)');
    if (r.endpoints?.length) {
      lines.push('', '**Endpoints (googleapis.com):**');
      r.endpoints.slice(0,10).forEach(e => lines.push(`- ${e}`));
    }
    if (r.versions?.length) {
      lines.push('', `**API Versions Detected:** ${r.versions.join(', ')}`);
    }
    lines.push('', `**Authentication:** ${r.auth}`);
    lines.push('', `**Rate Limits/Quotas:** ${r.quotas}`);
    if (r.curl?.length) {
      lines.push('', '**cURL Example(s):**');
      r.curl.forEach((c, i) => lines.push('```bash', c, '```'));
    }
    if (r.node?.length) {
      lines.push('', '**Node.js Example(s):**');
      r.node.forEach((c, i) => lines.push('```js', c, '```'));
    }
    const sdk = suggestSdkImports(r.service);
    lines.push('', `**Recommended SDK Imports:** ${sdk.join(', ')}`, '');
  }

  // Append implementation guide
  fs.writeFileSync(docPath, existing + '\n' + lines.join('\n'));
  console.log('Updated', docPath);
}

run().catch(e => { console.error(e); process.exit(1); });
