/**
 * Hive Memory Utility
 * Provides shared memory coordination for test agents
 */
const fs = require('fs').promises;
const path = require('path');
class HiveMemory {
    constructor(options = {}) {
        this.memoryPath = options.memoryPath || path.join(__dirname, '../temp/hive-memory.json');
        this.cache = new Map();
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized)
            return;
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
            // Load existing memory if available
            try {
                const data = await fs.readFile(this.memoryPath, 'utf8');
                const memoryData = JSON.parse(data);
                for (const [key, value] of Object.entries(memoryData)) {
                    this.cache.set(key, value);
                }
            }
            catch (error) {
                // File doesn't exist or is invalid, start with empty memory
                console.log('Starting with empty hive memory');
            }
            this.initialized = true;
        }
        catch (error) {
            console.error('Failed to initialize hive memory:', error);
        }
    }
    async store(key, value) {
        await this.initialize();
        const memoryEntry = {
            value,
            timestamp: new Date().toISOString(),
            ttl: null
        };
        this.cache.set(key, memoryEntry);
        await this.persist();
        return { success: true, key, stored: true };
    }
    async retrieve(key) {
        await this.initialize();
        const entry = this.cache.get(key);
        if (!entry) {
            return { success: false, key, found: false, value: null };
        }
        // Check TTL if set
        if (entry.ttl && new Date() > new Date(entry.ttl)) {
            this.cache.delete(key);
            await this.persist();
            return { success: false, key, found: false, value: null, expired: true };
        }
        return { success: true, key, found: true, value: entry.value };
    }
    async search(pattern) {
        await this.initialize();
        const results = [];
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const [key, entry] of this.cache.entries()) {
            if (regex.test(key)) {
                // Check TTL
                if (!entry.ttl || new Date() <= new Date(entry.ttl)) {
                    results.push({
                        key,
                        value: entry.value,
                        timestamp: entry.timestamp
                    });
                }
            }
        }
        return results;
    }
    async list(namespace = '') {
        await this.initialize();
        const results = [];
        const prefix = namespace ? `${namespace}/` : '';
        for (const [key, entry] of this.cache.entries()) {
            if (key.startsWith(prefix)) {
                // Check TTL
                if (!entry.ttl || new Date() <= new Date(entry.ttl)) {
                    results.push({
                        key,
                        value: entry.value,
                        timestamp: entry.timestamp
                    });
                }
            }
        }
        return results;
    }
    async delete(key) {
        await this.initialize();
        const existed = this.cache.has(key);
        this.cache.delete(key);
        if (existed) {
            await this.persist();
        }
        return { success: true, key, deleted: existed };
    }
    async clear(namespace = '') {
        await this.initialize();
        let deletedCount = 0;
        const prefix = namespace ? `${namespace}/` : '';
        if (prefix) {
            // Clear specific namespace
            const keysToDelete = [];
            for (const key of this.cache.keys()) {
                if (key.startsWith(prefix)) {
                    keysToDelete.push(key);
                }
            }
            for (const key of keysToDelete) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        else {
            // Clear all
            deletedCount = this.cache.size;
            this.cache.clear();
        }
        if (deletedCount > 0) {
            await this.persist();
        }
        return { success: true, deletedCount };
    }
    async getCoordinationStatus() {
        const hiveStatus = await this.search('hive/*');
        const agentStatus = await this.search('hive/*/agent_*');
        return {
            totalEntries: this.cache.size,
            hiveEntries: hiveStatus.length,
            agentEntries: agentStatus.length,
            lastActivity: this.getLastActivityTimestamp()
        };
    }
    async storeAgentProgress(agentId, progress) {
        const key = `hive/agents/${agentId}/progress`;
        return await this.store(key, {
            agentId,
            progress,
            timestamp: new Date().toISOString()
        });
    }
    async getAgentProgress(agentId) {
        const key = `hive/agents/${agentId}/progress`;
        return await this.retrieve(key);
    }
    async getAllAgentProgress() {
        const results = await this.search('hive/agents/*/progress');
        return results.map(r => r.value);
    }
    async storeValidationResult(category, testKey, result) {
        const key = `hive/validation/${category}/${testKey}`;
        return await this.store(key, {
            category,
            testKey,
            result,
            timestamp: new Date().toISOString()
        });
    }
    async getValidationResults(category = '') {
        const pattern = category ? `hive/validation/${category}/*` : 'hive/validation/*/*';
        return await this.search(pattern);
    }
    async getValidationSummary() {
        const allResults = await this.search('hive/validation/*/*');
        const summary = {
            totalTests: allResults.length,
            categories: {},
            lastUpdated: null
        };
        for (const result of allResults) {
            const pathParts = result.key.split('/');
            const category = pathParts[2];
            if (!summary.categories[category]) {
                summary.categories[category] = {
                    total: 0,
                    passed: 0,
                    failed: 0
                };
            }
            summary.categories[category].total++;
            if (result.value.result?.success) {
                summary.categories[category].passed++;
            }
            else {
                summary.categories[category].failed++;
            }
            // Track latest timestamp
            if (!summary.lastUpdated || result.timestamp > summary.lastUpdated) {
                summary.lastUpdated = result.timestamp;
            }
        }
        return summary;
    }
    getLastActivityTimestamp() {
        let latest = null;
        for (const entry of this.cache.values()) {
            if (!latest || entry.timestamp > latest) {
                latest = entry.timestamp;
            }
        }
        return latest;
    }
    async persist() {
        try {
            const memoryData = {};
            for (const [key, value] of this.cache.entries()) {
                memoryData[key] = value;
            }
            await fs.writeFile(this.memoryPath, JSON.stringify(memoryData, null, 2));
        }
        catch (error) {
            console.error('Failed to persist hive memory:', error);
        }
    }
    async cleanup() {
        try {
            await fs.unlink(this.memoryPath);
        }
        catch (error) {
            // File might not exist, ignore error
        }
        this.cache.clear();
        this.initialized = false;
    }
    // Convenience methods for common coordination patterns
    async notifyAgent(fromAgent, toAgent, message) {
        const key = `hive/messages/${toAgent}/${Date.now()}`;
        return await this.store(key, {
            from: fromAgent,
            to: toAgent,
            message,
            timestamp: new Date().toISOString(),
            read: false
        });
    }
    async getMessagesForAgent(agentId) {
        const messages = await this.search(`hive/messages/${agentId}/*`);
        return messages.map(m => m.value);
    }
    async markMessageRead(agentId, messageTimestamp) {
        const key = `hive/messages/${agentId}/${messageTimestamp}`;
        const message = await this.retrieve(key);
        if (message.found) {
            message.value.read = true;
            await this.store(key, message.value);
        }
        return message.found;
    }
}
module.exports = { HiveMemory };
export {};
//# sourceMappingURL=hive-memory.js.map