/**
 * Dependency Graph
 * 
 * Manages dependencies between operations for parallel execution
 */

import { Logger } from '../utils/logger.js';

export class DependencyGraph {
  private nodes: Map<string, any> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DependencyGraph');
  }

  addNode(id: string, data: any): void {
    this.nodes.set(id, data);
    if (!this.dependencies.has(id)) {
      this.dependencies.set(id, new Set());
    }
  }

  addDependency(nodeId: string, dependsOnId: string): void {
    if (!this.dependencies.has(nodeId)) {
      this.dependencies.set(nodeId, new Set());
    }
    this.dependencies.get(nodeId)!.add(dependsOnId);
  }

  getExecutionOrder(): string[][] {
    const visited = new Set<string>();
    const stages: string[][] = [];
    
    while (visited.size < this.nodes.size) {
      const currentStage: string[] = [];
      
      for (const [nodeId, deps] of this.dependencies.entries()) {
        if (visited.has(nodeId)) continue;
        
        // Check if all dependencies are satisfied
        const canExecute = Array.from(deps).every(dep => visited.has(dep));
        
        if (canExecute) {
          currentStage.push(nodeId);
        }
      }
      
      if (currentStage.length === 0) {
        // Circular dependency or other issue
        this.logger.warn('Circular dependency detected, breaking remaining nodes into stages');
        for (const nodeId of this.nodes.keys()) {
          if (!visited.has(nodeId)) {
            currentStage.push(nodeId);
          }
        }
      }
      
      currentStage.forEach(nodeId => visited.add(nodeId));
      stages.push(currentStage);
    }
    
    return stages;
  }

  hasCycles(): boolean {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    
    const hasCycleDFS = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visiting.add(nodeId);
      
      const deps = this.dependencies.get(nodeId) || new Set();
      for (const dep of deps) {
        if (hasCycleDFS(dep)) return true;
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };
    
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true;
      }
    }
    
    return false;
  }

  clear(): void {
    this.nodes.clear();
    this.dependencies.clear();
  }
}