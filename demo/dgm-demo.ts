/**
 * DGM System Demo
 * 
 * Demonstrates the Darwin Gödel Machine capabilities
 */

import { createDGMSystem, DGMSystemFactory } from '../src/core/dgm/index.js';
import { Logger } from '../src/utils/logger.js';

const logger = new Logger('DGMDemo');

async function runDGMDemo() {
  console.log('🧬 Darwin Gödel Machine (DGM) System Demo');
  console.log('=' .repeat(50));
  
  try {
    // 1. Create a balanced DGM system
    console.log('\n1. Creating DGM System...');
    const dgmSystem = DGMSystemFactory.createBalanced(process.cwd());
    
    // 2. Initialize the system
    console.log('\n2. Initializing DGM...');
    await dgmSystem.initialize();
    console.log('✅ DGM system initialized successfully');
    
    // 3. Get initial system status
    const initialStatus = dgmSystem.getSystemStatus();
    console.log(`\n3. Initial System Health: ${initialStatus.systemHealth.toFixed(1)}%`);
    console.log(`   Debt Metrics:`, Object.entries(initialStatus.debtMetrics)
      .map(([key, value]) => `${key}: ${((value as number) * 100).toFixed(1)}%`)
      .join(', '));
    
    // 4. Start the system
    console.log('\n4. Starting DGM System...');
    await dgmSystem.start();
    console.log('✅ DGM system is now active');
    
    // 5. Execute an evolution cycle
    console.log('\n5. Executing Evolution Cycle...');
    const evolutionReport = await dgmSystem.executeEvolutionCycle();
    
    console.log(`\n📊 Evolution Results:`);
    console.log(`   Strategies Evaluated: ${evolutionReport.strategiesEvaluated}`);
    console.log(`   Fitness Improvement: ${evolutionReport.fitnessImprovement > 0 ? '+' : ''}${evolutionReport.fitnessImprovement.toFixed(3)}`);
    console.log(`   Patterns Archived: ${evolutionReport.patternsArchived}`);
    console.log(`   Status: ${evolutionReport.status}`);
    console.log(`   Execution Time: ${evolutionReport.executionTime}ms`);
    
    if (evolutionReport.bestStrategy) {
      console.log(`\n🏆 Best Strategy: ${evolutionReport.bestStrategy.name}`);
      console.log(`   Fitness Score: ${evolutionReport.bestStrategy.fitness.toFixed(3)}`);
      console.log(`   Generation: ${evolutionReport.bestStrategy.generation}`);
    }
    
    if (evolutionReport.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      evolutionReport.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    // 6. Generate system insights
    console.log('\n6. Generating System Insights...');
    const insights = await dgmSystem.generateSystemInsights();
    
    console.log(`\n🧠 System Insights:`);
    if (insights.evolutionInsights.length > 0) {
      console.log(`   Evolution: ${insights.evolutionInsights[0]}`);
    }
    if (insights.patternInsights.length > 0) {
      console.log(`   Patterns: ${insights.patternInsights[0]}`);
    }
    if (insights.performanceInsights.length > 0) {
      console.log(`   Performance: ${insights.performanceInsights[0]}`);
    }
    
    // 7. Query archived patterns
    console.log('\n7. Querying Archived Patterns...');
    const patterns = await dgmSystem.queryPatterns({
      minFitnessScore: 0.5,
      limit: 3
    });
    
    console.log(`\n📚 Found ${patterns.length} archived patterns`);
    patterns.forEach((pattern, i) => {
      console.log(`   ${i + 1}. ${pattern.strategy.name} - Fitness: ${pattern.successMetrics.fitnessScore.toFixed(3)}`);
    });
    
    // 8. Final status
    const finalStatus = dgmSystem.getSystemStatus();
    console.log(`\n8. Final System Health: ${finalStatus.systemHealth.toFixed(1)}%`);
    const improvement = finalStatus.systemHealth - initialStatus.systemHealth;
    console.log(`   Health Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
    
    // 9. Evolution history
    const history = dgmSystem.getEvolutionHistory(5);
    console.log(`\n📈 Evolution History: ${history.length} cycles completed`);
    
    // 10. Stop the system
    console.log('\n9. Stopping DGM System...');
    await dgmSystem.stop();
    console.log('✅ DGM system stopped successfully');
    
    console.log('\n🎉 DGM Demo Complete!');
    console.log('\nThe Darwin Gödel Machine has demonstrated:');
    console.log('• Baseline establishment and validation framework');
    console.log('• Evolutionary strategy generation and A/B testing');
    console.log('• Fitness evaluation and benchmarking');
    console.log('• Pattern archiving for future learning');
    console.log('• Autonomous monitoring and recommendations');
    console.log('• Continuous system improvement capabilities');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDGMDemo();
}

export { runDGMDemo };