#!/usr/bin/env node
/**
 * Analyze Command - Repository/git analysis with tech debt reporting
 * Implements Command Bible analyze functionality
 */
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { ModelOrchestrator } from "../../core/model-orchestrator.js";
import { execSync } from "child_process";
import { existsSync } from "fs";
const logger = new Logger("Analyze");
export class AnalyzeCommand extends Command {
    constructor() {
        super("analyze");
        this.description("Comprehensive repository and git analysis with tech debt reporting")
            .option("--repo <path>", "Repository path to analyze", ".")
            .option("--include-history", "Include git history analysis")
            .option("--tech-debt-report", "Generate technical debt report")
            .option("--output <file>", "Output file for analysis results")
            .option("--git-history <period>", "Git history period (24h, 7d, 30d)", "30d")
            .option("--find-breaking-change", "Identify breaking changes")
            .option("--suggest-fix", "Suggest fixes for issues")
            .option("--test-fix", "Test proposed fixes")
            .option("--format <type>", "Output format (markdown, json, html)", "markdown")
            .option("--depth <level>", "Analysis depth (shallow, medium, deep)", "medium")
            .option("--emergency", "Emergency analysis mode")
            .option("--all-hands", "Deploy all analysis agents")
            .option("--cost-optimize", "Optimize analysis for cost")
            .option("--analyze-self", "Include self-analysis of analysis tools")
            .action(this.analyzeAction.bind(this));
    }
    async analyzeAction(options) {
        const spinner = ora("Initializing repository analysis...").start();
        try {
            logger.info("Starting analyze command", { options });
            // Initialize orchestration
            const orchestrator = new ModelOrchestrator({
                cacheSize: 1000,
                performanceThreshold: options.emergency ? 50 : 100,
            });
            const repoPath = options.repo;
            if (!existsSync(repoPath)) {
                throw new Error(`Repository path does not exist: ${repoPath}`);
            }
            spinner.succeed("Analysis environment initialized");
            // Phase 1: Repository Structure Analysis
            console.log(chalk.blue("\n📁 Phase 1: Repository Structure Analysis"));
            const structureSpinner = ora("Analyzing repository structure...").start();
            const structureData = this.analyzeRepositoryStructure(repoPath);
            structureSpinner.succeed("Repository structure analyzed");
            // Phase 2: Code Quality Analysis
            console.log(chalk.blue("\n🔍 Phase 2: Code Quality Analysis"));
            const qualitySpinner = ora("Analyzing code quality...").start();
            const qualityPrompt = `
        Analyze code quality for repository:
        
        Structure: ${JSON.stringify(structureData, null, 2)}
        
        Provide comprehensive analysis of:
        1. Code complexity and maintainability
        2. Architecture patterns and anti-patterns
        3. Performance bottlenecks
        4. Security vulnerabilities
        5. Test coverage gaps
        6. Dependency issues
        7. Technical debt assessment
        
        Emergency mode: ${options.emergency ? "Focus on critical issues only" : "Full analysis"}
        Depth: ${options.depth}
      `;
            const qualityAnalysis = await orchestrator.orchestrate(qualityPrompt, {
                task: "code_quality_analysis",
                userTier: "pro",
                priority: options.emergency ? "critical" : "high",
                latencyRequirement: 2000,
                capabilities: [
                    "code_analysis",
                    "security_review",
                    "performance_analysis",
                ],
            });
            qualitySpinner.succeed("Code quality analysis complete");
            // Phase 3: Git History Analysis (if requested)
            let historyAnalysis = null;
            if (options.includeHistory) {
                console.log(chalk.blue("\n📚 Phase 3: Git History Analysis"));
                const historySpinner = ora("Analyzing git history...").start();
                const gitData = this.analyzeGitHistory(repoPath, options.gitHistory);
                const historyPrompt = `
          Analyze git history patterns:
          
          ${JSON.stringify(gitData, null, 2)}
          
          Identify:
          1. Development patterns and velocity
          2. Hotspot files (frequently changed)
          3. Commit message quality
          4. Contributor patterns
          5. Release patterns
          6. ${options.findBreakingChange ? "Breaking changes and their causes" : "Change impact analysis"}
          
          Period: ${options.gitHistory}
        `;
                historyAnalysis = await orchestrator.orchestrate(historyPrompt, {
                    task: "git_history_analysis",
                    userTier: "pro",
                    priority: "medium",
                    latencyRequirement: 2000,
                    capabilities: ["version_control_analysis", "pattern_recognition"],
                });
                historySpinner.succeed("Git history analysis complete");
            }
            // Phase 4: Technical Debt Assessment
            let techDebtReport = null;
            if (options.techDebtReport) {
                console.log(chalk.blue("\n💳 Phase 4: Technical Debt Assessment"));
                const debtSpinner = ora("Generating technical debt report...").start();
                const debtPrompt = `
          Generate comprehensive technical debt report:
          
          Code Quality: ${qualityAnalysis.content}
          ${historyAnalysis ? `History Analysis: ${historyAnalysis.content}` : ""}
          
          Provide:
          1. Technical debt categorization (design, code, test, documentation)
          2. Priority matrix (impact vs effort)
          3. Refactoring recommendations
          4. Estimated effort and timelines
          5. Risk assessment
          6. Quick wins vs long-term investments
          
          ${options.suggestFix ? "Include specific fix suggestions with code examples" : ""}
          ${options.testFix ? "Include test strategies for proposed fixes" : ""}
        `;
                techDebtReport = await orchestrator.orchestrate(debtPrompt, {
                    task: "technical_debt_assessment",
                    userTier: "pro",
                    priority: "high",
                    latencyRequirement: 2000,
                    capabilities: ["technical_debt_analysis", "refactoring_planning"],
                });
                debtSpinner.succeed("Technical debt assessment complete");
            }
            // Phase 5: Generate Analysis Report
            console.log(chalk.blue("\n📄 Phase 5: Generating Analysis Report"));
            const reportSpinner = ora("Compiling analysis report...").start();
            const reportPrompt = `
        Compile comprehensive analysis report:
        
        Repository: ${repoPath}
        Analysis Date: ${new Date().toISOString()}
        
        Code Quality Analysis:
        ${qualityAnalysis.content}
        
        ${historyAnalysis ? `Git History Analysis:\n${historyAnalysis.content}\n` : ""}
        
        ${techDebtReport ? `Technical Debt Report:\n${techDebtReport.content}\n` : ""}
        
        Format as ${options.format} with:
        1. Executive Summary
        2. Key Findings
        3. Critical Issues (if any)
        4. Recommendations
        5. Action Items
        6. Metrics and Measurements
        
        Emergency focus: ${options.emergency ? "Critical issues requiring immediate attention" : "Comprehensive analysis"}
      `;
            const finalReport = await orchestrator.orchestrate(reportPrompt, {
                task: "analysis_report_generation",
                userTier: "pro",
                priority: "medium",
                latencyRequirement: 2000,
                capabilities: ["report_generation", "documentation"],
            });
            reportSpinner.succeed("Analysis report generated");
            // Save report if output file specified
            if (options.output) {
                const fs = await import("fs/promises");
                await fs.writeFile(options.output, finalReport.content);
                console.log(chalk.green(`\n💾 Report saved to: ${options.output}`));
            }
            // Display summary
            console.log(chalk.green("\n✅ Analysis Complete!"));
            const metrics = orchestrator.getMetrics();
            console.log(chalk.blue("Analysis Metrics:"));
            console.log(chalk.gray(`  • Repository: ${repoPath}`));
            console.log(chalk.gray(`  • Files analyzed: ${structureData.fileCount}`));
            console.log(chalk.gray(`  • Analysis depth: ${options.depth}`));
            console.log(chalk.gray(`  • Processing time: ${metrics.avgRoutingTime.toFixed(2)}ms avg`));
            if (options.emergency) {
                console.log(chalk.red("\n🚨 Emergency mode: Review critical issues immediately"));
            }
            // Preview of findings
            console.log(chalk.yellow("\n📋 Analysis Preview:"));
            console.log(chalk.gray(finalReport.content.substring(0, 500) + "..."));
        }
        catch (error) {
            spinner.fail("Analysis failed");
            console.error(chalk.red("Error:"), error.message);
            throw error;
        }
    }
    analyzeRepositoryStructure(repoPath) {
        try {
            // Get basic repository statistics
            const stats = {
                path: repoPath,
                fileCount: 0,
                directories: [],
                languages: {},
                largeFiles: [],
                configFiles: [],
            };
            // Use find to get file structure (Unix-compatible)
            try {
                const findOutput = execSync(`find "${repoPath}" -type f | head -1000`, {
                    encoding: "utf8",
                });
                const files = findOutput
                    .trim()
                    .split("\n")
                    .filter((f) => f);
                stats.fileCount = files.length;
                // Analyze file types
                files.forEach((file) => {
                    const ext = file.split(".").pop()?.toLowerCase();
                    if (ext) {
                        stats.languages[ext] = (stats.languages[ext] || 0) + 1;
                    }
                    // Identify config files
                    const filename = file.split("/").pop() || "";
                    if (filename.match(/^(package\.json|requirements\.txt|Dockerfile|\.env|config\.|tsconfig\.json)$/)) {
                        stats.configFiles.push(file);
                    }
                });
            }
            catch (error) {
                logger.warn("Could not analyze file structure", error);
            }
            return stats;
        }
        catch (error) {
            logger.error("Error analyzing repository structure", error);
            return { error: error.message };
        }
    }
    analyzeGitHistory(repoPath, period) {
        try {
            const stats = {
                commits: [],
                contributors: {},
                files: {},
                period,
            };
            // Convert period to git format
            const gitPeriod = period === "24h"
                ? "1 day"
                : period === "7d"
                    ? "1 week"
                    : period === "30d"
                        ? "1 month"
                        : "1 month";
            try {
                // Get recent commits
                const commitLog = execSync(`cd "${repoPath}" && git log --since="${gitPeriod} ago" --pretty=format:"%h|%an|%ad|%s" --date=iso`, { encoding: "utf8" });
                if (commitLog.trim()) {
                    stats.commits = commitLog
                        .trim()
                        .split("\n")
                        .map((line) => {
                        const [hash, author, date, message] = line.split("|");
                        return { hash, author, date, message };
                    });
                    // Count contributors
                    stats.commits.forEach((commit) => {
                        stats.contributors[commit.author] =
                            (stats.contributors[commit.author] || 0) + 1;
                    });
                }
                // Get file change statistics
                const fileStats = execSync(`cd "${repoPath}" && git log --since="${gitPeriod} ago" --name-only --pretty=format: | sort | uniq -c | sort -nr | head -20`, { encoding: "utf8" });
                if (fileStats.trim()) {
                    fileStats
                        .trim()
                        .split("\n")
                        .forEach((line) => {
                        const match = line.trim().match(/(\d+)\s+(.+)/);
                        if (match) {
                            stats.files[match[2]] = parseInt(match[1]);
                        }
                    });
                }
            }
            catch (gitError) {
                logger.warn("Git analysis failed - repository may not be a git repo", gitError);
                Object.assign(stats, {
                    error: "Not a git repository or git not available",
                });
            }
            return stats;
        }
        catch (error) {
            logger.error("Error analyzing git history", error);
            return { error: error.message };
        }
    }
}
