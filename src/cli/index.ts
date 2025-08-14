#!/usr/bin/env node
/**
 * Gemini-Flow - AI Orchestration Platform CLI
 *
 * Main CLI entry point with full orchestration capabilities and simple mode fallback
 */

const args = process.argv.slice(2);
const isSimpleMode =
  process.env.GEMINI_FLOW_SIMPLE_MODE === "true" ||
  args.includes("--simple-mode") ||
  (args.length > 0 &&
    ["chat", "c", "generate", "g", "list-models", "models", "auth"].includes(
      args[0],
    ));

if (isSimpleMode) {
  // Use simplified CLI for basic Gemini commands
  import("./simple-index.js").catch((error) => {
    console.error("Failed to load simple CLI:", error.message);
    process.exit(1);
  });
} else {
  // Use full orchestration platform CLI
  import("./full-index.js").catch((error) => {
    console.error("Failed to load full CLI, falling back to simple mode...");
    // Fallback to simple CLI if full CLI fails
    import("./simple-index.js").catch((fallbackError) => {
      console.error("Failed to load fallback CLI:", fallbackError.message);
      process.exit(1);
    });
  });
}
