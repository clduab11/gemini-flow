/**
 * Dependency Graph
 *
 * Manages dependencies between operations for parallel execution
 */
import { Logger } from "../utils/logger.js";
export class DependencyGraph {
    nodes = new Map();
    dependencies = new Map();
    logger;
    constructor() {
        this.logger = new Logger("DependencyGraph");
    }
    addNode(id, data) {
        this.nodes.set(id, data);
        if (!this.dependencies.has(id)) {
            this.dependencies.set(id, new Set());
        }
    }
    addDependency(nodeId, dependsOnId) {
        if (!this.dependencies.has(nodeId)) {
            this.dependencies.set(nodeId, new Set());
        }
        this.dependencies.get(nodeId).add(dependsOnId);
    }
    getExecutionOrder() {
        const visited = new Set();
        const stages = [];
        while (visited.size < this.nodes.size) {
            const currentStage = [];
            for (const [nodeId, deps] of this.dependencies.entries()) {
                if (visited.has(nodeId))
                    continue;
                // Check if all dependencies are satisfied
                const canExecute = Array.from(deps).every((dep) => visited.has(dep));
                if (canExecute) {
                    currentStage.push(nodeId);
                }
            }
            if (currentStage.length === 0) {
                // Circular dependency or other issue
                this.logger.warn("Circular dependency detected, breaking remaining nodes into stages");
                for (const nodeId of this.nodes.keys()) {
                    if (!visited.has(nodeId)) {
                        currentStage.push(nodeId);
                    }
                }
            }
            currentStage.forEach((nodeId) => visited.add(nodeId));
            stages.push(currentStage);
        }
        return stages;
    }
    hasCycles() {
        const visiting = new Set();
        const visited = new Set();
        const hasCycleDFS = (nodeId) => {
            if (visiting.has(nodeId))
                return true;
            if (visited.has(nodeId))
                return false;
            visiting.add(nodeId);
            const deps = this.dependencies.get(nodeId) || new Set();
            for (const dep of deps) {
                if (hasCycleDFS(dep))
                    return true;
            }
            visiting.delete(nodeId);
            visited.add(nodeId);
            return false;
        };
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                if (hasCycleDFS(nodeId))
                    return true;
            }
        }
        return false;
    }
    clear() {
        this.nodes.clear();
        this.dependencies.clear();
    }
}
