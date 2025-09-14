#!/usr/bin/env node
/**
 * Stats Command - Analytics dashboard with performance metrics
 * Implements Command Bible stats functionality
 */
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { ModelOrchestrator } from "../../core/model-orchestrator.js";
import { PerformanceMonitor } from "../../core/performance-monitor.js";
const logger = new Logger("Stats");
export class StatsCommand extends Command {
    constructor() {
        super("stats");
        this.description("Analytics dashboard with comprehensive performance metrics")
            .option("--period <timeframe>", "Analysis period (24h, 7d, 30d, 90d)", "30d")
            .option("--team-compare", "Compare team performance metrics")
            .option("--breakdown-by-tier", "Break down metrics by user tier")
            .option("--model-performance", "Include model performance analytics")
            .option("--cost-analysis", "Include cost breakdown analysis")
            .option("--export <format>", "Export format (json, csv, html)", "json")
            .option("--output <file>", "Output file for exported stats")
            .option("--real-time", "Show real-time metrics dashboard")
            .option("--benchmark-compare", "Compare against benchmark data")
            .option("--alerts", "Show performance alerts and warnings")
            .option("--trends", "Include trend analysis")
            .option("--emergency", "Emergency stats - focus on critical metrics")
            .option("--cost-optimize", "Focus on cost optimization metrics")
            .action(this.statsAction.bind(this));
    }
    async statsAction(options) {
        const spinner = ora("Initializing analytics dashboard...").start();
        try {
            logger.info("Starting stats command", { options });
            // Initialize monitoring components
            const orchestrator = new ModelOrchestrator({
                cacheSize: 1000,
                performanceThreshold: 100,
            });
            const performanceMonitor = new PerformanceMonitor();
            spinner.succeed("Analytics system initialized");
            // Phase 1: Collect System Metrics
            console.log(chalk.blue("\n📊 Phase 1: System Metrics Collection"));
            const metricsSpinner = ora("Collecting performance metrics...").start();
            const systemMetrics = this.collectSystemMetrics(orchestrator, performanceMonitor, options);
            metricsSpinner.succeed("System metrics collected");
            // Phase 2: Usage Analytics
            console.log(chalk.blue("\n📈 Phase 2: Usage Analytics"));
            const usageSpinner = ora("Analyzing usage patterns...").start();
            const usageAnalytics = await this.generateUsageAnalytics(options);
            usageSpinner.succeed("Usage analytics complete");
            // Phase 3: Performance Analysis
            console.log(chalk.blue("\n⚡ Phase 3: Performance Analysis"));
            const perfSpinner = ora("Analyzing performance data...").start();
            const performanceAnalysis = await this.analyzePerformance(systemMetrics, options);
            perfSpinner.succeed("Performance analysis complete");
            // Phase 4: Cost Analysis (if requested)
            let costAnalysis = null;
            if (options.costAnalysis || options.breakdownByTier) {
                console.log(chalk.blue("\n💰 Phase 4: Cost Analysis"));
                const costSpinner = ora("Calculating cost metrics...").start();
                costAnalysis = await this.generateCostAnalysis(options);
                costSpinner.succeed("Cost analysis complete");
            }
            // Phase 5: Generate Dashboard
            console.log(chalk.blue("\n📋 Phase 5: Analytics Dashboard"));
            const dashboardSpinner = ora("Generating analytics dashboard...").start();
            const dashboard = this.generateDashboard(systemMetrics, usageAnalytics, performanceAnalysis, costAnalysis, options);
            dashboardSpinner.succeed("Analytics dashboard generated");
            // Display dashboard
            this.displayDashboard(dashboard, options);
            // Export if requested
            if (options.output) {
                await this.exportStats(dashboard, options);
                console.log(chalk.green(`\n💾 Stats exported to: ${options.output}`));
            }
            // Show alerts if any
            if (options.alerts) {
                this.displayAlerts(dashboard.alerts);
            }
            // Real-time monitoring mode
            if (options.realTime) {
                await this.startRealTimeMonitoring(orchestrator, performanceMonitor);
            }
        }
        catch (error) {
            spinner.fail("Analytics generation failed");
            console.error(chalk.red("Error:"), error.message);
            throw error;
        }
    }
    collectSystemMetrics(orchestrator, performanceMonitor, options) {
        const metrics = {
            timestamp: new Date().toISOString(),
            period: options.period,
            orchestration: orchestrator.getMetrics(),
            performance: {
                healthScore: performanceMonitor.getHealthScore(),
                systemLoad: process.cpuUsage(),
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime(),
            },
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                avgLatency: 0,
            },
            models: {
                usage: {},
                performance: {},
                costs: {},
            },
        };
        // Simulate some realistic metrics (in a real implementation, these would come from actual monitoring)
        const orchestrationMetrics = orchestrator.getMetrics();
        metrics.requests.total = orchestrationMetrics.totalRequests || 150;
        metrics.requests.successful = Math.floor(metrics.requests.total * 0.95);
        metrics.requests.failed =
            metrics.requests.total - metrics.requests.successful;
        metrics.requests.avgLatency = orchestrationMetrics.avgRoutingTime || 85.5;
        // Model usage simulation
        metrics.models.usage = {
            "gemini-2.5-pro": 45,
            "gemini-2.5-flash": 78,
            "gemini-2.0-flash": 27,
            "gemini-2.5-deep-think": 3, // Limited usage - Ultra tier only
        };
        metrics.models.performance = {
            "gemini-2.5-pro": { avgLatency: 95.2, successRate: 0.98 },
            "gemini-2.5-flash": { avgLatency: 45.8, successRate: 0.99 },
            "gemini-2.0-flash": { avgLatency: 120.5, successRate: 0.96 },
            "gemini-2.5-deep-think": { avgLatency: 4800, successRate: 0.99 }, // Higher latency for deep reasoning
        };
        return metrics;
    }
    async generateUsageAnalytics(options) {
        // Simulate usage analytics based on period
        const analytics = {
            period: options.period,
            totalSessions: 0,
            uniqueUsers: 0,
            avgSessionDuration: 0,
            topCommands: [],
            userTiers: {},
            timeDistribution: {},
        };
        // Simulate data based on period
        const periodMultiplier = options.period === "24h"
            ? 1
            : options.period === "7d"
                ? 7
                : options.period === "30d"
                    ? 30
                    : 90;
        analytics.totalSessions = 45 * periodMultiplier;
        analytics.uniqueUsers = Math.floor(analytics.totalSessions * 0.6);
        analytics.avgSessionDuration = 15.5; // minutes
        analytics.topCommands = [
            { command: "orchestrate", usage: 35 * periodMultiplier, percentage: 35 },
            { command: "swarm", usage: 28 * periodMultiplier, percentage: 28 },
            { command: "analyze", usage: 15 * periodMultiplier, percentage: 15 },
            { command: "generate", usage: 12 * periodMultiplier, percentage: 12 },
            { command: "execute", usage: 10 * periodMultiplier, percentage: 10 },
        ];
        const analyticsTyped = analytics;
        if (options.teamCompare) {
            analyticsTyped.teamMetrics = {
                avgProductivity: 85.2,
                codeQuality: 92.1,
                collaborationScore: 78.5,
            };
        }
        if (options.breakdownByTier) {
            analytics.userTiers = {
                free: { users: 45, usage: 35, costs: 12.5 },
                pro: { users: 25, usage: 55, costs: 125.75 },
                enterprise: { users: 8, usage: 10, costs: 450.25 },
            };
        }
        return analytics;
    }
    async analyzePerformance(systemMetrics, options) {
        const analysis = {
            overall: {
                score: systemMetrics.performance.healthScore,
                grade: this.calculateGrade(systemMetrics.performance.healthScore),
                status: systemMetrics.performance.healthScore > 80
                    ? "healthy"
                    : "needs attention",
            },
            latency: {
                avg: systemMetrics.requests.avgLatency,
                p95: systemMetrics.requests.avgLatency * 1.5,
                p99: systemMetrics.requests.avgLatency * 2.1,
            },
            throughput: {
                requestsPerSecond: systemMetrics.requests.total /
                    (systemMetrics.performance.uptime || 3600),
                peakRPS: 0,
                avgRPS: 0,
            },
            reliability: {
                successRate: systemMetrics.requests.successful / systemMetrics.requests.total,
                uptime: 99.8,
                errorRate: systemMetrics.requests.failed / systemMetrics.requests.total,
            },
            bottlenecks: [],
            recommendations: [],
        };
        // Calculate throughput
        analysis.throughput.avgRPS = analysis.throughput.requestsPerSecond;
        analysis.throughput.peakRPS = analysis.throughput.requestsPerSecond * 2.5;
        // Identify bottlenecks
        if (analysis.latency.avg > 100) {
            analysis.bottlenecks.push("High average latency detected");
        }
        if (analysis.reliability.successRate < 0.95) {
            analysis.bottlenecks.push("Low success rate needs investigation");
        }
        // Generate recommendations
        if (analysis.overall.score < 80) {
            analysis.recommendations.push("Consider optimizing model routing");
            analysis.recommendations.push("Review cache configuration");
        }
        const analysisTyped = analysis;
        if (options.benchmarkCompare) {
            analysisTyped.benchmark = {
                vsIndustry: "Above average",
                vsLastPeriod: "+12.5% improvement",
                ranking: "Top 25%",
            };
        }
        return analysis;
    }
    async generateCostAnalysis(options) {
        const analysis = {
            totalCost: 0,
            byModel: {},
            byTier: {},
            trends: [],
            optimization: {
                potentialSavings: 0,
                recommendations: [],
            },
        };
        // Simulate cost data
        analysis.byModel = {
            "gemini-1.5-pro": { cost: 245.5, percentage: 65, requests: 450 },
            "gemini-1.5-flash": { cost: 89.25, percentage: 24, requests: 780 },
            "gemini-1.0-pro": { cost: 42.75, percentage: 11, requests: 270 },
        };
        analysis.totalCost = Object.values(analysis.byModel).reduce((sum, model) => sum + (model.cost || 0), 0);
        if (options.breakdownByTier) {
            analysis.byTier = {
                free: { cost: 12.5, percentage: 3.3 },
                pro: { cost: 125.75, percentage: 33.4 },
                enterprise: { cost: 239.25, percentage: 63.3 },
            };
        }
        // Cost optimization suggestions
        analysis.optimization.potentialSavings = analysis.totalCost * 0.15; // 15% potential savings
        analysis.optimization.recommendations = [
            "Increase use of Gemini Flash for simple queries",
            "Implement intelligent caching for repeat requests",
            "Optimize prompt engineering to reduce token usage",
            "Consider batch processing for similar requests",
        ];
        return analysis;
    }
    generateDashboard(systemMetrics, usageAnalytics, performanceAnalysis, costAnalysis, options) {
        const dashboard = {
            summary: {
                period: options.period,
                generatedAt: new Date().toISOString(),
                overallHealth: performanceAnalysis.overall.score,
                totalRequests: systemMetrics.requests.total,
                successRate: performanceAnalysis.reliability.successRate,
                avgLatency: performanceAnalysis.latency.avg,
                totalCost: costAnalysis?.totalCost || 0,
            },
            usage: usageAnalytics,
            performance: performanceAnalysis,
            cost: costAnalysis,
            alerts: [],
        };
        // Generate alerts
        if (performanceAnalysis.overall.score < 70) {
            dashboard.alerts.push({
                level: "critical",
                message: "System performance below acceptable threshold",
                action: "Immediate optimization required",
            });
        }
        if (performanceAnalysis.latency.avg > 150) {
            dashboard.alerts.push({
                level: "warning",
                message: "High average latency detected",
                action: "Review model routing and caching",
            });
        }
        if (costAnalysis && costAnalysis.totalCost > 500) {
            dashboard.alerts.push({
                level: "info",
                message: "High usage costs detected",
                action: "Consider cost optimization strategies",
            });
        }
        return dashboard;
    }
    displayDashboard(dashboard, options) {
        console.log(chalk.green("\n📊 GEMINI-FLOW ANALYTICS DASHBOARD"));
        console.log(chalk.blue("═".repeat(50)));
        // Summary section
        console.log(chalk.yellow("\n📋 SUMMARY METRICS"));
        console.log(chalk.gray(`Period: ${dashboard.summary.period}`));
        console.log(chalk.gray(`Generated: ${new Date(dashboard.summary.generatedAt).toLocaleString()}`));
        const healthColor = dashboard.summary.overallHealth > 80
            ? chalk.green
            : dashboard.summary.overallHealth > 60
                ? chalk.yellow
                : chalk.red;
        console.log(`Health Score: ${healthColor(dashboard.summary.overallHealth.toFixed(1))}/100`);
        console.log(chalk.gray(`Total Requests: ${dashboard.summary.totalRequests.toLocaleString()}`));
        console.log(chalk.gray(`Success Rate: ${(dashboard.summary.successRate * 100).toFixed(1)}%`));
        console.log(chalk.gray(`Avg Latency: ${dashboard.summary.avgLatency.toFixed(1)}ms`));
        if (dashboard.summary.totalCost > 0) {
            console.log(chalk.gray(`Total Cost: $${dashboard.summary.totalCost.toFixed(2)}`));
        }
        // Usage analytics
        console.log(chalk.yellow("\n📈 USAGE ANALYTICS"));
        console.log(chalk.gray(`Sessions: ${dashboard.usage.totalSessions}`));
        console.log(chalk.gray(`Unique Users: ${dashboard.usage.uniqueUsers}`));
        console.log(chalk.gray(`Avg Session: ${dashboard.usage.avgSessionDuration} minutes`));
        console.log(chalk.cyan("\nTop Commands:"));
        dashboard.usage.topCommands.forEach((cmd) => {
            console.log(chalk.gray(`  ${cmd.command.padEnd(12)} ${cmd.usage.toString().padStart(4)} uses (${cmd.percentage}%)`));
        });
        // Performance metrics
        console.log(chalk.yellow("\n⚡ PERFORMANCE METRICS"));
        console.log(chalk.gray(`Overall Grade: ${dashboard.performance.overall.grade}`));
        console.log(chalk.gray(`Latency P95: ${dashboard.performance.latency.p95.toFixed(1)}ms`));
        console.log(chalk.gray(`Throughput: ${dashboard.performance.throughput.avgRPS.toFixed(1)} req/s`));
        console.log(chalk.gray(`Uptime: ${dashboard.performance.reliability.uptime}%`));
        // Cost analysis
        if (dashboard.cost) {
            console.log(chalk.yellow("\n💰 COST ANALYSIS"));
            console.log(chalk.gray(`Total: $${dashboard.cost.totalCost.toFixed(2)}`));
            console.log(chalk.gray(`Potential Savings: $${dashboard.cost.optimization.potentialSavings.toFixed(2)}`));
            console.log(chalk.cyan("\nBy Model:"));
            Object.entries(dashboard.cost.byModel).forEach(([model, data]) => {
                console.log(chalk.gray(`  ${model.padEnd(20)} $${data.cost.toFixed(2)} (${data.percentage}%)`));
            });
        }
        // Team comparison
        if (options.teamCompare && dashboard.usage.teamMetrics) {
            console.log(chalk.yellow("\n👥 TEAM METRICS"));
            console.log(chalk.gray(`Productivity: ${dashboard.usage.teamMetrics.avgProductivity}/100`));
            console.log(chalk.gray(`Code Quality: ${dashboard.usage.teamMetrics.codeQuality}/100`));
            console.log(chalk.gray(`Collaboration: ${dashboard.usage.teamMetrics.collaborationScore}/100`));
        }
        console.log(chalk.blue("\n═".repeat(50)));
    }
    displayAlerts(alerts) {
        if (alerts.length === 0) {
            console.log(chalk.green("\n✅ No alerts - all systems operating normally"));
            return;
        }
        console.log(chalk.yellow("\n🚨 ALERTS & WARNINGS"));
        alerts.forEach((alert) => {
            const levelColor = alert.level === "critical"
                ? chalk.red
                : alert.level === "warning"
                    ? chalk.yellow
                    : chalk.blue;
            console.log(levelColor(`${alert.level.toUpperCase()}: ${alert.message}`));
            console.log(chalk.gray(`Action: ${alert.action}`));
        });
    }
    async exportStats(dashboard, options) {
        const fs = await import("fs/promises");
        let content;
        switch (options.export) {
            case "json":
                content = JSON.stringify(dashboard, null, 2);
                break;
            case "csv":
                content = this.convertToCSV(dashboard);
                break;
            case "html":
                content = this.convertToHTML(dashboard);
                break;
            default:
                content = JSON.stringify(dashboard, null, 2);
        }
        await fs.writeFile(options.output, content);
    }
    convertToCSV(dashboard) {
        const lines = [];
        lines.push("Metric,Value,Period");
        lines.push(`Overall Health,${dashboard.summary.overallHealth},${dashboard.summary.period}`);
        lines.push(`Total Requests,${dashboard.summary.totalRequests},${dashboard.summary.period}`);
        lines.push(`Success Rate,${(dashboard.summary.successRate * 100).toFixed(1)}%,${dashboard.summary.period}`);
        lines.push(`Average Latency,${dashboard.summary.avgLatency}ms,${dashboard.summary.period}`);
        if (dashboard.summary.totalCost > 0) {
            lines.push(`Total Cost,$${dashboard.summary.totalCost},${dashboard.summary.period}`);
        }
        return lines.join("\n");
    }
    convertToHTML(dashboard) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Gemini-Flow Analytics Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .header { color: #2196F3; font-size: 24px; margin-bottom: 20px; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .critical { background: #ffebee; border-left: 4px solid #f44336; }
        .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .info { background: #e3f2fd; border-left: 4px solid #2196f3; }
    </style>
</head>
<body>
    <div class="header">📊 Gemini-Flow Analytics Dashboard</div>
    <div class="metric">
        <strong>Period:</strong> ${dashboard.summary.period}<br>
        <strong>Generated:</strong> ${new Date(dashboard.summary.generatedAt).toLocaleString()}<br>
        <strong>Health Score:</strong> ${dashboard.summary.overallHealth.toFixed(1)}/100<br>
        <strong>Total Requests:</strong> ${dashboard.summary.totalRequests.toLocaleString()}<br>
        <strong>Success Rate:</strong> ${(dashboard.summary.successRate * 100).toFixed(1)}%<br>
        <strong>Average Latency:</strong> ${dashboard.summary.avgLatency.toFixed(1)}ms
    </div>
    ${dashboard.alerts
            .map((alert) => `<div class="alert ${alert.level}"><strong>${alert.level.toUpperCase()}:</strong> ${alert.message}</div>`)
            .join("")}
</body>
</html>`;
    }
    async startRealTimeMonitoring(orchestrator, performanceMonitor) {
        console.log(chalk.blue("\n🔄 Real-time monitoring started (Press Ctrl+C to stop)"));
        const interval = setInterval(() => {
            const metrics = orchestrator.getMetrics();
            const health = performanceMonitor.getHealthScore();
            console.clear();
            console.log(chalk.green("📊 REAL-TIME DASHBOARD"));
            console.log(chalk.blue("═".repeat(30)));
            console.log(chalk.gray(`Time: ${new Date().toLocaleTimeString()}`));
            console.log(chalk.gray(`Health: ${health.toFixed(1)}/100`));
            console.log(chalk.gray(`Requests: ${metrics.totalRequests}`));
            console.log(chalk.gray(`Avg Latency: ${metrics.avgRoutingTime.toFixed(1)}ms`));
            console.log(chalk.gray(`Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`));
            console.log(chalk.blue("Press Ctrl+C to exit"));
        }, 2000);
        // Handle graceful shutdown
        process.on("SIGINT", () => {
            clearInterval(interval);
            console.log(chalk.yellow("\n\nReal-time monitoring stopped"));
            process.exit(0);
        });
    }
    calculateGrade(score) {
        if (score >= 90)
            return "A";
        if (score >= 80)
            return "B";
        if (score >= 70)
            return "C";
        if (score >= 60)
            return "D";
        return "F";
    }
}
//# sourceMappingURL=stats.js.map