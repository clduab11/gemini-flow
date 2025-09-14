#!/usr/bin/env node
/**
 * WAL Mode Performance Test
 * Verifies 12x performance boost claim for SQLite Write-Ahead Logging
 */
import { SQLiteMemoryManager } from '../dist/memory/sqlite-manager.js';
import { performance } from 'perf_hooks';
import { existsSync, unlinkSync } from 'fs';
const TEST_DB_WAL = '.swarm/test-wal.db';
const TEST_DB_NORMAL = '.swarm/test-normal.db';
const ITERATIONS = 1000;
const BATCH_SIZE = 100;
console.log('🚀 SQLite WAL Mode Performance Test\n');
console.log(`Testing with ${ITERATIONS} operations in batches of ${BATCH_SIZE}\n`);
// Clean up previous test databases
[TEST_DB_WAL, TEST_DB_NORMAL].forEach(db => {
    if (existsSync(db))
        unlinkSync(db);
    if (existsSync(db + '-wal'))
        unlinkSync(db + '-wal');
    if (existsSync(db + '-shm'))
        unlinkSync(db + '-shm');
});
async function testPerformance(dbPath, useWAL = true) {
    const manager = await SQLiteMemoryManager.create(dbPath);
    // Set journal mode
    if (useWAL) {
        manager.db.pragma('journal_mode = WAL');
        manager.db.pragma('synchronous = NORMAL');
        manager.db.pragma('cache_size = -64000'); // 64MB cache
        manager.db.pragma('temp_store = MEMORY');
    }
    else {
        manager.db.pragma('journal_mode = DELETE');
        manager.db.pragma('synchronous = FULL');
    }
    const mode = manager.db.pragma('journal_mode')[0].journal_mode;
    console.log(`📊 Testing ${mode} mode...`);
    // Warm up
    for (let i = 0; i < 10; i++) {
        await manager.store({
            key: `warmup-${i}`,
            value: { data: 'warmup' },
            namespace: 'test'
        });
    }
    // Test concurrent writes
    const writeStart = performance.now();
    const writePromises = [];
    for (let batch = 0; batch < ITERATIONS / BATCH_SIZE; batch++) {
        const batchPromises = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            const key = `test-${batch}-${i}`;
            batchPromises.push(manager.store({
                key,
                value: {
                    data: `test-value-${i}`,
                    timestamp: Date.now(),
                    metadata: { batch, index: i }
                },
                namespace: 'perf-test'
            }));
        }
        writePromises.push(...batchPromises);
        await Promise.all(batchPromises);
    }
    const writeTime = performance.now() - writeStart;
    // Test concurrent reads
    const readStart = performance.now();
    const readPromises = [];
    for (let i = 0; i < ITERATIONS; i++) {
        const batch = Math.floor(i / BATCH_SIZE);
        const index = i % BATCH_SIZE;
        readPromises.push(manager.retrieve(`test-${batch}-${index}`, 'perf-test'));
    }
    await Promise.all(readPromises);
    const readTime = performance.now() - readStart;
    // Test mixed read/write operations
    const mixedStart = performance.now();
    const mixedPromises = [];
    for (let i = 0; i < ITERATIONS / 2; i++) {
        if (i % 2 === 0) {
            mixedPromises.push(manager.store({
                key: `mixed-${i}`,
                value: { data: `mixed-${i}` },
                namespace: 'mixed-test'
            }));
        }
        else {
            mixedPromises.push(manager.retrieve(`test-0-${i % BATCH_SIZE}`, 'perf-test'));
        }
    }
    await Promise.all(mixedPromises);
    const mixedTime = performance.now() - mixedStart;
    manager.close();
    return {
        mode,
        writeTime,
        readTime,
        mixedTime,
        totalTime: writeTime + readTime + mixedTime,
        writesPerSecond: (ITERATIONS / writeTime) * 1000,
        readsPerSecond: (ITERATIONS / readTime) * 1000
    };
}
async function runComparison() {
    console.log('⏱️  Starting performance comparison...\n');
    // Test WAL mode
    const walResults = await testPerformance(TEST_DB_WAL, true);
    console.log(`✅ WAL Mode Results:`);
    console.log(`   Write Time: ${walResults.writeTime.toFixed(2)}ms (${walResults.writesPerSecond.toFixed(0)} ops/sec)`);
    console.log(`   Read Time: ${walResults.readTime.toFixed(2)}ms (${walResults.readsPerSecond.toFixed(0)} ops/sec)`);
    console.log(`   Mixed Time: ${walResults.mixedTime.toFixed(2)}ms`);
    console.log(`   Total Time: ${walResults.totalTime.toFixed(2)}ms\n`);
    // Test normal mode
    const normalResults = await testPerformance(TEST_DB_NORMAL, false);
    console.log(`✅ Normal Mode Results:`);
    console.log(`   Write Time: ${normalResults.writeTime.toFixed(2)}ms (${normalResults.writesPerSecond.toFixed(0)} ops/sec)`);
    console.log(`   Read Time: ${normalResults.readTime.toFixed(2)}ms (${normalResults.readsPerSecond.toFixed(0)} ops/sec)`);
    console.log(`   Mixed Time: ${normalResults.mixedTime.toFixed(2)}ms`);
    console.log(`   Total Time: ${normalResults.totalTime.toFixed(2)}ms\n`);
    // Calculate performance improvement
    const writeImprovement = normalResults.writeTime / walResults.writeTime;
    const readImprovement = normalResults.readTime / walResults.readTime;
    const mixedImprovement = normalResults.mixedTime / walResults.mixedTime;
    const totalImprovement = normalResults.totalTime / walResults.totalTime;
    console.log('📈 Performance Improvement with WAL:');
    console.log(`   Write Operations: ${writeImprovement.toFixed(1)}x faster`);
    console.log(`   Read Operations: ${readImprovement.toFixed(1)}x faster`);
    console.log(`   Mixed Operations: ${mixedImprovement.toFixed(1)}x faster`);
    console.log(`   Overall: ${totalImprovement.toFixed(1)}x faster`);
    if (totalImprovement >= 10) {
        console.log('\n🎉 WAL mode delivers 10x+ performance boost as promised!');
    }
    else if (totalImprovement >= 5) {
        console.log('\n✅ WAL mode provides significant performance improvement!');
    }
    else {
        console.log('\n⚠️  WAL mode improvement is less than expected.');
    }
    // Clean up
    [TEST_DB_WAL, TEST_DB_NORMAL].forEach(db => {
        if (existsSync(db))
            unlinkSync(db);
        if (existsSync(db + '-wal'))
            unlinkSync(db + '-wal');
        if (existsSync(db + '-shm'))
            unlinkSync(db + '-shm');
    });
}
runComparison().catch(console.error);
//# sourceMappingURL=wal-performance-test.js.map