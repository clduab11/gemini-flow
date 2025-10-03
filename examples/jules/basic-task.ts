/**
 * Jules Tools Integration - Basic Example
 * 
 * Demonstrates basic usage of Jules integration with agent swarm
 */

import {
  JulesCliWrapper,
  JulesTaskOrchestrator,
  JulesConfig,
  JulesTaskParams,
} from '@clduab11/gemini-flow';

async function main() {
  // Configuration
  const config: JulesConfig = {
    apiKey: process.env.JULES_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepository: 'owner/repo',
  };

  // Initialize orchestrator with quantum optimization and consensus
  const orchestrator = new JulesTaskOrchestrator(config, {
    enableQuantumOptimization: true,
    enableConsensus: true,
    consensusThreshold: 0.67,
    swarmTopology: 'hierarchical',
  });

  await orchestrator.initialize();
  console.log('✅ Jules orchestrator initialized');

  // Create a feature task
  const taskParams: JulesTaskParams = {
    title: 'Implement user authentication',
    description: 'Add OAuth 2.0 authentication with Google Sign-In',
    type: 'feature',
    priority: 'high',
    branch: 'feature/oauth-auth',
    baseBranch: 'main',
    files: [
      'src/auth/oauth-provider.ts',
      'src/auth/auth-middleware.ts',
      'src/routes/auth-routes.ts',
    ],
  };

  console.log('\n📋 Creating task:', taskParams.title);

  // Orchestrate the task
  const result = await orchestrator.orchestrateTask(taskParams);

  console.log('\n✅ Task orchestrated successfully!');
  console.log('  Task ID:', result.task.id);
  console.log('  Status:', result.task.status);
  console.log('  Agents Used:', result.metadata.agentsUsed);
  console.log('  Quality Score:', (result.metadata.qualityScore * 100).toFixed(1) + '%');

  if (result.consensusResult) {
    console.log('  Consensus:', result.consensusResult.achieved ? '✓ Achieved' : '✗ Not achieved');
    console.log('  Agreement:', (result.consensusResult.agreement * 100).toFixed(1) + '%');
  }

  if (result.quantumOptimization?.applied) {
    console.log('  Quantum Optimization:', (result.quantumOptimization.gain * 100).toFixed(1) + '% gain');
  }

  // Monitor task progress
  console.log('\n📡 Monitoring task progress...');
  const finalTask = await orchestrator.monitorTask(result.task.id, (status) => {
    console.log('  Status update:', status);
  });

  console.log('\n✅ Task completed!');
  console.log('  Final Status:', finalTask.status);
  
  if (finalTask.result?.pullRequest) {
    console.log('  Pull Request:', finalTask.result.pullRequest.url);
  }
}

main().catch(console.error);
