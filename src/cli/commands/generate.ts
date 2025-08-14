#!/usr/bin/env node
/**
 * Generate Command - AI-powered code generation using learned styles
 * Implements Command Bible generate functionality
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { ModelOrchestrator } from "../../core/model-orchestrator.js";
import { existsSync, readFileSync } from "fs";

const logger = new Logger("Generate");

export class GenerateCommand extends Command {
  constructor() {
    super("generate");

    this.description(
      "AI-powered code generation using learned styles and patterns",
    )
      .argument("<description>", "Description of what to generate")
      .option(
        "--style <profile>",
        "Style profile to use (learned, clean, enterprise)",
        "learned",
      )
      .option(
        "--framework <name>",
        "Target framework (react, express, fastapi, etc.)",
      )
      .option("--language <lang>", "Target programming language")
      .option(
        "--type <type>",
        "Code type (component, api, class, function, test)",
        "component",
      )
      .option("--template <name>", "Base template to use")
      .option(
        "--output-dir <path>",
        "Output directory for generated files",
        "./generated",
      )
      .option("--include-tests", "Generate tests along with code")
      .option("--include-docs", "Generate documentation")
      .option(
        "--coverage-target <n>",
        "Test coverage target percentage",
        parseInt,
        90,
      )
      .option("--style-file <path>", "Path to custom style profile file")
      .option("--interactive", "Interactive generation with user feedback")
      .option("--preview", "Preview generation without writing files")
      .option("--overwrite", "Overwrite existing files")
      .option("--emergency", "Emergency generation mode - skip validations")
      .option("--cost-optimize", "Optimize generation for cost efficiency")
      .option("--analyze-self", "Include self-analysis of generated code")
      .action(this.generateAction.bind(this));
  }

  async generateAction(description: string, options: any): Promise<void> {
    const spinner = ora("Initializing code generation system...").start();

    try {
      logger.info("Starting generate command", { description, options });

      // Initialize orchestration
      const orchestrator = new ModelOrchestrator({
        cacheSize: 1500,
        performanceThreshold: options.emergency ? 50 : 100,
      });

      // Load style profile
      const styleProfile = await this.loadStyleProfile(
        options.style,
        options.styleFile,
      );

      spinner.succeed("Generation system initialized");

      // Phase 1: Analyze Requirements
      console.log(chalk.blue("\n📋 Phase 1: Requirement Analysis"));
      const analysisSpinner = ora(
        "Analyzing generation requirements...",
      ).start();

      const analysisPrompt = `
        Analyze code generation requirements:
        
        Description: "${description}"
        Type: ${options.type}
        Framework: ${options.framework || "auto-detect"}
        Language: ${options.language || "auto-detect"}
        Style Profile: ${options.style}
        
        ${styleProfile ? `Style Guidelines:\n${JSON.stringify(styleProfile, null, 2)}` : ""}
        
        Determine:
        1. Exact code type and structure needed
        2. Required dependencies and imports
        3. Appropriate file names and organization
        4. Testing requirements (coverage: ${options.coverageTarget}%)
        5. Documentation needs
        6. Integration points
        
        Emergency mode: ${options.emergency ? "Skip validations, generate quickly" : "Full analysis"}
      `;

      const analysis = await orchestrator.orchestrate(analysisPrompt, {
        task: "generation_analysis",
        userTier: "pro",
        priority: options.emergency ? "critical" : "high",
        latencyRequirement: 2000,
        capabilities: ["code_analysis", "requirement_analysis"],
      });

      analysisSpinner.succeed("Requirements analyzed");

      // Phase 2: Code Generation
      console.log(chalk.blue("\n🏗️ Phase 2: Code Generation"));
      const generationSpinner = ora("Generating code...").start();

      const generationPrompt = `
        Generate high-quality code based on analysis:
        
        Requirements: ${analysis.content}
        
        Generate:
        1. Main implementation code
        2. ${options.includeTests ? "Comprehensive test suite" : "Basic structure"}
        3. ${options.includeDocs ? "Documentation and comments" : "Minimal comments"}
        4. Error handling and validation
        5. Type definitions (if applicable)
        
        Style Requirements:
        ${styleProfile ? `Follow this style profile:\n${JSON.stringify(styleProfile, null, 2)}` : "Use clean, modern coding standards"}
        
        Framework: ${options.framework || "auto-detect best fit"}
        Language: ${options.language || "auto-detect from context"}
        
        Output format: Structured code blocks with file paths and clear organization
        Emergency: ${options.emergency ? "Prioritize speed over perfection" : "Prioritize quality and completeness"}
      `;

      const generatedCode = await orchestrator.orchestrate(generationPrompt, {
        task: "code_generation",
        userTier: "pro",
        priority: options.emergency ? "critical" : "high",
        latencyRequirement: 2000,
        capabilities: ["code_generation", "testing", "documentation"],
      });

      generationSpinner.succeed("Code generated");

      // Phase 3: Quality Validation (unless emergency mode)
      let validation = null;
      if (!options.emergency) {
        console.log(chalk.blue("\n🔍 Phase 3: Quality Validation"));
        const validationSpinner = ora("Validating generated code...").start();

        const validationPrompt = `
          Validate the generated code for quality and correctness:
          
          ${generatedCode.content}
          
          Check for:
          1. Syntax correctness
          2. Style consistency with profile
          3. Best practices adherence
          4. Security considerations
          5. Performance implications
          6. Test coverage adequacy
          
          Provide validation report and any necessary improvements.
          ${options.analyzeSelf ? "Include analysis of the generation process itself" : ""}
        `;

        validation = await orchestrator.orchestrate(validationPrompt, {
          task: "code_validation",
          userTier: "pro",
          priority: "medium",
          latencyRequirement: 2000,
          capabilities: ["code_review", "quality_analysis"],
        });

        validationSpinner.succeed("Code validated");
      }

      // Phase 4: Output Processing
      console.log(chalk.blue("\n📁 Phase 4: Output Processing"));
      const outputSpinner = ora("Processing output...").start();

      if (options.preview) {
        outputSpinner.succeed("Preview mode - files not written");
        console.log(chalk.yellow("\n👀 Generated Code Preview:"));
        console.log(chalk.gray(generatedCode.content));

        if (validation) {
          console.log(chalk.yellow("\n✅ Validation Report:"));
          console.log(chalk.gray(validation.content));
        }
      } else {
        // Write files to output directory
        await this.writeGeneratedFiles(generatedCode.content, options);
        outputSpinner.succeed("Files written to output directory");
      }

      // Generate summary report
      const metrics = orchestrator.getMetrics();
      console.log(chalk.green("\n✅ Code Generation Complete!"));
      console.log(chalk.blue("Generation Metrics:"));
      console.log(chalk.gray(`  • Description: ${description}`));
      console.log(chalk.gray(`  • Type: ${options.type}`));
      console.log(chalk.gray(`  • Style: ${options.style}`));
      console.log(
        chalk.gray(`  • Framework: ${options.framework || "auto-detected"}`),
      );
      console.log(
        chalk.gray(
          `  • Tests included: ${options.includeTests ? "Yes" : "No"}`,
        ),
      );
      console.log(
        chalk.gray(`  • Documentation: ${options.includeDocs ? "Yes" : "No"}`),
      );
      console.log(
        chalk.gray(
          `  • Processing time: ${metrics.avgRoutingTime.toFixed(2)}ms avg`,
        ),
      );

      if (options.interactive) {
        console.log(
          chalk.cyan(
            "\n💡 Interactive mode: Review generated code and provide feedback",
          ),
        );
        console.log(
          chalk.cyan("💡 Use --preview to see code before writing files"),
        );
      }

      if (options.emergency) {
        console.log(
          chalk.yellow(
            "\n⚡ Emergency mode: Review generated code for critical applications",
          ),
        );
      }
    } catch (error) {
      spinner.fail("Code generation failed");
      console.error(chalk.red("Error:"), error.message);
      throw error;
    }
  }

  private async loadStyleProfile(
    style: string,
    styleFile?: string,
  ): Promise<any> {
    try {
      // If custom style file is provided
      if (styleFile && existsSync(styleFile)) {
        const content = readFileSync(styleFile, "utf8");
        return JSON.parse(content);
      }

      // Built-in style profiles
      const builtInProfiles = {
        clean: {
          naming: "camelCase for variables, PascalCase for classes",
          indentation: "2 spaces",
          quotes: "single quotes",
          semicolons: true,
          comments: "JSDoc style",
          errorHandling: "explicit try-catch",
          imports: "ES6 modules",
        },
        enterprise: {
          naming: "verbose descriptive names",
          indentation: "4 spaces",
          quotes: "double quotes",
          semicolons: true,
          comments: "comprehensive documentation",
          errorHandling: "extensive validation",
          imports: "explicit imports",
          patterns: "design patterns preferred",
        },
        learned: {
          note: "Will use patterns learned from codebase analysis",
          fallback: "clean style if no learned patterns available",
        },
      };

      return builtInProfiles[style] || builtInProfiles.clean;
    } catch (error) {
      logger.warn("Could not load style profile, using default", error);
      return null;
    }
  }

  private async writeGeneratedFiles(
    content: string,
    options: any,
  ): Promise<void> {
    try {
      const fs = await import("fs/promises");

      // Ensure output directory exists
      try {
        await fs.mkdir(options.outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Parse the generated content to extract files
      // This is a simplified parser - in reality, you'd want more sophisticated parsing
      const fileBlocks = content
        .split("```")
        .filter((block, index) => index % 2 === 1);

      let fileCount = 0;
      for (const block of fileBlocks) {
        const lines = block.split("\n");
        const firstLine = lines[0];

        // Try to extract filename from first line
        let filename = `generated-${fileCount++}`;
        if (firstLine.includes("/") || firstLine.includes(".")) {
          filename = firstLine.replace(/^[a-z]+\s*/, "").trim();
        }

        const fileContent = lines.slice(1).join("\n");
        const filePath = `${options.outputDir}/${filename}`;

        // Check if file exists and handle overwrite
        if (existsSync(filePath) && !options.overwrite) {
          console.log(chalk.yellow(`⚠️ File exists, skipping: ${filename}`));
          continue;
        }

        await fs.writeFile(filePath, fileContent);
        console.log(chalk.green(`✅ Generated: ${filename}`));
      }

      if (fileCount === 0) {
        // Fallback: write entire content to a single file
        const fallbackFilename = `generated-code-${Date.now()}.txt`;
        await fs.writeFile(`${options.outputDir}/${fallbackFilename}`, content);
        console.log(chalk.green(`✅ Generated: ${fallbackFilename}`));
      }
    } catch (error) {
      logger.error("Error writing generated files", error);
      throw error;
    }
  }
}
