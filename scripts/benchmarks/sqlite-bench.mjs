#!/usr/bin/env node
// Reproducible SQLite benchmark using better-sqlite3
import process from 'node:process';

let Database;
try {
  ({ default: Database } = await import('better-sqlite3'));
} catch (e) {
  console.error('better-sqlite3 not installed. Install with: npm i -D better-sqlite3');
  process.exit(1);
}

const db = new Database(':memory:');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = OFF');

db.exec('CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT)');

const N = parseInt(process.env.BENCH_OPS || '100000', 10);
const start = Date.now();

const insert = db.prepare('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)');
const insertMany = db.transaction((count) => {
  for (let i = 0; i < count; i++) insert.run(`k${i}`, `v${i}`);
});

insertMany(N);

const durationSec = (Date.now() - start) / 1000;
const opsPerSec = Math.floor(N / durationSec);

console.log(JSON.stringify({ ops: N, seconds: durationSec, opsPerSec }, null, 2));

db.close();

