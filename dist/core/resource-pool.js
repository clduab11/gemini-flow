/**
 * Resource Pool
 *
 * Manages allocation of resources for parallel operations
 */
import { Logger } from "../utils/logger.js";
export class ResourcePool {
    logger;
    maxConcurrency;
    availableResources = [];
    allocatedResources = new Set();
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.logger = new Logger("ResourcePool");
        this.initializeResources();
    }
    initializeResources() {
        for (let i = 0; i < this.maxConcurrency; i++) {
            this.availableResources.push({
                id: `resource_${i}`,
                allocated: false,
                metadata: {},
            });
        }
    }
    async allocate() {
        const resource = this.availableResources.shift();
        if (!resource) {
            throw new Error("No resources available");
        }
        resource.allocated = true;
        this.allocatedResources.add(resource);
        return resource;
    }
    async allocateBatch(count) {
        if (count > this.availableResources.length) {
            throw new Error(`Not enough resources available. Requested: ${count}, Available: ${this.availableResources.length}`);
        }
        const resources = [];
        for (let i = 0; i < count; i++) {
            resources.push(await this.allocate());
        }
        return resources;
    }
    async release(resource) {
        if (this.allocatedResources.has(resource)) {
            resource.allocated = false;
            this.allocatedResources.delete(resource);
            this.availableResources.push(resource);
        }
    }
    async cleanup() {
        this.availableResources = [];
        this.allocatedResources.clear();
        this.logger.info("Resource pool cleaned up");
    }
    getStatus() {
        return {
            total: this.maxConcurrency,
            available: this.availableResources.length,
            allocated: this.allocatedResources.size,
        };
    }
}
