/** Using Vitest for unit testing (auto-detected). */
/**
 * Unit tests for SimpleGeminiCLI
 * Testing framework: (auto-detected; replaced below)
 * Notes:
 * - We mock console and process state (argv, env) per test.
 * - We dynamically import the CLI module AFTER setting argv to '--help' to avoid main() exiting the test process.
 * - We validate public behaviors for: help/version, chat, generate, list-models, auth, config, doctor, and run() dispatch.
 */
