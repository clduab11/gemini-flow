/**
 * Gemini-Flow Basic Project
 * Entry point for AI-powered automation
 */

import { GeminiFlow } from "gemini-flow";

async function main() {
  const flow = new GeminiFlow();

  // Initialize swarm
  await flow.swarm.init({
    topology: "hierarchical",
    agents: 5,
  });

  // Orchestrate task
  const result = await flow.orchestrate("Build a simple web server");

  console.log("Task completed:", result);
}

main().catch(console.error);
