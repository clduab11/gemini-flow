/**
 * Security Runbooks for Common Scenarios
 * 
 * Automated and manual response procedures for security incidents:
 * - Data breach response
 * - DDoS attack mitigation
 * - Insider threat investigation
 * - Malware outbreak containment
 * - Account compromise recovery
 * - API abuse handling
 * - Certificate expiration management
 * - Vulnerability disclosure response
 */

import { Logger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface RunbookStep {
  id: string;
  title: string;
  description: string;
  type: 'automated' | 'manual' | 'verification';
  estimatedTime: number; // minutes
  prerequisites?: string[];
  actions: RunbookAction[];
  validationCriteria?: string[];
  escalationTriggers?: string[];
}

export interface RunbookAction {
  id: string;
  type: 'command' | 'api_call' | 'notification' | 'documentation' | 'analysis';
  description: string;
  command?: string;
  apiEndpoint?: string;
  parameters?: Record<string, any>;
  expectedResult?: string;
  timeoutSeconds?: number;
  retryCount?: number;
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  incidentId?: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  executedBy: string;
  currentStepIndex: number;
  stepResults: StepResult[];
  variables: Record<string, any>;
}

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  errors?: string[];
  actionResults: ActionResult[];
}

export interface ActionResult {
  actionId: string;
  status: 'success' | 'failure' | 'timeout';
  output?: string;
  error?: string;
  duration: number;
}

export class SecurityRunbooks extends EventEmitter {
  private logger: Logger;
  private runbooks: Map<string, SecurityRunbook> = new Map();
  private executions: Map<string, RunbookExecution> = new Map();
  private activeExecutions: Set<string> = new Set();

  constructor() {
    super();
    this.logger = new Logger('SecurityRunbooks');
    this.initializeDefaultRunbooks();
  }

  /**
   * Execute a security runbook
   */
  async executeRunbook(
    runbookId: string,
    context: {
      incidentId?: string;
      executedBy: string;
      variables?: Record<string, any>;
      autoExecute?: boolean;
    }
  ): Promise<string> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) {
      throw new Error(`Runbook not found: ${runbookId}`);
    }

    const executionId = crypto.randomUUID();
    const execution: RunbookExecution = {
      id: executionId,
      runbookId,
      incidentId: context.incidentId,
      startedAt: new Date(),
      status: 'running',
      executedBy: context.executedBy,
      currentStepIndex: 0,
      stepResults: [],
      variables: context.variables || {}
    };

    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);

    this.logger.info('Starting runbook execution', {
      executionId,
      runbookId,
      executedBy: context.executedBy,
      incidentId: context.incidentId
    });

    this.emit('execution_started', execution);

    try {
      if (context.autoExecute) {
        await this.executeAllSteps(executionId);
      }
      
      return executionId;
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      this.activeExecutions.delete(executionId);
      
      this.logger.error('Runbook execution failed', {
        error,
        executionId,
        runbookId
      });
      
      throw error;
    }
  }

  /**
   * Execute next step in a runbook
   */
  async executeNextStep(executionId: string): Promise<StepResult> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const runbook = this.runbooks.get(execution.runbookId);
    if (!runbook) {
      throw new Error(`Runbook not found: ${execution.runbookId}`);
    }

    if (execution.currentStepIndex >= runbook.steps.length) {
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.activeExecutions.delete(executionId);
      this.emit('execution_completed', execution);
      throw new Error('No more steps to execute');
    }

    const step = runbook.steps[execution.currentStepIndex];
    const stepResult = await this.executeStep(execution, step);
    
    execution.stepResults.push(stepResult);
    execution.currentStepIndex++;

    this.emit('step_completed', execution, stepResult);

    return stepResult;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): RunbookExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string, reason: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date();
    this.activeExecutions.delete(executionId);

    this.logger.info('Runbook execution cancelled', {
      executionId,
      reason,
      completedSteps: execution.stepResults.length
    });

    this.emit('execution_cancelled', execution, reason);
  }

  /**
   * Private implementation methods
   */
  private async executeAllSteps(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)!;
    const runbook = this.runbooks.get(execution.runbookId)!;

    for (let i = 0; i < runbook.steps.length; i++) {
      const step = runbook.steps[i];
      
      // Check if step should be executed based on type
      if (step.type === 'manual') {
        // For manual steps, mark as pending and wait for manual execution
        const stepResult: StepResult = {
          stepId: step.id,
          status: 'pending',
          actionResults: []
        };
        execution.stepResults.push(stepResult);
        execution.currentStepIndex++;
        
        this.emit('manual_step_required', execution, step);
        break; // Stop auto-execution at manual steps
      } else {
        const stepResult = await this.executeStep(execution, step);
        execution.stepResults.push(stepResult);
        execution.currentStepIndex++;

        // Check for escalation triggers
        if (stepResult.status === 'failed' && step.escalationTriggers?.length) {
          this.emit('escalation_required', execution, step, stepResult);
        }
      }
    }

    if (execution.currentStepIndex >= runbook.steps.length) {
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.activeExecutions.delete(executionId);
      this.emit('execution_completed', execution);
    }
  }

  private async executeStep(execution: RunbookExecution, step: RunbookStep): Promise<StepResult> {
    const stepResult: StepResult = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date(),
      actionResults: []
    };

    this.logger.info('Executing runbook step', {
      executionId: execution.id,
      stepId: step.id,
      stepTitle: step.title
    });

    try {
      // Check prerequisites
      if (step.prerequisites?.length) {
        const prerequisitesMet = await this.checkPrerequisites(
          step.prerequisites,
          execution
        );
        if (!prerequisitesMet) {
          stepResult.status = 'skipped';
          stepResult.errors = ['Prerequisites not met'];
          stepResult.completedAt = new Date();
          return stepResult;
        }
      }

      // Execute actions
      for (const action of step.actions) {
        const actionResult = await this.executeAction(action, execution);
        stepResult.actionResults.push(actionResult);

        if (actionResult.status === 'failure') {
          stepResult.status = 'failed';
          stepResult.errors = stepResult.errors || [];
          stepResult.errors.push(actionResult.error || 'Action failed');
        }
      }

      if (stepResult.status === 'running') {
        stepResult.status = 'completed';
      }

      stepResult.completedAt = new Date();

    } catch (error) {
      stepResult.status = 'failed';
      stepResult.errors = [error instanceof Error ? error.message : 'Unknown error'];
      stepResult.completedAt = new Date();
    }

    return stepResult;
  }

  private async executeAction(
    action: RunbookAction,
    execution: RunbookExecution
  ): Promise<ActionResult> {
    const startTime = Date.now();
    const actionResult: ActionResult = {
      actionId: action.id,
      status: 'success',
      duration: 0
    };

    try {
      switch (action.type) {
        case 'command':
          actionResult.output = await this.executeCommand(action, execution);
          break;

        case 'api_call':
          actionResult.output = await this.executeApiCall(action, execution);
          break;

        case 'notification':
          await this.sendNotification(action, execution);
          actionResult.output = 'Notification sent';
          break;

        case 'documentation':
          await this.createDocumentation(action, execution);
          actionResult.output = 'Documentation created';
          break;

        case 'analysis':
          actionResult.output = await this.performAnalysis(action, execution);
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

    } catch (error) {
      actionResult.status = 'failure';
      actionResult.error = error instanceof Error ? error.message : 'Unknown error';
    }

    actionResult.duration = Date.now() - startTime;
    return actionResult;
  }

  private async executeCommand(action: RunbookAction, execution: RunbookExecution): Promise<string> {
    if (!action.command) {
      throw new Error('No command specified');
    }

    // Substitute variables in command
    const command = this.substituteVariables(action.command, execution.variables);
    
    // In a real implementation, this would execute the command safely
    // For now, we'll simulate command execution
    this.logger.info('Executing command', { command, executionId: execution.id });
    
    return `Command executed: ${command}`;
  }

  private async executeApiCall(action: RunbookAction, execution: RunbookExecution): Promise<string> {
    if (!action.apiEndpoint) {
      throw new Error('No API endpoint specified');
    }

    // Substitute variables in endpoint and parameters
    const endpoint = this.substituteVariables(action.apiEndpoint, execution.variables);
    const parameters = this.substituteVariables(
      JSON.stringify(action.parameters || {}),
      execution.variables
    );

    this.logger.info('Making API call', {
      endpoint,
      parameters,
      executionId: execution.id
    });

    // In a real implementation, this would make the actual API call
    return `API call completed: ${endpoint}`;
  }

  private async sendNotification(action: RunbookAction, execution: RunbookExecution): Promise<void> {
    const message = this.substituteVariables(
      action.parameters?.message || action.description,
      execution.variables
    );

    this.logger.info('Sending notification', {
      message,
      executionId: execution.id
    });

    // Emit event for notification handlers
    this.emit('notification_required', {
      type: action.parameters?.type || 'email',
      recipients: action.parameters?.recipients || [],
      subject: action.parameters?.subject || 'Security Runbook Notification',
      message,
      executionId: execution.id
    });
  }

  private async createDocumentation(action: RunbookAction, execution: RunbookExecution): Promise<void> {
    const content = this.substituteVariables(
      action.parameters?.template || action.description,
      execution.variables
    );

    this.logger.info('Creating documentation', {
      type: action.parameters?.type || 'incident_report',
      executionId: execution.id
    });

    // Emit event for documentation handlers
    this.emit('documentation_required', {
      type: action.parameters?.type || 'incident_report',
      title: action.parameters?.title || 'Security Incident Documentation',
      content,
      executionId: execution.id,
      incidentId: execution.incidentId
    });
  }

  private async performAnalysis(action: RunbookAction, execution: RunbookExecution): Promise<string> {
    const analysisType = action.parameters?.type || 'general';
    
    this.logger.info('Performing analysis', {
      analysisType,
      executionId: execution.id
    });

    // Emit event for analysis handlers
    this.emit('analysis_required', {
      type: analysisType,
      parameters: action.parameters,
      executionId: execution.id,
      incidentId: execution.incidentId
    });

    return `Analysis completed: ${analysisType}`;
  }

  private async checkPrerequisites(
    prerequisites: string[],
    execution: RunbookExecution
  ): Promise<boolean> {
    // Check if prerequisites are met
    // This could check system state, previous step results, etc.
    return true; // Simplified implementation
  }

  private substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  /**
   * Initialize default security runbooks
   */
  private initializeDefaultRunbooks(): void {
    // Data Breach Response Runbook
    this.runbooks.set('data_breach_response', new SecurityRunbook({
      id: 'data_breach_response',
      title: 'Data Breach Response',
      description: 'Comprehensive response to data breach incidents',
      category: 'incident_response',
      severity: 'critical',
      estimatedDuration: 480, // 8 hours
      steps: [
        {
          id: 'initial_assessment',
          title: 'Initial Assessment',
          description: 'Assess the scope and impact of the data breach',
          type: 'automated',
          estimatedTime: 15,
          actions: [
            {
              id: 'identify_affected_systems',
              type: 'analysis',
              description: 'Identify affected systems and data',
              parameters: {
                type: 'breach_scope_analysis',
                systems: '{{affected_systems}}',
                timeframe: '{{incident_timeframe}}'
              }
            },
            {
              id: 'estimate_data_volume',
              type: 'analysis',
              description: 'Estimate volume of compromised data',
              parameters: {
                type: 'data_volume_estimation'
              }
            }
          ]
        },
        {
          id: 'immediate_containment',
          title: 'Immediate Containment',
          description: 'Contain the breach to prevent further data loss',
          type: 'automated',
          estimatedTime: 30,
          actions: [
            {
              id: 'isolate_affected_systems',
              type: 'command',
              description: 'Isolate affected systems from network',
              command: 'firewall block --systems={{affected_systems}}'
            },
            {
              id: 'disable_compromised_accounts',
              type: 'api_call',
              description: 'Disable compromised user accounts',
              apiEndpoint: '/api/security/disable-accounts',
              parameters: {
                accounts: '{{compromised_accounts}}',
                reason: 'Data breach containment'
              }
            },
            {
              id: 'enable_enhanced_monitoring',
              type: 'api_call',
              description: 'Enable enhanced monitoring and logging',
              apiEndpoint: '/api/monitoring/enhance',
              parameters: {
                level: 'maximum',
                duration: '24h'
              }
            }
          ]
        },
        {
          id: 'notification',
          title: 'Stakeholder Notification',
          description: 'Notify required stakeholders and authorities',
          type: 'manual',
          estimatedTime: 60,
          actions: [
            {
              id: 'notify_executives',
              type: 'notification',
              description: 'Notify executive leadership',
              parameters: {
                type: 'email',
                recipients: ['ceo@company.com', 'cso@company.com'],
                subject: 'CRITICAL: Data Breach Detected',
                message: 'A data breach has been detected affecting {{estimated_records}} records. Immediate response is in progress.'
              }
            },
            {
              id: 'notify_legal_team',
              type: 'notification',
              description: 'Notify legal team for compliance requirements',
              parameters: {
                type: 'email',
                recipients: ['legal@company.com'],
                subject: 'Data Breach Legal Notification Required',
                message: 'Data breach detected. Legal review required for regulatory notification obligations.'
              }
            }
          ]
        },
        {
          id: 'forensic_investigation',
          title: 'Forensic Investigation',
          description: 'Conduct forensic investigation to determine root cause',
          type: 'manual',
          estimatedTime: 240,
          actions: [
            {
              id: 'collect_forensic_evidence',
              type: 'command',
              description: 'Collect forensic evidence from affected systems',
              command: 'forensics collect --systems={{affected_systems}} --output=/forensics/{{incident_id}}'
            },
            {
              id: 'analyze_attack_vector',
              type: 'analysis',
              description: 'Analyze attack vector and timeline',
              parameters: {
                type: 'attack_vector_analysis',
                evidence_path: '/forensics/{{incident_id}}'
              }
            }
          ]
        },
        {
          id: 'regulatory_notification',
          title: 'Regulatory Notification',
          description: 'Submit required regulatory notifications',
          type: 'manual',
          estimatedTime: 120,
          prerequisites: ['notification'],
          actions: [
            {
              id: 'prepare_breach_report',
              type: 'documentation',
              description: 'Prepare regulatory breach notification',
              parameters: {
                type: 'regulatory_report',
                template: 'gdpr_breach_notification',
                title: 'Data Breach Notification - {{incident_id}}'
              }
            },
            {
              id: 'submit_to_authorities',
              type: 'api_call',
              description: 'Submit notification to regulatory authorities',
              apiEndpoint: '/api/compliance/submit-breach-notification',
              parameters: {
                report_id: '{{breach_report_id}}',
                authorities: ['data_protection_authority']
              }
            }
          ]
        },
        {
          id: 'customer_notification',
          title: 'Customer Notification',
          description: 'Notify affected customers',
          type: 'manual',
          estimatedTime: 60,
          prerequisites: ['forensic_investigation'],
          actions: [
            {
              id: 'prepare_customer_notice',
              type: 'documentation',
              description: 'Prepare customer breach notification',
              parameters: {
                type: 'customer_notification',
                template: 'breach_customer_notice',
                title: 'Important Security Notice'
              }
            },
            {
              id: 'send_customer_notifications',
              type: 'api_call',
              description: 'Send notifications to affected customers',
              apiEndpoint: '/api/communications/send-breach-notice',
              parameters: {
                affected_customers: '{{affected_customer_ids}}',
                notice_id: '{{customer_notice_id}}'
              }
            }
          ]
        },
        {
          id: 'remediation',
          title: 'System Remediation',
          description: 'Remediate vulnerabilities and restore systems',
          type: 'manual',
          estimatedTime: 180,
          prerequisites: ['forensic_investigation'],
          actions: [
            {
              id: 'patch_vulnerabilities',
              type: 'command',
              description: 'Apply security patches to affected systems',
              command: 'patch-management apply --systems={{affected_systems}} --priority=critical'
            },
            {
              id: 'restore_from_backup',
              type: 'command',
              description: 'Restore clean data from backups',
              command: 'backup restore --systems={{affected_systems}} --point-in-time={{pre_breach_timestamp}}'
            },
            {
              id: 'implement_additional_controls',
              type: 'api_call',
              description: 'Implement additional security controls',
              apiEndpoint: '/api/security/implement-controls',
              parameters: {
                controls: ['enhanced_monitoring', 'additional_mfa', 'network_segmentation']
              }
            }
          ]
        }
      ]
    }));

    // DDoS Attack Mitigation Runbook
    this.runbooks.set('ddos_mitigation', new SecurityRunbook({
      id: 'ddos_mitigation',
      title: 'DDoS Attack Mitigation',
      description: 'Rapid response to distributed denial of service attacks',
      category: 'incident_response',
      severity: 'high',
      estimatedDuration: 120,
      steps: [
        {
          id: 'attack_detection',
          title: 'Attack Detection and Analysis',
          description: 'Detect and analyze the DDoS attack pattern',
          type: 'automated',
          estimatedTime: 5,
          actions: [
            {
              id: 'analyze_traffic_pattern',
              type: 'analysis',
              description: 'Analyze incoming traffic patterns',
              parameters: {
                type: 'ddos_traffic_analysis',
                timeframe: '5m'
              }
            },
            {
              id: 'identify_attack_vectors',
              type: 'analysis',
              description: 'Identify DDoS attack vectors',
              parameters: {
                type: 'attack_vector_identification'
              }
            }
          ]
        },
        {
          id: 'immediate_mitigation',
          title: 'Immediate Mitigation',
          description: 'Apply immediate mitigation measures',
          type: 'automated',
          estimatedTime: 10,
          actions: [
            {
              id: 'enable_ddos_protection',
              type: 'api_call',
              description: 'Enable DDoS protection services',
              apiEndpoint: '/api/security/ddos-protection/enable',
              parameters: {
                level: 'maximum',
                auto_scaling: true
              }
            },
            {
              id: 'block_attack_sources',
              type: 'command',
              description: 'Block identified attack source IPs',
              command: 'firewall block-ips --list={{attack_source_ips}} --duration=1h'
            },
            {
              id: 'activate_cdn_protection',
              type: 'api_call',
              description: 'Activate CDN-based DDoS protection',
              apiEndpoint: '/api/cdn/ddos-protection/activate',
              parameters: {
                challenge_mode: true,
                rate_limit: true
              }
            }
          ]
        },
        {
          id: 'traffic_analysis',
          title: 'Deep Traffic Analysis',
          description: 'Perform deep analysis of attack traffic',
          type: 'automated',
          estimatedTime: 15,
          actions: [
            {
              id: 'capture_traffic_samples',
              type: 'command',
              description: 'Capture traffic samples for analysis',
              command: 'tcpdump capture --interface=all --duration=300 --output=/analysis/{{incident_id}}.pcap'
            },
            {
              id: 'analyze_attack_signature',
              type: 'analysis',
              description: 'Analyze attack signature and patterns',
              parameters: {
                type: 'attack_signature_analysis',
                traffic_capture: '/analysis/{{incident_id}}.pcap'
              }
            }
          ]
        },
        {
          id: 'scaling_response',
          title: 'Scaling Response',
          description: 'Scale infrastructure to handle attack',
          type: 'automated',
          estimatedTime: 20,
          actions: [
            {
              id: 'auto_scale_resources',
              type: 'api_call',
              description: 'Auto-scale computing resources',
              apiEndpoint: '/api/infrastructure/auto-scale',
              parameters: {
                target_capacity: '200%',
                priority_services: ['api', 'web', 'cdn']
              }
            },
            {
              id: 'activate_standby_infrastructure',
              type: 'api_call',
              description: 'Activate standby infrastructure',
              apiEndpoint: '/api/infrastructure/activate-standby',
              parameters: {
                regions: ['us-west-2', 'eu-west-1'],
                services: 'all'
              }
            }
          ]
        },
        {
          id: 'monitoring_enhancement',
          title: 'Enhanced Monitoring',
          description: 'Enhance monitoring during attack',
          type: 'automated',
          estimatedTime: 10,
          actions: [
            {
              id: 'increase_monitoring_frequency',
              type: 'api_call',
              description: 'Increase monitoring frequency',
              apiEndpoint: '/api/monitoring/frequency',
              parameters: {
                interval: '10s',
                metrics: ['bandwidth', 'connections', 'response_time', 'error_rate']
              }
            },
            {
              id: 'setup_attack_dashboard',
              type: 'api_call',
              description: 'Setup real-time attack monitoring dashboard',
              apiEndpoint: '/api/monitoring/create-dashboard',
              parameters: {
                name: 'DDoS Attack Response - {{incident_id}}',
                metrics: ['attack_volume', 'mitigation_effectiveness', 'service_health']
              }
            }
          ]
        },
        {
          id: 'stakeholder_notification',
          title: 'Stakeholder Notification',
          description: 'Notify stakeholders of the attack',
          type: 'automated',
          estimatedTime: 5,
          actions: [
            {
              id: 'notify_operations_team',
              type: 'notification',
              description: 'Notify operations team',
              parameters: {
                type: 'slack',
                channel: '#security-incidents',
                message: 'DDoS attack detected and mitigation in progress. Attack volume: {{attack_volume}} requests/sec'
              }
            },
            {
              id: 'notify_management',
              type: 'notification',
              description: 'Notify management if attack persists',
              parameters: {
                type: 'email',
                recipients: ['cto@company.com', 'operations@company.com'],
                subject: 'DDoS Attack in Progress',
                message: 'DDoS attack currently being mitigated. Attack details: {{attack_summary}}'
              }
            }
          ]
        },
        {
          id: 'attack_resolution',
          title: 'Attack Resolution',
          description: 'Monitor for attack resolution and recovery',
          type: 'automated',
          estimatedTime: 60,
          actions: [
            {
              id: 'monitor_attack_status',
              type: 'analysis',
              description: 'Monitor attack status and effectiveness of mitigation',
              parameters: {
                type: 'attack_status_monitoring',
                check_interval: '60s',
                resolution_threshold: 'normal_traffic_levels'
              }
            },
            {
              id: 'gradual_mitigation_removal',
              type: 'api_call',
              description: 'Gradually remove mitigation measures as attack subsides',
              apiEndpoint: '/api/security/ddos-protection/scale-down',
              parameters: {
                gradual: true,
                monitor_interval: '300s'
              }
            }
          ]
        }
      ]
    }));

    // Add more runbooks for other scenarios...
    this.addInsiderThreatRunbook();
    this.addMalwareOutbreakRunbook();
    this.addAccountCompromiseRunbook();
    this.addApiAbuseRunbook();
    this.addCertificateExpirationRunbook();
    this.addVulnerabilityDisclosureRunbook();
  }

  private addInsiderThreatRunbook(): void {
    this.runbooks.set('insider_threat_investigation', new SecurityRunbook({
      id: 'insider_threat_investigation',
      title: 'Insider Threat Investigation',
      description: 'Investigation and response to insider threat incidents',
      category: 'investigation',
      severity: 'high',
      estimatedDuration: 720, // 12 hours
      steps: [
        {
          id: 'threat_validation',
          title: 'Threat Validation',
          description: 'Validate the insider threat indicators',
          type: 'manual',
          estimatedTime: 30,
          actions: [
            {
              id: 'review_initial_indicators',
              type: 'analysis',
              description: 'Review initial threat indicators',
              parameters: {
                type: 'threat_indicator_analysis',
                indicators: '{{threat_indicators}}'
              }
            },
            {
              id: 'assess_threat_credibility',
              type: 'analysis',
              description: 'Assess credibility of threat report',
              parameters: {
                type: 'credibility_assessment'
              }
            }
          ]
        },
        {
          id: 'evidence_preservation',
          title: 'Evidence Preservation',
          description: 'Preserve digital evidence before investigation',
          type: 'automated',
          estimatedTime: 60,
          actions: [
            {
              id: 'create_forensic_image',
              type: 'command',
              description: 'Create forensic image of suspect workstation',
              command: 'forensics image --target={{suspect_workstation}} --output=/forensics/{{incident_id}}/workstation.img'
            },
            {
              id: 'preserve_user_data',
              type: 'api_call',
              description: 'Preserve user account data and access logs',
              apiEndpoint: '/api/forensics/preserve-user-data',
              parameters: {
                user_id: '{{suspect_user_id}}',
                timeframe: '90d'
              }
            },
            {
              id: 'backup_email_data',
              type: 'api_call',
              description: 'Backup email and communication data',
              apiEndpoint: '/api/email/backup-user-data',
              parameters: {
                user_id: '{{suspect_user_id}}',
                include_deleted: true
              }
            }
          ]
        }
        // Additional steps would be added here...
      ]
    }));
  }

  private addMalwareOutbreakRunbook(): void {
    this.runbooks.set('malware_outbreak_containment', new SecurityRunbook({
      id: 'malware_outbreak_containment',
      title: 'Malware Outbreak Containment',
      description: 'Rapid containment and remediation of malware outbreaks',
      category: 'incident_response',
      severity: 'critical',
      estimatedDuration: 360, // 6 hours
      steps: [
        {
          id: 'malware_identification',
          title: 'Malware Identification',
          description: 'Identify and classify the malware',
          type: 'automated',
          estimatedTime: 15,
          actions: [
            {
              id: 'scan_infected_systems',
              type: 'command',
              description: 'Perform comprehensive malware scan',
              command: 'antivirus scan --systems={{infected_systems}} --deep-scan --quarantine'
            },
            {
              id: 'analyze_malware_sample',
              type: 'analysis',
              description: 'Analyze malware sample in sandbox',
              parameters: {
                type: 'malware_analysis',
                sample_path: '{{malware_sample_path}}'
              }
            }
          ]
        }
        // Additional steps would be added here...
      ]
    }));
  }

  private addAccountCompromiseRunbook(): void {
    this.runbooks.set('account_compromise_recovery', new SecurityRunbook({
      id: 'account_compromise_recovery',
      title: 'Account Compromise Recovery',
      description: 'Recovery process for compromised user accounts',
      category: 'incident_response',
      severity: 'medium',
      estimatedDuration: 120, // 2 hours
      steps: [
        {
          id: 'account_lockdown',
          title: 'Immediate Account Lockdown',
          description: 'Immediately secure the compromised account',
          type: 'automated',
          estimatedTime: 5,
          actions: [
            {
              id: 'disable_account',
              type: 'api_call',
              description: 'Disable compromised account',
              apiEndpoint: '/api/accounts/disable',
              parameters: {
                user_id: '{{compromised_user_id}}',
                reason: 'Account compromise detected'
              }
            },
            {
              id: 'revoke_all_sessions',
              type: 'api_call',
              description: 'Revoke all active sessions',
              apiEndpoint: '/api/sessions/revoke-all',
              parameters: {
                user_id: '{{compromised_user_id}}'
              }
            }
          ]
        }
        // Additional steps would be added here...
      ]
    }));
  }

  private addApiAbuseRunbook(): void {
    this.runbooks.set('api_abuse_handling', new SecurityRunbook({
      id: 'api_abuse_handling',
      title: 'API Abuse Handling',
      description: 'Handle API abuse and rate limit violations',
      category: 'incident_response',
      severity: 'medium',
      estimatedDuration: 60, // 1 hour
      steps: [
        {
          id: 'abuse_detection',
          title: 'API Abuse Detection',
          description: 'Detect and analyze API abuse patterns',
          type: 'automated',
          estimatedTime: 10,
          actions: [
            {
              id: 'analyze_api_traffic',
              type: 'analysis',
              description: 'Analyze API traffic patterns',
              parameters: {
                type: 'api_traffic_analysis',
                timeframe: '1h'
              }
            }
          ]
        }
        // Additional steps would be added here...
      ]
    }));
  }

  private addCertificateExpirationRunbook(): void {
    this.runbooks.set('certificate_expiration_management', new SecurityRunbook({
      id: 'certificate_expiration_management',
      title: 'Certificate Expiration Management',
      description: 'Manage expiring SSL/TLS certificates',
      category: 'maintenance',
      severity: 'medium',
      estimatedDuration: 180, // 3 hours
      steps: [
        {
          id: 'certificate_inventory',
          title: 'Certificate Inventory',
          description: 'Inventory all certificates and expiration dates',
          type: 'automated',
          estimatedTime: 30,
          actions: [
            {
              id: 'scan_certificates',
              type: 'command',
              description: 'Scan all certificates across infrastructure',
              command: 'cert-scanner scan --all-domains --output=/certs/inventory.json'
            }
          ]
        }
        // Additional steps would be added here...
      ]
    }));
  }

  private addVulnerabilityDisclosureRunbook(): void {
    this.runbooks.set('vulnerability_disclosure_response', new SecurityRunbook({
      id: 'vulnerability_disclosure_response',
      title: 'Vulnerability Disclosure Response',
      description: 'Response to external vulnerability disclosures',
      category: 'vulnerability_management',
      severity: 'high',
      estimatedDuration: 480, // 8 hours
      steps: [
        {
          id: 'disclosure_triage',
          title: 'Disclosure Triage',
          description: 'Triage and validate the vulnerability disclosure',
          type: 'manual',
          estimatedTime: 60,
          actions: [
            {
              id: 'validate_vulnerability',
              type: 'analysis',
              description: 'Validate reported vulnerability',
              parameters: {
                type: 'vulnerability_validation',
                report: '{{vulnerability_report}}'
              }
            }
          ]
        }
        // Additional steps would be added here...
      ]
    }));
  }
}

/**
 * Security Runbook class
 */
export class SecurityRunbook {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string;
  public readonly category: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly estimatedDuration: number; // minutes
  public readonly steps: RunbookStep[];
  public readonly tags?: string[];
  public readonly version: string;
  public readonly lastUpdated: Date;

  constructor(config: {
    id: string;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: number;
    steps: RunbookStep[];
    tags?: string[];
    version?: string;
  }) {
    this.id = config.id;
    this.title = config.title;
    this.description = config.description;
    this.category = config.category;
    this.severity = config.severity;
    this.estimatedDuration = config.estimatedDuration;
    this.steps = config.steps;
    this.tags = config.tags;
    this.version = config.version || '1.0.0';
    this.lastUpdated = new Date();
  }

  /**
   * Get runbook summary
   */
  getSummary(): {
    id: string;
    title: string;
    category: string;
    severity: string;
    estimatedDuration: number;
    stepCount: number;
    automatedSteps: number;
    manualSteps: number;
  } {
    const automatedSteps = this.steps.filter(step => step.type === 'automated').length;
    const manualSteps = this.steps.filter(step => step.type === 'manual').length;

    return {
      id: this.id,
      title: this.title,
      category: this.category,
      severity: this.severity,
      estimatedDuration: this.estimatedDuration,
      stepCount: this.steps.length,
      automatedSteps,
      manualSteps
    };
  }

  /**
   * Validate runbook structure
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!this.id) errors.push('ID is required');
    if (!this.title) errors.push('Title is required');
    if (!this.steps || this.steps.length === 0) errors.push('At least one step is required');

    // Validate steps
    for (const [index, step] of this.steps.entries()) {
      if (!step.id) errors.push(`Step ${index + 1}: ID is required`);
      if (!step.title) errors.push(`Step ${index + 1}: Title is required`);
      if (!step.actions || step.actions.length === 0) {
        errors.push(`Step ${index + 1}: At least one action is required`);
      }

      // Validate actions
      for (const [actionIndex, action] of step.actions.entries()) {
        if (!action.id) {
          errors.push(`Step ${index + 1}, Action ${actionIndex + 1}: ID is required`);
        }
        if (!action.type) {
          errors.push(`Step ${index + 1}, Action ${actionIndex + 1}: Type is required`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export { SecurityRunbooks };
