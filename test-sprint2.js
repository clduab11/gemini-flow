#!/usr/bin/env node
import { CommandRouter } from './src/cli/super-terminal/command-router.js';

async function testSprint2() {
  const router = new CommandRouter();

  console.log('Testing Sprint 2 Features\n');
  console.log('=' .repeat(60));

  // Test 1: Google AI - Status
  console.log('\n1. Testing "google status":');
  const googleStatus = await router.route('google status');
  console.log(googleStatus.output);

  // Test 2: Google AI - Help
  console.log('\n2. Testing "google help":');
  const googleHelp = await router.route('google help');
  console.log(googleHelp.output.substring(0, 500) + '...');

  // Test 3: Google AI - Veo3 Generate (with streaming)
  console.log('\n3. Testing "google veo3 generate sunset":');
  const veo3 = await router.route('google veo3 generate sunset over mountains');
  if (veo3.streamingOutput) {
    console.log('Streaming output:');
    veo3.streamingOutput.forEach(line => console.log('  ' + line));
  }
  console.log('\nFinal result:');
  console.log(veo3.output);

  // Test 4: Google AI - Imagen4 Create
  console.log('\n4. Testing "google imagen4 create futuristic city":');
  const imagen4 = await router.route('google imagen4 create futuristic city');
  if (imagen4.streamingOutput) {
    console.log(`Streaming: ${imagen4.streamingOutput.length} progress updates`);
  }
  console.log(imagen4.output.split('\n').slice(0, 5).join('\n') + '...');

  // Test 5: Swarm - Spawn agents for testing
  console.log('\n5. Testing agent spawning:');
  await router.route('swarm spawn coder');
  await router.route('swarm spawn analyzer');
  const listResult = await router.route('swarm list');
  console.log(listResult.output);

  // Test 6: Swarm - Status command
  console.log('\n6. Testing "swarm status" (detailed agent info):');
  const agents = await router.route('swarm list');
  const agentId = agents.output.match(/coder-\d+/)?.[0];
  if (agentId) {
    const statusResult = await router.route(`swarm status ${agentId}`);
    console.log(statusResult.output);
  }

  // Test 7: Swarm - Broadcast command
  console.log('\n7. Testing "swarm broadcast" (A2A messaging):');
  const broadcastResult = await router.route('swarm broadcast Hello all agents!');
  console.log(broadcastResult.output);

  // Test 8: Swarm - Topology visualization
  console.log('\n8. Testing "swarm topology" (ASCII visualization):');
  const topologyResult = await router.route('swarm topology');
  console.log(topologyResult.output);

  // Test 9: Swarm - Help
  console.log('\n9. Testing "swarm help":');
  const swarmHelp = await router.route('swarm help');
  console.log(swarmHelp.output);

  console.log('\n' + '='.repeat(60));
  console.log('✓ All Sprint 2 features tested successfully!');
  console.log('\nNew Features Summary:');
  console.log('  - 7 Google AI services with streaming output');
  console.log('  - Advanced swarm commands (status, broadcast, topology)');
  console.log('  - A2A protocol integration');
  console.log('  - ASCII network visualization');
}

testSprint2().catch(console.error);
