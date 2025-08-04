/**
 * Complete GitHub A2A Integration Example
 * Demonstrates the full capabilities of the GitHub A2A cross-agent collaboration system
 */

import { GitHubA2AIntegrationManager, IntegrationConfig } from '../src/core/github-a2a-integration-manager.js';

async function main() {
  console.log('🚀 Starting GitHub A2A Integration Complete Example\n');

  // 1. Configure the integration system
  const config: IntegrationConfig = {
    bridge: {
      github: {
        token: process.env.GITHUB_TOKEN || 'your-github-token',
        apiUrl: 'https://api.github.com',
        enterprise: false
      },
      a2a: {
        maxAgents: 20,
        topology: 'hierarchical',
        security: 'high',
        crossRepo: true,
        enable_cross_repo: true,
        enable_pr_automation: true,
        enable_issue_tracking: true,
        enable_cicd_orchestration: true,
        enable_actions_spawning: true
      },
      workflows: {
        prReview: true,
        issueTracking: true,
        cicd: true,
        release: true,
        auto_assignment: true,
        smart_routing: true,
        load_balancing: true,
        fault_tolerance: true
      },
      integration: {
        webhook_secret: process.env.WEBHOOK_SECRET,
        api_rate_limit: 5000,
        batch_size: 10,
        retry_attempts: 3,
        health_check_interval: 30
      },
      monitoring: {
        metrics_enabled: true,
        logging_level: 'info',
        performance_tracking: true,
        cost_tracking: true
      }
    },
    deployment: {
      environment: 'development',
      scaling_mode: 'auto',
      high_availability: false,
      multi_region: false
    },
    features: {
      enable_dashboard: true,
      enable_api: true,
      enable_cli: true,
      enable_webhooks: true,
      enable_metrics: true
    },
    integrations: {
      slack: {
        webhook_url: process.env.SLACK_WEBHOOK_URL || '',
        channels: {
          alerts: '#alerts',
          notifications: '#notifications',
          reports: '#reports'
        },
        mention_users: ['@devops-team']
      },
      email: {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        username: process.env.EMAIL_USERNAME || '',
        password: process.env.EMAIL_PASSWORD || '',
        from_address: 'github-a2a@example.com',
        notification_lists: {
          alerts: ['admin@example.com'],
          reports: ['team@example.com']
        }
      }
    }
  };

  // 2. Initialize the integration manager
  const integrationManager = new GitHubA2AIntegrationManager(config);
  
  try {
    await integrationManager.initialize();
    console.log('✅ Integration system initialized successfully\n');

    // 3. Demonstrate different operation types
    await demonstrateOperations(integrationManager);

    // 4. Show system monitoring capabilities
    await demonstrateMonitoring(integrationManager);

    // 5. Demonstrate CLI interface
    await demonstrateCLI(integrationManager);

    // 6. Show dashboard capabilities
    await demonstrateDashboard(integrationManager);

    // 7. Demonstrate webhook handling
    await demonstrateWebhooks(integrationManager);

    console.log('\n🎉 All demonstrations completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    // Cleanup
    await integrationManager.shutdown();
    console.log('🛑 Integration system shut down gracefully');
  }
}

/**
 * Demonstrate various GitHub operations with A2A coordination
 */
async function demonstrateOperations(manager: GitHubA2AIntegrationManager) {
  console.log('📋 Demonstrating GitHub A2A Operations...\n');

  // 1. PR Review Operation
  console.log('1️⃣ Processing Pull Request Review with A2A Agents...');
  try {
    const prOperationId = await manager.processGitHubOperation({
      type: 'pr_review',
      repository: 'clduab11/gemini-flow',
      data: {
        repository: 'clduab11/gemini-flow',
        pr_number: 123,
        head_sha: 'abc123',
        base_sha: 'def456',
        files_changed: [
          {
            filename: 'src/core/new-feature.ts',
            status: 'added',
            additions: 150,
            deletions: 0,
            changes: 150
          },
          {
            filename: 'src/tests/new-feature.test.ts',
            status: 'added',
            additions: 75,
            deletions: 0,
            changes: 75
          }
        ],
        author: 'developer123',
        title: 'Add new A2A coordination feature',
        description: 'This PR implements new A2A coordination capabilities with enhanced security and performance.',
        labels: [{ name: 'feature', color: 'green' }, { name: 'needs-review', color: 'yellow' }],
        reviewers: ['senior-dev', 'security-expert'],
        assignees: ['developer123']
      },
      priority: 'high',
      requester: 'github-user'
    });
    
    console.log(`   ✅ PR Review operation started: ${prOperationId}`);
  } catch (error) {
    console.error(`   ❌ PR Review failed: ${error}`);
  }

  // 2. Issue Triage Operation
  console.log('\n2️⃣ Processing Issue Triage with A2A Agents...');
  try {
    const issueOperationId = await manager.processGitHubOperation({
      type: 'issue_triage',
      repository: 'clduab11/gemini-flow',
      data: {
        id: 456,
        number: 456,
        title: 'A2A agents not scaling properly under high load',
        body: 'When the system experiences high load, A2A agents are not scaling up as expected. This causes delays in processing operations.',
        state: 'open',
        repository: 'clduab11/gemini-flow',
        author: 'user456',
        assignees: [],
        labels: [{ name: 'bug', color: 'red' }, { name: 'priority-high', color: 'orange' }],
        created_at: new Date(),
        updated_at: new Date(),
        comments: 0,
        reactions: { '+1': 3, 'eyes': 2 },
        linked_prs: []
      },
      priority: 'critical',
      requester: 'github-user'
    });
    
    console.log(`   ✅ Issue Triage operation started: ${issueOperationId}`);
  } catch (error) {
    console.error(`   ❌ Issue Triage failed: ${error}`);
  }

  // 3. Cross-Repository Sync Operation
  console.log('\n3️⃣ Processing Cross-Repository Sync with A2A Agents...');
  try {
    const syncOperationId = await manager.processGitHubOperation({
      type: 'cross_repo_sync',
      repository: 'clduab11/gemini-flow',
      data: {
        source_repo: 'clduab11/gemini-flow',
        target_repos: ['clduab11/claude-flow', 'clduab11/ruv-swarm'],
        sync_type: 'dependencies',
        include_patterns: ['package.json', 'src/shared/**'],
        exclude_patterns: ['node_modules/**', '*.test.ts'],
        validation_required: true,
        auto_approve: false
      },
      priority: 'medium',
      requester: 'devops-team'
    });
    
    console.log(`   ✅ Cross-Repo Sync operation started: ${syncOperationId}`);
  } catch (error) {
    console.error(`   ❌ Cross-Repo Sync failed: ${error}`);
  }

  // 4. CI/CD Pipeline Operation
  console.log('\n4️⃣ Processing CI/CD Pipeline with A2A Orchestration...');
  try {
    const pipelineOperationId = await manager.processGitHubOperation({
      type: 'cicd_pipeline',
      repository: 'clduab11/gemini-flow',
      data: {
        name: 'A2A Integration Pipeline',
        repository: 'clduab11/gemini-flow',
        branch: 'main',
        trigger: 'push',
        stages: [
          {
            id: 'build',
            name: 'Build and Test',
            type: 'build',
            dependencies: [],
            parallel: false,
            required_agents: ['coordinator', 'tester'],
            jobs: [
              {
                id: 'build-job',
                name: 'Build Application',
                agent_type: 'coordinator',
                command: 'npm run build',
                resources: { cpu: '1', memory: '2Gi', storage: '5Gi' },
                status: 'pending'
              },
              {
                id: 'test-job',
                name: 'Run Tests',
                agent_type: 'tester',
                command: 'npm test',
                resources: { cpu: '500m', memory: '1Gi', storage: '2Gi' },
                status: 'pending'
              }
            ],
            retry_policy: {
              max_attempts: 3,
              backoff_strategy: 'exponential',
              base_delay: 30,
              max_delay: 300,
              retry_conditions: ['exit_code_non_zero', 'timeout']
            },
            timeout: 15,
            environment_vars: { NODE_ENV: 'test' },
            artifacts: [
              {
                name: 'build-output',
                path: 'dist/',
                retention_days: 7,
                required: true
              }
            ],
            status: 'pending'
          },
          {
            id: 'security',
            name: 'Security Scan',
            type: 'security',
            dependencies: ['build'],
            parallel: false,
            required_agents: ['security'],
            jobs: [
              {
                id: 'security-scan',
                name: 'Vulnerability Scan',
                agent_type: 'security',
                command: 'npm audit',
                resources: { cpu: '500m', memory: '1Gi', storage: '1Gi' },
                status: 'pending'
              }
            ],
            retry_policy: {
              max_attempts: 2,
              backoff_strategy: 'linear',
              base_delay: 60,
              max_delay: 120,
              retry_conditions: ['timeout']
            },
            timeout: 10,
            environment_vars: {},
            artifacts: [],
            status: 'pending'
          }
        ],
        agents_assigned: {},
        environment: 'staging',
        status: 'idle'
      },
      priority: 'high',
      requester: 'ci-system'
    });
    
    console.log(`   ✅ CI/CD Pipeline operation started: ${pipelineOperationId}`);
  } catch (error) {
    console.error(`   ❌ CI/CD Pipeline failed: ${error}`);
  }

  // 5. GitHub Actions Spawning Operation
  console.log('\n5️⃣ Processing GitHub Actions with A2A Agent Spawning...');
  try {
    const actionOperationId = await manager.processGitHubOperation({
      type: 'action_spawn',
      repository: 'clduab11/gemini-flow',
      data: {
        name: 'A2A Deployment Action',
        repository: 'clduab11/gemini-flow',
        workflow_file: '.github/workflows/a2a-deploy.yml',
        trigger_events: [
          { event: 'push', branches: ['main'] },
          { event: 'workflow_dispatch' }
        ],
        inputs: [
          {
            name: 'environment',
            description: 'Deployment environment',
            required: true,
            type: 'choice',
            options: ['staging', 'production']
          }
        ],
        outputs: [
          {
            name: 'deployment-url',
            description: 'URL of deployed application',
            value: '${{ steps.deploy.outputs.url }}'
          }
        ],
        agent_spawning: {
          strategy: 'on_demand',
          max_agents: 5,
          agent_types: [
            {
              type: 'coordinator',
              min_instances: 1,
              max_instances: 2,
              scaling_threshold: 3,
              capabilities: ['deployment', 'monitoring'],
              resource_requirements: { cpu: '1', memory: '2Gi', storage: '5Gi' },
              specializations: ['kubernetes', 'docker']
            }
          ],
          scaling_policy: {
            scale_up_threshold: 80,
            scale_down_threshold: 20,
            scale_up_cooldown: 300,
            scale_down_cooldown: 600,
            metrics: [
              {
                metric_name: 'cpu_usage',
                threshold: 75,
                comparison: 'greater_than',
                duration: 180,
                weight: 1.0
              }
            ]
          },
          resource_limits: {
            total_cpu: '4',
            total_memory: '8Gi',
            total_storage: '20Gi',
            max_concurrent_tasks: 10,
            max_execution_time: 30
          },
          lifecycle_management: {
            startup_timeout: 120,
            health_check_interval: 30,
            max_idle_time: 300,
            graceful_shutdown_timeout: 60,
            auto_restart: true,
            failure_threshold: 3
          }
        },
        execution_context: {
          runner_type: 'github',
          runner_labels: [],
          environment_variables: {
            DEPLOY_ENV: 'staging'
          },
          secrets_required: ['DEPLOY_TOKEN'],
          artifacts_access: ['build-artifacts'],
          cache_configuration: {
            enabled: true,
            key_pattern: 'deploy-cache-${{ hashFiles("Dockerfile") }}',
            paths: ['.docker-cache'],
            restore_keys: ['deploy-cache-']
          }
        },
        permissions: {
          contents: 'read',
          issues: 'write',
          pull_requests: 'write',
          checks: 'write',
          actions: 'read',
          security_events: 'read',
          deployments: 'write',
          packages: 'read'
        },
        environment: {
          name: 'staging',
          protection_rules: [
            { type: 'wait_timer', wait_minutes: 2 }
          ],
          variables: { DEPLOY_REGION: 'us-east-1' },
          secrets: ['DEPLOY_TOKEN']
        }
      },
      priority: 'medium',
      requester: 'github-actions'
    });
    
    console.log(`   ✅ GitHub Actions operation started: ${actionOperationId}`);
  } catch (error) {
    console.error(`   ❌ GitHub Actions failed: ${error}`);
  }

  console.log('\n✅ All operation demonstrations completed!\n');
}

/**
 * Demonstrate system monitoring and status reporting
 */
async function demonstrateMonitoring(manager: GitHubA2AIntegrationManager) {
  console.log('📊 Demonstrating System Monitoring...\n');

  // Get comprehensive system status
  const status = manager.getSystemStatus();
  
  console.log('📈 System Status Report:');
  console.log(`   Overall Health: ${status.overall_health}`);
  console.log(`   Total Agents: ${status.agents.total} (Active: ${status.agents.active}, Idle: ${status.agents.idle})`);
  console.log(`   Active Operations: ${status.operations.total_active}`);
  console.log(`   Success Rate: ${status.operations.success_rate.toFixed(1)}%`);
  console.log(`   Average Duration: ${status.operations.average_duration.toFixed(0)}ms`);
  
  console.log('\n🔧 Component Status:');
  Object.entries(status.components).forEach(([component, componentStatus]: [string, any]) => {
    console.log(`   ${component}: ${componentStatus.status} (uptime: ${Math.floor(componentStatus.uptime / 1000)}s)`);
  });
  
  console.log('\n💰 Cost Metrics:');
  console.log(`   Current Period: $${status.costs.current_period.toFixed(2)}`);
  console.log(`   Projected Monthly: $${status.costs.projected_monthly.toFixed(2)}`);
  console.log(`   Cost per Operation: $${status.costs.cost_per_operation.toFixed(4)}`);
  
  console.log('\n📦 Resource Usage:');
  console.log(`   CPU: ${status.resources.cpu_usage}%`);
  console.log(`   Memory: ${status.resources.memory_usage}%`);
  console.log(`   Storage: ${status.resources.storage_usage}%`);
  console.log(`   Network: ${status.resources.network_usage}%`);
  
  console.log('\n✅ Monitoring demonstration completed!\n');
}

/**
 * Demonstrate CLI interface capabilities
 */
async function demonstrateCLI(manager: GitHubA2AIntegrationManager) {
  console.log('💻 Demonstrating CLI Interface...\n');

  try {
    // Execute status command
    console.log('🔍 Executing CLI command: status');
    const statusResult = await manager.executeCLICommand('status', []);
    console.log(`   Status retrieved: ${statusResult.overall_health}`);

    // Execute agents command
    console.log('\n👥 Executing CLI command: agents');
    const agentsResult = await manager.executeCLICommand('agents', []);
    console.log(`   Agents listed: ${agentsResult.agents.length} agents found`);

    // Execute operations command
    console.log('\n⚙️ Executing CLI command: operations');
    const operationsResult = await manager.executeCLICommand('operations', []);
    console.log(`   Operations listed: ${operationsResult.operations.length} operations found`);

    console.log('\n✅ CLI demonstration completed!\n');
    
  } catch (error) {
    console.error(`   ❌ CLI command failed: ${error}`);
  }
}

/**
 * Demonstrate dashboard capabilities
 */
async function demonstrateDashboard(manager: GitHubA2AIntegrationManager) {
  console.log('📊 Demonstrating Dashboard Capabilities...\n');

  try {
    const dashboardData = await manager.getDashboardData();
    
    console.log('📱 Dashboard Data Summary:');
    console.log(`   System Health: ${dashboardData.system_health.overall}`);
    console.log(`   Active Operations: ${dashboardData.active_operations.length}`);
    console.log(`   Agent Utilization: ${dashboardData.agent_performance.utilization.toFixed(1)}%`);
    console.log(`   Total Cost: $${dashboardData.cost_metrics.current_period.toFixed(2)}`);
    console.log(`   Recent Activities: ${dashboardData.recent_activities.length}`);
    console.log(`   Active Alerts: ${dashboardData.alerts.length}`);
    
    console.log('\n💡 Dashboard accessible at: http://localhost:3000');
    console.log('✅ Dashboard demonstration completed!\n');
    
  } catch (error) {
    console.error(`   ❌ Dashboard access failed: ${error}`);
  }
}

/**
 * Demonstrate webhook handling
 */
async function demonstrateWebhooks(manager: GitHubA2AIntegrationManager) {
  console.log('🔗 Demonstrating Webhook Handling...\n');

  // Simulate incoming PR webhook
  console.log('📥 Simulating PR webhook...');
  const prWebhookPayload = {
    action: 'opened',
    pull_request: {
      number: 789,
      title: 'Add webhook demonstration',
      body: 'This PR demonstrates webhook handling capabilities',
      user: { login: 'webhook-user' },
      head: { sha: 'webhook123' },
      base: { sha: 'main456' },
      labels: [{ name: 'documentation' }],
      requested_reviewers: [],
      assignees: []
    },
    repository: {
      full_name: 'clduab11/gemini-flow'
    }
  };

  const prWebhookHeaders = {
    'x-github-event': 'pull_request',
    'x-github-delivery': 'webhook123'
  };

  try {
    await manager.handleWebhook(prWebhookPayload, prWebhookHeaders);
    console.log('   ✅ PR webhook processed successfully');
  } catch (error) {
    console.error(`   ❌ PR webhook failed: ${error}`);
  }

  // Simulate incoming issue webhook
  console.log('\n📥 Simulating Issue webhook...');
  const issueWebhookPayload = {
    action: 'opened',
    issue: {
      id: 999,
      number: 999,
      title: 'Webhook integration not working',
      body: 'The webhook integration seems to have issues with payload processing',
      state: 'open',
      user: { login: 'issue-reporter' },
      labels: [{ name: 'bug' }],
      assignees: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    repository: {
      full_name: 'clduab11/gemini-flow'
    }
  };

  const issueWebhookHeaders = {
    'x-github-event': 'issues',
    'x-github-delivery': 'webhook456'
  };

  try {
    await manager.handleWebhook(issueWebhookPayload, issueWebhookHeaders);
    console.log('   ✅ Issue webhook processed successfully');
  } catch (error) {
    console.error(`   ❌ Issue webhook failed: ${error}`);
  }

  console.log('\n🔗 Webhook endpoints:');
  console.log('   GitHub Webhooks: http://localhost:9000/github');
  console.log('   Health Check: http://localhost:9000/health');
  console.log('✅ Webhook demonstration completed!\n');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main as runGitHubA2AExample };