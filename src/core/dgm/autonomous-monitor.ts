/**
 * DGM Autonomous Monitor
 * 
 * Continuously monitors system health and triggers preventive evolutionary
 * strategies to prevent technical debt accumulation.
 */

import { Logger } from '../../utils/logger';
import { PerformanceMonitor } from '../performance-monitor';
import { DGMEvolutionaryOrchestrator, CleanupTarget } from './evolutionary-orchestrator';
import { DGMPatternArchive } from './pattern-archive';
import { EventEmitter } from 'events';

export interface MonitoringConfig {
  scanInterval: number; // milliseconds
  debtThreshold: number; // 0-1 scale
  preventiveThreshold: number; // 0-1 scale  
  emergencyThreshold: number; // 0-1 scale
  autoEvolutionEnabled: boolean;
  maxConcurrentEvolutions: number;
  cooldownPeriod: number; // milliseconds
}

export interface DebtMetrics {
  technicalDebt: number; // 0-1 scale
  performanceDrift: number; // 0-1 scale
  codeComplexity: number; // 0-1 scale
  dependencyHealth: number; // 0-1 scale
  configurationDrift: number; // 0-1 scale
  testCoverage: number; // 0-1 scale
  documentationGap: number; // 0-1 scale
}

export interface MonitoringAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  category: keyof DebtMetrics;
  message: string;
  currentValue: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'degrading';
  actionRequired: boolean;
  suggestedActions: string[];
  timestamp: Date;
}

export interface EvolutionTrigger {
  id: string;
  triggerType: 'preventive' | 'reactive' | 'emergency';
  triggeredBy: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
  targets: CleanupTarget[];
  timestamp: Date;
}

/**
 * Autonomous monitoring system for preventing technical debt
 */
export class DGMAutonomousMonitor extends EventEmitter {
  private logger: Logger;
  private config: MonitoringConfig;
  private performanceMonitor: PerformanceMonitor;
  private evolutionaryOrchestrator: DGMEvolutionaryOrchestrator;
  private patternArchive: DGMPatternArchive;
  
  // Monitoring state
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private currentDebt: DebtMetrics;
  private debtHistory: Array<{ timestamp: Date; debt: DebtMetrics }> = [];
  private activeAlerts: Map<string, MonitoringAlert> = new Map();
  private runningEvolutions: Set<string> = new Set();
  private lastEvolutionTime: Date = new Date(0);
  
  // Trend analysis
  private trendWindow: number = 10; // Number of measurements for trend analysis
  private alertHistory: Map<string, MonitoringAlert[]> = new Map();

  constructor(
    config: MonitoringConfig,
    performanceMonitor: PerformanceMonitor,
    evolutionaryOrchestrator: DGMEvolutionaryOrchestrator,
    patternArchive: DGMPatternArchive
  ) {
    super();
    this.config = config;
    this.performanceMonitor = performanceMonitor;
    this.evolutionaryOrchestrator = evolutionaryOrchestrator;
    this.patternArchive = patternArchive;
    this.logger = new Logger('DGMAutonomousMonitor');
    
    // Initialize debt metrics
    this.currentDebt = {
      technicalDebt: 0.5,
      performanceDrift: 0.5,
      codeComplexity: 0.5,
      dependencyHealth: 0.5,
      configurationDrift: 0.5,
      testCoverage: 0.5,
      documentationGap: 0.5
    };
    
    this.logger.info('Autonomous monitor initialized', {
      scanInterval: config.scanInterval,
      autoEvolution: config.autoEvolutionEnabled,
      thresholds: {
        debt: config.debtThreshold,
        preventive: config.preventiveThreshold,
        emergency: config.emergencyThreshold
      }
    });
  }

  /**
   * Start autonomous monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring already active');
      return;
    }
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.scanInterval);
    
    this.logger.info('Autonomous monitoring started', {
      interval: this.config.scanInterval,
      autoEvolution: this.config.autoEvolutionEnabled
    });
    
    this.emit('monitoring_started');
  }

  /**
   * Stop autonomous monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.logger.info('Autonomous monitoring stopped');
    this.emit('monitoring_stopped');
  }

  /**
   * Perform a complete monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Collect current metrics
      const newDebt = await this.collectDebtMetrics();
      
      // Update debt history
      this.updateDebtHistory(newDebt);
      
      // Analyze trends and generate alerts
      const alerts = this.analyzeDebtTrends();
      
      // Process alerts and determine if evolution is needed
      const evolutionTriggers = this.processAlerts(alerts);
      
      // Trigger autonomous evolution if needed
      if (evolutionTriggers.length > 0) {
        await this.handleEvolutionTriggers(evolutionTriggers);
      }
      
      // Emit monitoring cycle completed
      this.emit('monitoring_cycle_completed', {
        debt: newDebt,
        alerts: alerts.length,
        triggers: evolutionTriggers.length
      });
      
    } catch (error) {
      this.logger.error('Monitoring cycle failed', { error });
      this.emit('monitoring_error', error);
    }
  }

  /**
   * Collect current debt metrics
   */
  private async collectDebtMetrics(): Promise<DebtMetrics> {
    const performanceStats = this.performanceMonitor.getMetrics();
    const healthScore = this.performanceMonitor.getHealthScore();
    const bottlenecks = this.performanceMonitor.analyzeBottlenecks();
    
    // Calculate debt metrics based on performance data
    const debt: DebtMetrics = {
      technicalDebt: this.calculateTechnicalDebt(performanceStats, bottlenecks),
      performanceDrift: this.calculatePerformanceDrift(healthScore),
      codeComplexity: this.calculateCodeComplexity(bottlenecks),
      dependencyHealth: await this.assessDependencyHealth(),
      configurationDrift: this.assessConfigurationDrift(),
      testCoverage: await this.assessTestCoverage(),
      documentationGap: this.assessDocumentationGap()
    };
    
    this.currentDebt = debt;
    return debt;
  }

  /**
   * Update debt history for trend analysis
   */
  private updateDebtHistory(debt: DebtMetrics): void {
    this.debtHistory.push({
      timestamp: new Date(),
      debt: { ...debt }
    });
    
    // Maintain history size
    if (this.debtHistory.length > 100) {
      this.debtHistory.shift();
    }
  }

  /**
   * Analyze debt trends and generate alerts
   */
  private analyzeDebtTrends(): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = [];
    
    for (const [category, currentValue] of Object.entries(this.currentDebt) as Array<[keyof DebtMetrics, number]>) {
      const trend = this.calculateTrend(category);
      const alert = this.evaluateDebtCategory(category, currentValue, trend);
      
      if (alert) {
        alerts.push(alert);
        this.updateAlertHistory(alert);
      }
    }
    
    // Clear resolved alerts
    this.clearResolvedAlerts(alerts);
    
    return alerts;
  }

  /**
   * Evaluate a specific debt category for alerts
   */
  private evaluateDebtCategory(
    category: keyof DebtMetrics,
    value: number,
    trend: 'improving' | 'stable' | 'degrading'
  ): MonitoringAlert | null {
    let severity: MonitoringAlert['severity'] | null = null;
    let threshold: number;
    let actionRequired = false;
    
    // Determine severity based on thresholds
    if (value >= this.config.emergencyThreshold) {
      severity = 'emergency';
      threshold = this.config.emergencyThreshold;
      actionRequired = true;
    } else if (value >= this.config.debtThreshold) {
      severity = 'critical';
      threshold = this.config.debtThreshold;
      actionRequired = true;
    } else if (value >= this.config.preventiveThreshold && trend === 'degrading') {
      severity = 'warning';
      threshold = this.config.preventiveThreshold;
      actionRequired = this.config.autoEvolutionEnabled;
    } else if (trend === 'degrading' && value > 0.6) {
      severity = 'info';
      threshold = 0.6;
      actionRequired = false;
    }
    
    if (!severity) return null;
    
    const alertId = `${category}-${Date.now()}`;
    const alert: MonitoringAlert = {
      id: alertId,
      severity,
      category,
      message: this.generateAlertMessage(category, value, trend),
      currentValue: value,
      threshold,
      trend,
      actionRequired,
      suggestedActions: this.generateSuggestedActions(category, value, trend),
      timestamp: new Date()
    };
    
    // Store active alert
    this.activeAlerts.set(alertId, alert);
    
    this.logger.warn('Debt alert generated', {
      category,
      severity,
      value,
      trend,
      actionRequired
    });
    
    this.emit('debt_alert', alert);
    return alert;
  }

  /**
   * Process alerts and generate evolution triggers
   */
  private processAlerts(alerts: MonitoringAlert[]): EvolutionTrigger[] {
    const triggers: EvolutionTrigger[] = [];
    
    // Group alerts by priority
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency');
    const warningAlerts = alerts.filter(a => a.severity === 'warning' && a.actionRequired);
    
    // Generate triggers for critical issues
    if (criticalAlerts.length > 0) {
      const trigger = this.createEvolutionTrigger('reactive', criticalAlerts);
      if (trigger) triggers.push(trigger);
    }
    
    // Generate triggers for preventive actions
    if (warningAlerts.length > 0 && this.shouldTriggerPreventiveEvolution()) {
      const trigger = this.createEvolutionTrigger('preventive', warningAlerts);
      if (trigger) triggers.push(trigger);
    }
    
    // Check for emergency conditions
    const emergencyAlerts = alerts.filter(a => a.severity === 'emergency');
    if (emergencyAlerts.length > 0) {
      const trigger = this.createEvolutionTrigger('emergency', emergencyAlerts);
      if (trigger) triggers.push(trigger);
    }
    
    return triggers;
  }

  /**
   * Handle evolution triggers
   */
  private async handleEvolutionTriggers(triggers: EvolutionTrigger[]): Promise<void> {
    // Check cooldown period
    const timeSinceLastEvolution = Date.now() - this.lastEvolutionTime.getTime();
    if (timeSinceLastEvolution < this.config.cooldownPeriod) {
      this.logger.info('Evolution in cooldown period', {
        timeRemaining: this.config.cooldownPeriod - timeSinceLastEvolution
      });
      return;
    }
    
    // Check concurrent evolution limit
    if (this.runningEvolutions.size >= this.config.maxConcurrentEvolutions) {
      this.logger.info('Maximum concurrent evolutions reached', {
        running: this.runningEvolutions.size,
        limit: this.config.maxConcurrentEvolutions
      });
      return;
    }
    
    // Sort triggers by priority
    triggers.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Process highest priority trigger
    const trigger = triggers[0];
    
    if (this.config.autoEvolutionEnabled || trigger.triggerType === 'emergency') {
      await this.executeEvolutionTrigger(trigger);
    } else {
      this.logger.info('Auto-evolution disabled, logging trigger for manual review', {
        triggerId: trigger.id,
        type: trigger.triggerType,
        priority: trigger.priority
      });
      
      this.emit('manual_evolution_required', trigger);
    }
  }

  /**
   * Execute an evolution trigger
   */
  private async executeEvolutionTrigger(trigger: EvolutionTrigger): Promise<void> {
    const evolutionId = `auto-evolution-${trigger.id}`;
    
    try {
      this.runningEvolutions.add(evolutionId);
      this.lastEvolutionTime = new Date();
      
      this.logger.info('Executing autonomous evolution', {
        evolutionId,
        triggerType: trigger.triggerType,
        priority: trigger.priority,
        targets: trigger.targets.length
      });
      
      this.emit('autonomous_evolution_started', { evolutionId, trigger });
      
      // Get pattern recommendations
      const recommendations = await this.patternArchive.getPatternRecommendations(
        { 
          id: evolutionId,
          name: `Autonomous ${trigger.triggerType} evolution`,
          description: `Auto-generated evolution for ${trigger.triggeredBy.join(', ')}`,
          parameters: { targets: trigger.targets, approach: 'autonomous' },
          fitness: 0,
          generation: 0,
          mutations: [],
          timestamp: new Date()
        },
        {
          systemState: { debtMetrics: this.currentDebt },
          environmentConditions: ['autonomous', 'production'],
          targetTypes: trigger.targets.map(t => t.type),
          problemDomain: 'debt_prevention',
          scalabilityFactors: { projectSize: 0.7 }
        }
      );
      
      // Generate evolution strategies
      const strategies = await this.evolutionaryOrchestrator.generateEvolutionaryStrategies(trigger.targets);
      
      // Apply best strategy
      if (strategies.length > 0) {
        // For autonomous execution, select conservative strategy to minimize risk
        const conservativeStrategy = strategies.find(s => s.name.toLowerCase().includes('conservative')) || strategies[0];
        
        this.logger.info('Applying autonomous strategy', {
          evolutionId,
          strategyName: conservativeStrategy.name,
          recommendations: recommendations.length
        });
        
        // Execute with validation
        const results = await this.evolutionaryOrchestrator.executeABTesting([conservativeStrategy]);
        const result = results.get(conservativeStrategy.id);
        
        if (result?.passed) {
          this.logger.info('Autonomous evolution completed successfully', {
            evolutionId,
            score: result.score
          });
          
          this.emit('autonomous_evolution_completed', { evolutionId, result });
        } else {
          this.logger.error('Autonomous evolution failed validation', {
            evolutionId,
            errors: result?.errors || []
          });
          
          this.emit('autonomous_evolution_failed', { evolutionId, result });
        }
      }
      
    } catch (error) {
      this.logger.error('Autonomous evolution execution failed', {
        evolutionId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.emit('autonomous_evolution_error', { evolutionId, error });
      
    } finally {
      this.runningEvolutions.delete(evolutionId);
    }
  }

  // Utility methods for debt calculation
  
  private calculateTechnicalDebt(stats: any, bottlenecks: any[]): number {
    // Higher debt for more bottlenecks and poor performance
    const bottleneckPenalty = Math.min(1, bottlenecks.length * 0.1);
    const performancePenalty = Object.values(stats).length === 0 ? 0.5 : 
      Object.values(stats).some((stat: any) => stat?.p95 > stat?.mean * 2) ? 0.3 : 0.1;
    
    return Math.min(1, bottleneckPenalty + performancePenalty);
  }

  private calculatePerformanceDrift(healthScore: number): number {
    // Inverse of health score (higher drift = lower health)
    return Math.max(0, 1 - (healthScore / 100));
  }

  private calculateCodeComplexity(bottlenecks: any[]): number {
    // Use bottleneck severity as complexity indicator
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high').length;
    
    return Math.min(1, (criticalBottlenecks * 0.3 + highBottlenecks * 0.2));
  }

  private async assessDependencyHealth(): Promise<number> {
    // Simplified assessment - in practice would check package vulnerabilities, outdated deps
    return 0.3; // Placeholder - moderate dependency issues
  }

  private assessConfigurationDrift(): number {
    // Simplified assessment - would check config consistency
    return 0.2; // Placeholder - minor config drift
  }

  private async assessTestCoverage(): Promise<number> {
    // Simplified assessment - would check actual test coverage
    return 0.4; // Placeholder - moderate test coverage gaps
  }

  private assessDocumentationGap(): number {
    // Simplified assessment - would check documentation completeness
    return 0.5; // Placeholder - moderate documentation gaps
  }

  private calculateTrend(category: keyof DebtMetrics): 'improving' | 'stable' | 'degrading' {
    if (this.debtHistory.length < this.trendWindow) {
      return 'stable';
    }
    
    const recent = this.debtHistory.slice(-this.trendWindow).map(h => h.debt[category]);
    const older = this.debtHistory.slice(-this.trendWindow * 2, -this.trendWindow).map(h => h.debt[category]);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (change > 0.05) return 'degrading';
    if (change < -0.05) return 'improving';
    return 'stable';
  }

  private generateAlertMessage(category: keyof DebtMetrics, value: number, trend: string): string {
    const percentage = Math.round(value * 100);
    const categoryName = category.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
    
    return `${categoryName} is at ${percentage}% and ${trend}`;
  }

  private generateSuggestedActions(category: keyof DebtMetrics, value: number, trend: string): string[] {
    const actions: string[] = [];
    
    switch (category) {
      case 'technicalDebt':
        actions.push('Run code refactoring analysis', 'Consolidate duplicate code', 'Update deprecated APIs');
        break;
      case 'performanceDrift':
        actions.push('Optimize database queries', 'Review caching strategy', 'Profile CPU hotspots');
        break;
      case 'codeComplexity':
        actions.push('Extract complex functions', 'Simplify conditional logic', 'Review method sizes');
        break;
      case 'dependencyHealth':
        actions.push('Update vulnerable packages', 'Remove unused dependencies', 'Audit license compliance');
        break;
      case 'configurationDrift':
        actions.push('Synchronize environment configs', 'Validate configuration schema', 'Document config changes');
        break;
      case 'testCoverage':
        actions.push('Add unit tests for critical paths', 'Implement integration tests', 'Review test effectiveness');
        break;
      case 'documentationGap':
        actions.push('Update API documentation', 'Add inline code comments', 'Create deployment guides');
        break;
    }
    
    if (trend === 'degrading') {
      actions.unshift('Immediate attention required');
    }
    
    return actions;
  }

  private shouldTriggerPreventiveEvolution(): boolean {
    // Check if we have enough successful patterns to make informed decisions
    return this.runningEvolutions.size === 0;
  }

  private createEvolutionTrigger(
    type: 'preventive' | 'reactive' | 'emergency',
    alerts: MonitoringAlert[]
  ): EvolutionTrigger | null {
    if (alerts.length === 0) return null;
    
    const triggerId = `trigger-${type}-${Date.now()}`;
    const targets: CleanupTarget[] = [];
    
    // Generate cleanup targets based on alerts
    for (const alert of alerts) {
      const target = this.generateCleanupTarget(alert);
      if (target) targets.push(target);
    }
    
    if (targets.length === 0) return null;
    
    // Calculate priority
    const maxSeverity = Math.max(...alerts.map(a => {
      const severityMap = { info: 1, warning: 2, critical: 3, emergency: 4 };
      return severityMap[a.severity];
    }));
    
    const priority = maxSeverity >= 4 ? 'critical' : maxSeverity >= 3 ? 'high' : maxSeverity >= 2 ? 'medium' : 'low';
    
    return {
      id: triggerId,
      triggerType: type,
      triggeredBy: alerts.map(a => a.category),
      priority: priority as 'low' | 'medium' | 'high' | 'critical',
      estimatedImpact: alerts.reduce((sum, a) => sum + a.currentValue, 0) / alerts.length,
      targets,
      timestamp: new Date()
    };
  }

  private generateCleanupTarget(alert: MonitoringAlert): CleanupTarget | null {
    const category = alert.category;
    const severity = alert.currentValue;
    
    // Generate appropriate cleanup targets based on alert category
    switch (category) {
      case 'technicalDebt':
        return {
          type: 'file',
          path: 'src/**/*.{js,ts}',
          reason: 'Technical debt accumulation detected',
          priority: severity > 0.8 ? 'critical' : severity > 0.6 ? 'high' : 'medium',
          estimatedBenefit: 1 - severity,
          riskLevel: 0.3
        };
      
      case 'performanceDrift':
        return {
          type: 'configuration',
          path: 'config/performance.json',
          reason: 'Performance degradation detected',
          priority: severity > 0.8 ? 'critical' : 'high',
          estimatedBenefit: severity * 0.8,
          riskLevel: 0.2
        };
      
      case 'dependencyHealth':
        return {
          type: 'dependency',
          path: 'package.json',
          reason: 'Dependency health issues detected',
          priority: severity > 0.7 ? 'high' : 'medium',
          estimatedBenefit: severity * 0.6,
          riskLevel: 0.4
        };
      
      default:
        return {
          type: 'file',
          path: '.',
          reason: `${category} issues detected`,
          priority: 'medium',
          estimatedBenefit: 0.5,
          riskLevel: 0.3
        };
    }
  }

  private updateAlertHistory(alert: MonitoringAlert): void {
    const category = alert.category;
    if (!this.alertHistory.has(category)) {
      this.alertHistory.set(category, []);
    }
    
    const history = this.alertHistory.get(category)!;
    history.push(alert);
    
    // Maintain history size
    if (history.length > 50) {
      history.shift();
    }
  }

  private clearResolvedAlerts(currentAlerts: MonitoringAlert[]): void {
    const currentAlertIds = new Set(currentAlerts.map(a => a.id));
    
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (!currentAlertIds.has(alertId)) {
        // Alert resolved
        this.activeAlerts.delete(alertId);
        
        this.logger.info('Alert resolved', {
          category: alert.category,
          severity: alert.severity
        });
        
        this.emit('alert_resolved', alert);
      }
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    currentDebt: DebtMetrics;
    activeAlerts: MonitoringAlert[];
    runningEvolutions: string[];
    lastEvolutionTime: Date;
  } {
    return {
      isMonitoring: this.isMonitoring,
      currentDebt: { ...this.currentDebt },
      activeAlerts: Array.from(this.activeAlerts.values()),
      runningEvolutions: Array.from(this.runningEvolutions),
      lastEvolutionTime: this.lastEvolutionTime
    };
  }

  /**
   * Force evolution trigger for testing
   */
  async forceEvolution(category: keyof DebtMetrics): Promise<void> {
    const alert: MonitoringAlert = {
      id: `forced-${category}-${Date.now()}`,
      severity: 'critical',
      category,
      message: `Forced evolution trigger for ${category}`,
      currentValue: 0.9,
      threshold: 0.8,
      trend: 'degrading',
      actionRequired: true,
      suggestedActions: ['Forced evolution test'],
      timestamp: new Date()
    };
    
    const trigger = this.createEvolutionTrigger('reactive', [alert]);
    if (trigger) {
      await this.executeEvolutionTrigger(trigger);
    }
  }
}