#!/usr/bin/env node
/**
 * Learn Command - Style learning from codebase patterns
 * Implements Command Bible learn functionality
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { ModelOrchestrator } from "../../core/model-orchestrator.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const logger = new Logger("Learn");

export class LearnCommand extends Command {
  constructor() {
    super("learn");

    this.description(
      "Learn coding style and patterns from codebase for AI-powered code generation",
    )
      .option(
        "--from <path>",
        "Path to learn from (repository or directory)",
        ".",
      )
      .option(
        "--days <number>",
        "Number of days of history to analyze",
        parseInt,
        30,
      )
      .option(
        "--languages <list>",
        "Comma-separated list of languages to focus on",
      )
      .option(
        "--patterns <types>",
        "Pattern types to learn (architecture,style,naming,testing)",
        "architecture,style,naming",
      )
      .option("--save-profile <name>", "Save learned profile with name")
      .option("--output <file>", "Output learned patterns to file")
      .option("--interactive", "Interactive learning mode with feedback")
      .option("--deep-learning", "Enable deep pattern analysis")
      .option(
        "--context-window <size>",
        "Context window size for analysis",
        parseInt,
        8192,
      )
      .option("--team-style", "Learn team-wide coding style")
      .option("--emergency", "Fast learning mode for critical situations")
      .option("--cost-optimize", "Optimize learning for cost efficiency")
      .action(this.learnAction.bind(this));
  }

  async learnAction(options: any): Promise<void> {
    const spinner = ora("Initializing pattern learning system...").start();

    try {
      logger.info("Starting learn command", { options });

      const sourcePath = options.from;

      if (!existsSync(sourcePath)) {
        throw new Error(`Source path does not exist: ${sourcePath}`);
      }

      // Initialize orchestration
      const orchestrator = new ModelOrchestrator({
        cacheSize: 2000, // Larger cache for learning
        performanceThreshold: options.emergency ? 50 : 100,
      });

      spinner.succeed("Learning system initialized");

      // Phase 1: Codebase Analysis
      console.log(chalk.blue("\n📚 Phase 1: Codebase Pattern Analysis"));
      const analysisSpinner = ora("Analyzing codebase patterns...").start();

      const codebaseData = await this.analyzeCodebase(sourcePath, options);
      analysisSpinner.succeed("Codebase analysis complete");

      // Phase 2: Style Pattern Learning
      console.log(chalk.blue("\n🎨 Phase 2: Style Pattern Learning"));
      const styleSpinner = ora("Learning coding style patterns...").start();

      const stylePrompt = `
        Analyze and learn coding style patterns from this codebase:
        
        ${JSON.stringify(codebaseData, null, 2)}
        
        Learn and document:
        1. Naming conventions (variables, functions, classes, files)
        2. Code structure and organization patterns
        3. Comment and documentation style
        4. Error handling patterns
        5. Import/export conventions
        6. Formatting preferences (indentation, spacing, etc.)
        
        Languages focus: ${options.languages || "all detected"}
        Pattern types: ${options.patterns}
        Team style: ${options.teamStyle ? "Learn team-wide patterns" : "Learn individual patterns"}
        
        Generate a comprehensive style guide that can be used for code generation.
      `;

      const stylePatterns = await orchestrator.orchestrate(stylePrompt, {
        task: "style_pattern_learning",
        userTier: "pro",
        priority: options.emergency ? "critical" : "high",
        latencyRequirement: 2000,
        capabilities: [
          "pattern_recognition",
          "style_analysis",
          "documentation",
        ],
      });

      styleSpinner.succeed("Style patterns learned");

      // Phase 3: Architecture Pattern Learning
      if (options.patterns.includes("architecture")) {
        console.log(chalk.blue("\n🏗️ Phase 3: Architecture Pattern Learning"));
        const archSpinner = ora("Learning architecture patterns...").start();

        const archPrompt = `
          Learn architectural patterns from the codebase:
          
          ${JSON.stringify(codebaseData, null, 2)}
          
          Identify and document:
          1. Project structure and organization
          2. Design patterns used
          3. Dependency injection patterns
          4. Module/component architecture
          5. Data flow patterns
          6. API design patterns
          7. Configuration management patterns
          
          Deep learning: ${options.deepLearning ? "Analyze complex interdependencies" : "Focus on surface patterns"}
          
          Create reusable architectural templates.
        `;

        const archPatterns = await orchestrator.orchestrate(archPrompt, {
          task: "architecture_pattern_learning",
          userTier: "pro",
          priority: "high",
          latencyRequirement: 2000,
          capabilities: [
            "architecture_analysis",
            "pattern_recognition",
            "system_design",
          ],
        });

        archSpinner.succeed("Architecture patterns learned");
      }

      // Phase 4: Testing Pattern Learning
      if (options.patterns.includes("testing")) {
        console.log(chalk.blue("\n🧪 Phase 4: Testing Pattern Learning"));
        const testSpinner = ora("Learning testing patterns...").start();

        const testPrompt = `
          Learn testing patterns and practices:
          
          Test files found: ${JSON.stringify(codebaseData.testFiles, null, 2)}
          
          Analyze and learn:
          1. Test file organization and naming
          2. Test structure patterns (setup, teardown, assertions)
          3. Mocking and stubbing patterns
          4. Test data management
          5. Integration test patterns
          6. Coverage strategies
          
          Generate testing guidelines for consistent test generation.
        `;

        const testPatterns = await orchestrator.orchestrate(testPrompt, {
          task: "testing_pattern_learning",
          userTier: "pro",
          priority: "medium",
          latencyRequirement: 2000,
          capabilities: ["testing_analysis", "pattern_recognition"],
        });

        testSpinner.succeed("Testing patterns learned");
      }

      // Phase 5: Compile Learning Profile
      console.log(chalk.blue("\n📝 Phase 5: Compiling Learning Profile"));
      const compileSpinner = ora(
        "Compiling learned patterns into profile...",
      ).start();

      const profilePrompt = `
        Compile all learned patterns into a comprehensive coding profile:
        
        Style Patterns: ${stylePatterns.content}
        
        Create a structured profile that includes:
        1. Executive summary of learned patterns
        2. Detailed style guidelines
        3. Architecture templates
        4. Code generation rules
        5. Quality standards
        6. Example code snippets demonstrating patterns
        
        Format as a reusable profile for code generation AI.
        Context window optimization: ${options.contextWindow} tokens
      `;

      const learningProfile = await orchestrator.orchestrate(profilePrompt, {
        task: "learning_profile_compilation",
        userTier: "pro",
        priority: "medium",
        latencyRequirement: 2000,
        capabilities: ["documentation", "pattern_synthesis"],
      });

      compileSpinner.succeed("Learning profile compiled");

      // Save profile if requested
      if (options.saveProfile || options.output) {
        const filename =
          options.output ||
          `learning-profile-${options.saveProfile || Date.now()}.json`;
        const fs = await import("fs/promises");

        const profileData = {
          name: options.saveProfile || "learned-profile",
          timestamp: new Date().toISOString(),
          source: sourcePath,
          options: options,
          patterns: learningProfile.content,
          metadata: {
            filesAnalyzed: codebaseData.fileCount,
            languages: codebaseData.languages,
            patterns: options.patterns,
            days: options.days,
          },
        };

        await fs.writeFile(filename, JSON.stringify(profileData, null, 2));
        console.log(chalk.green(`\n💾 Learning profile saved to: ${filename}`));
      }

      // Display learning summary
      const metrics = orchestrator.getMetrics();
      console.log(chalk.green("\n✅ Learning Complete!"));
      console.log(chalk.blue("Learning Metrics:"));
      console.log(chalk.gray(`  • Source: ${sourcePath}`));
      console.log(chalk.gray(`  • Files analyzed: ${codebaseData.fileCount}`));
      console.log(
        chalk.gray(
          `  • Languages: ${Object.keys(codebaseData.languages).join(", ")}`,
        ),
      );
      console.log(chalk.gray(`  • Patterns learned: ${options.patterns}`));
      console.log(
        chalk.gray(
          `  • Processing time: ${metrics.avgRoutingTime.toFixed(2)}ms avg`,
        ),
      );

      // Show preview of learned patterns
      console.log(chalk.yellow("\n🎯 Learned Patterns Preview:"));
      console.log(
        chalk.gray(learningProfile.content.substring(0, 500) + "..."),
      );

      if (options.interactive) {
        console.log(
          chalk.cyan(
            "\n💡 Tip: Use `gemini-flow generate --style learned` to apply these patterns",
          ),
        );
      }
    } catch (error) {
      spinner.fail("Learning failed");
      console.error(chalk.red("Error:"), error.message);
      throw error;
    }
  }

  private async analyzeCodebase(
    sourcePath: string,
    options: any,
  ): Promise<any> {
    const data = {
      path: sourcePath,
      fileCount: 0,
      languages: {},
      files: [],
      testFiles: [],
      configFiles: [],
      recentChanges: [],
    };

    try {
      // Get file list
      const findOutput = execSync(`find "${sourcePath}" -type f | head -5000`, {
        encoding: "utf8",
      });
      const allFiles = findOutput
        .trim()
        .split("\n")
        .filter((f) => f);
      data.fileCount = allFiles.length;

      // Filter and categorize files
      const codeExtensions = [
        ".js",
        ".ts",
        ".tsx",
        ".jsx",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".go",
        ".rs",
        ".php",
        ".rb",
      ];
      const testPatterns = [
        ".test.",
        ".spec.",
        "_test.",
        "test_",
        "/tests/",
        "/test/",
      ];
      const configPatterns = [
        "package.json",
        "requirements.txt",
        "Cargo.toml",
        "pom.xml",
        ".env",
        "config.",
      ];

      allFiles.forEach((file) => {
        const ext = "." + file.split(".").pop()?.toLowerCase();
        const filename = file.split("/").pop() || "";

        // Count languages
        if (codeExtensions.includes(ext)) {
          data.languages[ext] = (data.languages[ext] || 0) + 1;
          data.files.push(file);

          // Check if test file
          if (testPatterns.some((pattern) => file.includes(pattern))) {
            data.testFiles.push(file);
          }
        }

        // Check if config file
        if (configPatterns.some((pattern) => filename.includes(pattern))) {
          data.configFiles.push(file);
        }
      });

      // Get recent changes if git repo
      if (options.days && existsSync(join(sourcePath, ".git"))) {
        try {
          const gitLog = execSync(
            `cd "${sourcePath}" && git log --since="${options.days} days ago" --name-only --pretty=format:"%h|%an|%ad|%s" --date=short | head -200`,
            { encoding: "utf8" },
          );

          if (gitLog.trim()) {
            data.recentChanges = gitLog.trim().split("\n").slice(0, 50); // Limit for performance
          }
        } catch (gitError) {
          logger.warn("Could not analyze git history", gitError);
        }
      }

      // Sample file contents for pattern analysis (limited for performance)
      const sampleFiles = data.files.slice(0, 20);
      const sampledContent = {};

      for (const file of sampleFiles) {
        try {
          const content = readFileSync(file, "utf8");
          if (content.length < 10000) {
            // Only sample smaller files
            sampledContent[file] = content;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      data["sampleContent"] = sampledContent;
    } catch (error) {
      logger.error("Error analyzing codebase", error);
      data["error"] = error.message;
    }

    return data;
  }
}
