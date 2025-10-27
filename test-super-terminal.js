#!/usr/bin/env node
import { CommandRouter } from './src/cli/super-terminal/command-router.js';

async function testCommands() {
  const router = new CommandRouter();

  console.log('Testing Super Terminal Commands\n');
  console.log('=' .repeat(50));

  // Test 1: Help command
  console.log('\n1. Testing "help" command:');
  const helpResult = await router.route('help');
  console.log(helpResult.output);

  // Test 2: Status command
  console.log('\n2. Testing "status" command:');
  const statusResult = await router.route('status');
  console.log(statusResult.output);
  console.log('Metrics:', statusResult.metrics);

  // Test 3: Swarm list (empty)
  console.log('\n3. Testing "swarm list" command (should be empty):');
  const listResult1 = await router.route('swarm list');
  console.log(listResult1.output);

  // Test 4: Swarm spawn coder
  console.log('\n4. Testing "swarm spawn coder" command:');
  const spawnResult = await router.route('swarm spawn coder');
  console.log(spawnResult.output);
  console.log('Metrics:', spawnResult.metrics);

  // Test 5: Swarm list (should show agent)
  console.log('\n5. Testing "swarm list" command (should show 1 agent):');
  const listResult2 = await router.route('swarm list');
  console.log(listResult2.output);

  console.log('\n' + '='.repeat(50));
  console.log('All tests completed successfully!');
}

testCommands().catch(console.error);
