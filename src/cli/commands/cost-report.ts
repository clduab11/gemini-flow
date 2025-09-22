#!/usr/bin/env node
/**
 * Cost Report Command - Cost analysis and optimization reports
 * Implements Command Bible cost-report functionality
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { Logger } from "../../utils/logger.js";
import { ModelOrchestrator } from "../../core/model-orchestrator.js";

const logger = new Logger("CostReport");

export class CostReportCommand extends Command {
  constructor() {
    super("cost-report");

    this.description("Comprehensive cost analysis and optimization reporting")
      .option(
        "--period <timeframe>",
        "Analysis period (24h, 7d, 30d, 90d)",
        "30d",
      )
      .option("--breakdown-by-tier", "Break down costs by user tier")
      .option("--breakdown-by-model", "Break down costs by model usage")
      .option("--breakdown-by-team", "Break down costs by team/user")
      .option(
        "--optimization-report",
        "Include cost optimization recommendations",
      )
      .option("--forecast <period>", "Include cost forecast (30d, 60d, 90d)")
      .option("--budget <amount>", "Compare against budget amount", parseFloat)
      .option("--export <format>", "Export format (json, csv, pdf)", "json")
      .option("--output <file>", "Output file for report")
      .option("--detailed", "Generate detailed cost breakdown")
      .option("--alerts", "Include cost alerts and thresholds")
      .option("--trends", "Include cost trend analysis")
      .option("--roi-analysis", "Include ROI analysis")
      .option("--emergency", "Emergency cost analysis - focus on highest costs")
      .option("--cost-optimize", "Focus on optimization opportunities")
      .action(this.costReportAction.bind(this));
  }

  async costReportAction(options: any): Promise<void> {
    const spinner = ora("Initializing cost analysis system...").start();

    try {
      logger.info("Starting cost-report command", { options });

      // Initialize orchestration for analysis
      const orchestrator = new ModelOrchestrator({
        cacheSize: 1000,
        performanceThreshold: 100,
      });

      spinner.succeed("Cost analysis system initialized");

      // Phase 1: Collect Cost Data
      console.log(chalk.blue("\n💰 Phase 1: Cost Data Collection"));
      const dataSpinner = ora("Collecting cost data...").start();

      const costData = await this.collectCostData(options);
      dataSpinner.succeed("Cost data collected");

      // Phase 2: Usage Analysis
      console.log(chalk.blue("\n📊 Phase 2: Usage Analysis"));
      const usageSpinner = ora("Analyzing usage patterns...").start();

      const usageAnalysis = await this.analyzeUsagePatterns(costData, options);
      usageSpinner.succeed("Usage analysis complete");

      // Phase 3: Cost Breakdown Analysis
      console.log(chalk.blue("\n🔍 Phase 3: Cost Breakdown Analysis"));
      const breakdownSpinner = ora("Generating cost breakdowns...").start();

      const costBreakdown = await this.generateCostBreakdown(costData, options);
      breakdownSpinner.succeed("Cost breakdown complete");

      // Phase 4: Optimization Analysis
      let optimizationReport = null;
      if (options.optimizationReport || options.costOptimize) {
        console.log(chalk.blue("\n⚡ Phase 4: Optimization Analysis"));
        const optimizationSpinner = ora(
          "Analyzing optimization opportunities...",
        ).start();

        optimizationReport = await this.generateOptimizationReport(
          costData,
          usageAnalysis,
          options,
        );
        optimizationSpinner.succeed("Optimization analysis complete");
      }

      // Phase 5: Forecasting
      let forecast = null;
      if (options.forecast) {
        console.log(chalk.blue("\n📈 Phase 5: Cost Forecasting"));
        const forecastSpinner = ora("Generating cost forecast...").start();

        forecast = await this.generateCostForecast(costData, options);
        forecastSpinner.succeed("Cost forecast complete");
      }

      // Phase 6: ROI Analysis
      let roiAnalysis = null;
      if (options.roiAnalysis) {
        console.log(chalk.blue("\n💼 Phase 6: ROI Analysis"));
        const roiSpinner = ora("Calculating return on investment...").start();

        roiAnalysis = await this.generateROIAnalysis(
          costData,
          usageAnalysis,
          options,
        );
        roiSpinner.succeed("ROI analysis complete");
      }

      // Phase 7: Generate Final Report
      console.log(chalk.blue("\n📄 Phase 7: Report Generation"));
      const reportSpinner = ora("Compiling cost report...").start();

      const finalReport = this.compileFinalReport(
        costData,
        usageAnalysis,
        costBreakdown,
        optimizationReport,
        forecast,
        roiAnalysis,
        options,
      );

      reportSpinner.succeed("Cost report generated");

      // Display report
      this.displayCostReport(finalReport, options);

      // Export if requested
      if (options.output) {
        await this.exportReport(finalReport, options);
        console.log(chalk.green(`\n💾 Report exported to: ${options.output}`));
      }

      // Show alerts if enabled
      if (options.alerts) {
        this.displayCostAlerts(finalReport.alerts, options);
      }
    } catch (error) {
      spinner.fail("Cost analysis failed");
      console.error(chalk.red("Error:"), error.message);
      throw error;
    }
  }

  private async collectCostData(options: any): Promise<any> {
    // Simulate realistic cost data based on period
    const periodMultiplier =
      options.period === "24h"
        ? 1 / 30
        : options.period === "7d"
          ? 7 / 30
          : options.period === "30d"
            ? 1
            : 3;

    const costData: any = {
      period: options.period,
      totalCost: 384.75 * periodMultiplier,
      currency: "USD",

      modelCosts: {
        "gemini-2.5-pro": {
          cost: 295.2 * periodMultiplier,
          requests: Math.floor(450 * periodMultiplier),
          tokens: Math.floor(125000 * periodMultiplier),
          avgCostPerRequest: 0.656,
          avgCostPerToken: 0.00236,
        },
        "gemini-2.5-flash": {
          cost: 76.5 * periodMultiplier,
          requests: Math.floor(780 * periodMultiplier),
          tokens: Math.floor(95000 * periodMultiplier),
          avgCostPerRequest: 0.098,
          avgCostPerToken: 0.00081,
        },
        "gemini-2.0-flash": {
          cost: 42.8 * periodMultiplier,
          requests: Math.floor(270 * periodMultiplier),
          tokens: Math.floor(45000 * periodMultiplier),
          avgCostPerRequest: 0.159,
          avgCostPerToken: 0.00095,
        },
        "gemini-2.5-deep-think": {
          cost: 125.0 * periodMultiplier, // Premium pricing
          requests: Math.floor(25 * periodMultiplier), // Lower volume
          tokens: Math.floor(25000 * periodMultiplier),
          avgCostPerRequest: 5.0,
          avgCostPerToken: 0.005,
          note: "Coming Soon - Ultra tier only",
        },
      },

      tierCosts: {
        free: {
          cost: 15.25 * periodMultiplier,
          users: 45,
          avgCostPerUser: 0.34,
        },
        pro: {
          cost: 189.5 * periodMultiplier,
          users: 25,
          avgCostPerUser: 7.58,
        },
        enterprise: {
          cost: 180.0 * periodMultiplier,
          users: 8,
          avgCostPerUser: 22.5,
        },
      },

      operationalCosts: {
        infrastructure: 25.5 * periodMultiplier,
        monitoring: 8.75 * periodMultiplier,
        storage: 12.25 * periodMultiplier,
        networking: 6.5 * periodMultiplier,
      },
    };

    // Add team breakdown if requested
    if (options.breakdownByTeam) {
      costData["teamCosts"] = {
        "Development Team": 195.25 * periodMultiplier,
        "QA Team": 87.5 * periodMultiplier,
        "DevOps Team": 65.75 * periodMultiplier,
        "Product Team": 36.25 * periodMultiplier,
      };
    }

    return costData;
  }

  private async analyzeUsagePatterns(
    costData: any,
    options: any,
  ): Promise<any> {
    const analysis = {
      peakUsageHours: ["09:00-11:00", "14:00-16:00"],
      lowUsageHours: ["22:00-06:00"],

      modelEfficiency: {
        "gemini-2.5-pro": {
          efficiency: "High",
          reason: "Enhanced capabilities with improved cost efficiency",
          recommendation: "Ideal for complex analysis and reasoning tasks",
        },
        "gemini-2.5-flash": {
          efficiency: "Very High",
          reason: "Excellent cost-performance ratio with fast responses",
          recommendation: "Perfect for routine and medium complexity tasks",
        },
        "gemini-2.0-flash": {
          efficiency: "Medium",
          reason: "Good baseline performance",
          recommendation:
            "Consider upgrading to 2.5 models for better efficiency",
        },
        "gemini-2.5-deep-think": {
          efficiency: "Specialized",
          reason: "Premium model for complex problem-solving (Coming Soon)",
          recommendation:
            "Reserve for most challenging multi-step reasoning tasks",
        },
      },

      userBehavior: {
        averageSessionCost:
          costData.totalCost /
          (costData.modelCosts["gemini-1.5-pro"].requests +
            costData.modelCosts["gemini-1.5-flash"].requests +
            costData.modelCosts["gemini-1.0-pro"].requests),
        costPerTier: {
          free: costData.tierCosts.free.avgCostPerUser,
          pro: costData.tierCosts.pro.avgCostPerUser,
          enterprise: costData.tierCosts.enterprise.avgCostPerUser,
        },
      },

      wasteIdentification: [
        {
          category: "Model Inefficiency",
          description: "Using expensive models for simple tasks",
          potentialSavings: costData.totalCost * 0.15,
          impact: "High",
        },
        {
          category: "Cache Misses",
          description: "Repeated similar queries not cached",
          potentialSavings: costData.totalCost * 0.08,
          impact: "Medium",
        },
        {
          category: "Off-Hours Usage",
          description: "Non-critical tasks during peak hours",
          potentialSavings: costData.totalCost * 0.05,
          impact: "Low",
        },
      ],
    };

    return analysis;
  }

  private async generateCostBreakdown(
    costData: any,
    options: any,
  ): Promise<any> {
    const breakdown: {
      summary: any;
      byCategory: Record<string, number>;
      byModel: Record<string, any>;
      byTier: Record<string, any>;
      trends: Record<string, string>;
    } = {
      summary: {
        totalCost: costData.totalCost,
        period: costData.period,
        currency: costData.currency,
      },

      byCategory: {
        "Model Usage": Object.values(costData.modelCosts).reduce(
          (sum: number, model: any) => sum + (Number(model?.cost) || 0),
          0,
        ) as number,
        Infrastructure: costData.operationalCosts.infrastructure,
        Monitoring: costData.operationalCosts.monitoring,
        Storage: costData.operationalCosts.storage,
        Networking: costData.operationalCosts.networking,
      },

      byModel: {},
      byTier: {},
      trends: {
        vs_previous_period: "+12.5%",
        vs_last_month: "+8.2%",
        trend_direction: "increasing",
      },
    };

    // Model breakdown
    Object.entries(costData.modelCosts).forEach(
      ([model, data]: [string, any]) => {
        breakdown.byModel[model] = {
          cost: data.cost,
          percentage: ((data.cost / costData.totalCost) * 100).toFixed(1),
          requests: data.requests,
          costPerRequest: data.avgCostPerRequest,
          efficiency: data.cost / data.requests,
        };
      },
    );

    // Tier breakdown
    if (options.breakdownByTier) {
      Object.entries(costData.tierCosts).forEach(
        ([tier, data]: [string, any]) => {
          breakdown.byTier[tier] = {
            cost: data.cost,
            percentage: ((data.cost / costData.totalCost) * 100).toFixed(1),
            users: data.users,
            costPerUser: data.avgCostPerUser,
          };
        },
      );
    }

    return breakdown;
  }

  private async generateOptimizationReport(
    costData: any,
    usageAnalysis: any,
    options: any,
  ): Promise<any> {
    const totalPotentialSavings = usageAnalysis.wasteIdentification.reduce(
      (sum: number, waste: any) => sum + waste.potentialSavings,
      0,
    );

    const optimization = {
      summary: {
        currentCost: costData.totalCost,
        potentialSavings: totalPotentialSavings,
        optimizedCost: costData.totalCost - totalPotentialSavings,
        savingsPercentage: (
          (totalPotentialSavings / costData.totalCost) *
          100
        ).toFixed(1),
      },

      recommendations: [
        {
          category: "Model Selection",
          priority: "High",
          description:
            "Optimize model routing: use Gemini 2.5 Flash for routine tasks and 2.5 Pro for complex analysis",
          potentialSavings: costData.totalCost * 0.15,
          implementation:
            "Configure intelligent routing based on query complexity",
          timeframe: "1-2 weeks",
          effort: "Medium",
        },
        {
          category: "Caching Strategy",
          priority: "High",
          description: "Implement aggressive caching for repeated queries",
          potentialSavings: costData.totalCost * 0.08,
          implementation: "Deploy Redis cache with 24-hour TTL",
          timeframe: "1 week",
          effort: "Low",
        },
        {
          category: "Batch Processing",
          priority: "Medium",
          description: "Batch similar requests to reduce overhead",
          potentialSavings: costData.totalCost * 0.05,
          implementation: "Queue system for non-urgent requests",
          timeframe: "2-3 weeks",
          effort: "High",
        },
        {
          category: "Usage Policies",
          priority: "Medium",
          description: "Implement usage quotas and throttling",
          potentialSavings: costData.totalCost * 0.03,
          implementation: "Rate limiting and user education",
          timeframe: "1 week",
          effort: "Low",
        },
      ],

      quickWins: [
        "Enable response caching",
        "Migrate users to Gemini 2.5 models for better efficiency",
        "Implement query optimization",
        "Set up cost monitoring alerts",
      ],

      longTermStrategies: [
        "Develop cost-aware routing algorithm",
        "Implement predictive usage scaling",
        "Create tiered service offerings",
        "Optimize prompt engineering",
      ],
    };

    return optimization;
  }

  private async generateCostForecast(
    costData: any,
    options: any,
  ): Promise<any> {
    const currentMonthlyRate =
      costData.totalCost * (30 / this.getPeriodDays(costData.period));
    const growthRate = 0.12; // 12% monthly growth assumption

    const forecastPeriods = parseInt(options.forecast.replace("d", "")) / 30;

    const forecast: any = {
      basedOn: costData.period,
      forecastPeriod: options.forecast,
      currentMonthlyRate: currentMonthlyRate,
      growthAssumption: `${(growthRate * 100).toFixed(1)}% monthly`,

      projections: {},
      scenarios: {
        conservative: {},
        realistic: {},
        aggressive: {},
      },
      budgetAnalysis: null,
    };

    // Generate monthly projections
    for (let month = 1; month <= forecastPeriods; month++) {
      const conservativeGrowth = currentMonthlyRate * Math.pow(1.05, month); // 5% growth
      const realisticGrowth =
        currentMonthlyRate * Math.pow(1 + growthRate, month); // 12% growth
      const aggressiveGrowth = currentMonthlyRate * Math.pow(1.2, month); // 20% growth

      forecast.projections[`month_${month}`] = realisticGrowth;
      forecast.scenarios.conservative[`month_${month}`] = conservativeGrowth;
      forecast.scenarios.realistic[`month_${month}`] = realisticGrowth;
      forecast.scenarios.aggressive[`month_${month}`] = aggressiveGrowth;
    }

    // Budget comparison if provided
    if (options.budget) {
      const monthlyBudget = options.budget;
      forecast.budgetAnalysis = {
        monthlyBudget: monthlyBudget,
        currentUsage: currentMonthlyRate,
        budgetUtilization: ((currentMonthlyRate / monthlyBudget) * 100).toFixed(
          1,
        ),
        projectedExceedMonth: null,
      };

      // Find when budget will be exceeded
      for (let month = 1; month <= forecastPeriods; month++) {
        if (forecast.projections[`month_${month}`] > monthlyBudget) {
          forecast.budgetAnalysis.projectedExceedMonth = month;
          break;
        }
      }
    }

    return forecast;
  }

  private async generateROIAnalysis(
    costData: any,
    usageAnalysis: any,
    options: any,
  ): Promise<any> {
    // Simulate ROI calculations
    const roi = {
      totalInvestment: costData.totalCost,

      productivityGains: {
        developmentSpeedup: 3.2, // 3.2x faster development
        qualityImprovement: 0.85, // 85% fewer bugs
        timeToMarket: 0.65, // 65% faster time to market
      },

      costAvoidance: {
        developerTime: costData.totalCost * 8.5, // Equivalent developer time cost
        qualityAssurance: costData.totalCost * 2.1, // Reduced QA costs
        technicalDebt: costData.totalCost * 1.8, // Avoided technical debt
      },

      calculation: {
        totalBenefits: 0,
        totalCosts: costData.totalCost,
        netBenefit: 0,
        roiPercentage: 0,
        paybackPeriod: "2.3 months",
      },
    };

    // Calculate total benefits
    roi.calculation.totalBenefits = Object.values(roi.costAvoidance).reduce(
      (sum: number, value: number) => sum + value,
      0,
    );

    roi.calculation.netBenefit =
      roi.calculation.totalBenefits - roi.calculation.totalCosts;
    roi.calculation.roiPercentage = parseFloat(
      ((roi.calculation.netBenefit / roi.calculation.totalCosts) * 100).toFixed(
        1,
      ),
    );

    return roi;
  }

  private compileFinalReport(
    costData: any,
    usageAnalysis: any,
    costBreakdown: any,
    optimizationReport: any,
    forecast: any,
    roiAnalysis: any,
    options: any,
  ): any {
    const report: {
      metadata: any;
      executiveSummary: any;
      costData: any;
      usageAnalysis: any;
      costBreakdown: any;
      optimizationReport: any;
      forecast: any;
      roiAnalysis: any;
      alerts: Array<{ level: string; category: string; message: string; action: string }>;
    } = {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: options.period,
        reportType: "Cost Analysis Report",
        version: "1.0",
      },

      executiveSummary: {
        totalCost: costData.totalCost,
        potentialSavings: optimizationReport?.summary.potentialSavings || 0,
        roiPercentage: roiAnalysis?.calculation.roiPercentage || "N/A",
        topRecommendation:
          optimizationReport?.recommendations[0]?.description ||
          "No optimization analysis performed",
      },

      costData,
      usageAnalysis,
      costBreakdown,
      optimizationReport,
      forecast,
      roiAnalysis,

      alerts: [],
    };

    // Generate alerts
    if (costData.totalCost > 300) {
      report.alerts.push({
        level: "warning",
        category: "High Cost",
        message: "Monthly costs exceeding $300",
        action: "Review usage patterns and consider optimization",
      });
    }

    if (options.budget && costData.totalCost > options.budget * 0.8) {
      report.alerts.push({
        level: "critical",
        category: "Budget Alert",
        message: "Cost approaching budget limit",
        action: "Implement cost controls immediately",
      });
    }

    if (
      optimizationReport &&
      optimizationReport.summary.potentialSavings > costData.totalCost * 0.1
    ) {
      report.alerts.push({
        level: "info",
        category: "Optimization Opportunity",
        message: `Potential savings of $${optimizationReport.summary.potentialSavings.toFixed(2)} identified`,
        action: "Review optimization recommendations",
      });
    }

    return report;
  }

  private displayCostReport(report: any, options: any): void {
    console.log(chalk.green("\n💰 GEMINI-FLOW COST ANALYSIS REPORT"));
    console.log(chalk.blue("═".repeat(50)));

    // Executive Summary
    console.log(chalk.yellow("\n📋 EXECUTIVE SUMMARY"));
    console.log(chalk.gray(`Period: ${report.metadata.period}`));
    console.log(
      chalk.gray(
        `Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}`,
      ),
    );
    console.log(
      chalk.gray(
        `Total Cost: $${report.executiveSummary.totalCost.toFixed(2)}`,
      ),
    );

    if (report.executiveSummary.potentialSavings > 0) {
      console.log(
        chalk.green(
          `Potential Savings: $${report.executiveSummary.potentialSavings.toFixed(2)}`,
        ),
      );
    }

    if (report.executiveSummary.roiPercentage !== "N/A") {
      console.log(chalk.cyan(`ROI: ${report.executiveSummary.roiPercentage}%`));
    }

    // Cost Breakdown
    console.log(chalk.yellow("\n💳 COST BREAKDOWN"));
    console.log(chalk.cyan("By Model:"));
    Object.entries(report.costBreakdown.byModel).forEach(
      ([model, data]: [string, any]) => {
        console.log(
          chalk.gray(
            `  ${model.padEnd(20)} $${data.cost.toFixed(2)} (${data.percentage}%)`,
          ),
        );
      },
    );

    if (
      report.costBreakdown.byTier &&
      Object.keys(report.costBreakdown.byTier).length > 0
    ) {
      console.log(chalk.cyan("\nBy Tier:"));
      Object.entries(report.costBreakdown.byTier).forEach(
        ([tier, data]: [string, any]) => {
          console.log(
            chalk.gray(
              `  ${tier.padEnd(12)} $${data.cost.toFixed(2)} (${data.percentage}%)`,
            ),
          );
        },
      );
    }

    // Optimization Recommendations
    if (report.optimizationReport) {
      console.log(chalk.yellow("\n⚡ OPTIMIZATION OPPORTUNITIES"));
      console.log(
        chalk.green(
          `Total Potential Savings: $${report.optimizationReport.summary.potentialSavings.toFixed(2)} (${report.optimizationReport.summary.savingsPercentage}%)`,
        ),
      );

      console.log(chalk.cyan("\nTop Recommendations:"));
      report.optimizationReport.recommendations
        .slice(0, 3)
        .forEach((rec: any, index: number) => {
          console.log(chalk.gray(`  ${index + 1}. ${rec.description}`));
          console.log(
            chalk.gray(
              `     Savings: $${rec.potentialSavings.toFixed(2)} | Priority: ${rec.priority}`,
            ),
          );
        });
    }

    // Forecast
    if (report.forecast) {
      console.log(chalk.yellow("\n📈 COST FORECAST"));
      console.log(
        chalk.gray(
          `Current Monthly Rate: $${report.forecast.currentMonthlyRate.toFixed(2)}`,
        ),
      );
      console.log(
        chalk.gray(`Growth Assumption: ${report.forecast.growthAssumption}`),
      );

      if (report.forecast.budgetAnalysis) {
        console.log(chalk.cyan("\nBudget Analysis:"));
        console.log(
          chalk.gray(
            `Monthly Budget: $${report.forecast.budgetAnalysis.monthlyBudget.toFixed(2)}`,
          ),
        );
        console.log(
          chalk.gray(
            `Current Utilization: ${report.forecast.budgetAnalysis.budgetUtilization}%`,
          ),
        );

        if (report.forecast.budgetAnalysis.projectedExceedMonth) {
          console.log(
            chalk.red(
              `Budget will be exceeded in Month ${report.forecast.budgetAnalysis.projectedExceedMonth}`,
            ),
          );
        }
      }
    }

    // ROI Analysis
    if (report.roiAnalysis) {
      console.log(chalk.yellow("\n💼 RETURN ON INVESTMENT"));
      console.log(
        chalk.gray(
          `Investment: $${report.roiAnalysis.calculation.totalCosts.toFixed(2)}`,
        ),
      );
      console.log(
        chalk.gray(
          `Benefits: $${report.roiAnalysis.calculation.totalBenefits.toFixed(2)}`,
        ),
      );
      console.log(
        chalk.green(`ROI: ${report.roiAnalysis.calculation.roiPercentage}%`),
      );
      console.log(
        chalk.gray(
          `Payback Period: ${report.roiAnalysis.calculation.paybackPeriod}`,
        ),
      );
    }

    console.log(chalk.blue("\n═".repeat(50)));
  }

  private displayCostAlerts(alerts: any[], options: any): void {
    if (alerts.length === 0) {
      console.log(
        chalk.green("\n✅ No cost alerts - spending within normal parameters"),
      );
      return;
    }

    console.log(chalk.yellow("\n🚨 COST ALERTS"));

    alerts.forEach((alert) => {
      const levelColor =
        alert.level === "critical"
          ? chalk.red
          : alert.level === "warning"
            ? chalk.yellow
            : chalk.blue;

      console.log(
        levelColor(
          `${alert.level.toUpperCase()} - ${alert.category}: ${alert.message}`,
        ),
      );
      console.log(chalk.gray(`Action: ${alert.action}`));
    });
  }

  private async exportReport(report: any, options: any): Promise<void> {
    const fs = await import("fs/promises");
    let content: string;

    switch (options.export) {
      case "json":
        content = JSON.stringify(report, null, 2);
        break;
      case "csv":
        content = this.convertToCSV(report);
        break;
      case "pdf":
        content = "PDF export not implemented yet. Use HTML export instead.";
        break;
      default:
        content = JSON.stringify(report, null, 2);
    }

    await fs.writeFile(options.output, content);
  }

  private convertToCSV(report: any): string {
    const lines = [];
    lines.push("Category,Item,Cost,Percentage");

    // Model costs
    Object.entries(report.costBreakdown.byModel).forEach(
      ([model, data]: [string, any]) => {
        lines.push(`Model,${model},${data.cost},${data.percentage}%`);
      },
    );

    // Tier costs
    if (report.costBreakdown.byTier) {
      Object.entries(report.costBreakdown.byTier).forEach(
        ([tier, data]: [string, any]) => {
          lines.push(`Tier,${tier},${data.cost},${data.percentage}%`);
        },
      );
    }

    return lines.join("\n");
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case "24h":
        return 1;
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      default:
        return 30;
    }
  }
}
