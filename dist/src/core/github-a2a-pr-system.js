/**
 * GitHub A2A Pull Request System - Automated PR reviews with multiple specialized agents
 * Coordinates A2A agents for comprehensive code review, testing, and approval workflows
 */
import { A2AIntegration } from "./a2a-integration.js";
import { EventEmitter } from "events";
export class GitHubA2APRSystem extends EventEmitter {
    bridge;
    a2aIntegration;
    activeReviews = new Map();
    reviewStrategies = new Map();
    constructor(bridge) {
        super();
        this.bridge = bridge;
        this.a2aIntegration = new A2AIntegration();
        this.initializeReviewStrategies();
        this.setupEventHandlers();
    }
    /**
     * Initialize different review strategies for various PR types
     */
    initializeReviewStrategies() {
        this.reviewStrategies.set("security-focused", {
            name: "Security-Focused Review",
            agents: ["security", "reviewer", "analyst"],
            parallel: true,
            required_approvals: 2,
            focus_areas: [
                "security",
                "vulnerability",
                "authentication",
                "authorization",
            ],
        });
        this.reviewStrategies.set("architecture-review", {
            name: "Architecture Review",
            agents: ["architect", "reviewer", "security"],
            parallel: false,
            required_approvals: 2,
            focus_areas: [
                "design-patterns",
                "scalability",
                "maintainability",
                "performance",
            ],
        });
        this.reviewStrategies.set("feature-review", {
            name: "Feature Review",
            agents: ["reviewer", "tester", "analyst"],
            parallel: true,
            required_approvals: 2,
            focus_areas: [
                "functionality",
                "testing",
                "documentation",
                "code-quality",
            ],
        });
        this.reviewStrategies.set("hotfix-review", {
            name: "Hotfix Review",
            agents: ["security", "reviewer"],
            parallel: true,
            required_approvals: 1,
            focus_areas: ["security", "regression-risk", "impact-analysis"],
        });
    }
    /**
     * Process incoming pull request for A2A agent review
     */
    async processPullRequest(request) {
        const sessionId = `pr-${request.repository}-${request.pr_number}-${Date.now()}`;
        try {
            // Analyze PR to determine review strategy
            const analysis = await this.analyzePullRequest(request);
            // Select appropriate review strategy
            const strategy = this.selectReviewStrategy(request, analysis);
            // Create review session
            const session = new PRReviewSession(sessionId, request, strategy, analysis);
            this.activeReviews.set(sessionId, session);
            // Assign A2A agents to review
            const assignedAgents = await this.assignReviewAgents(strategy);
            // Start coordinated review process
            await this.startCoordinatedReview(session, assignedAgents);
            this.emit("pr-review-started", {
                sessionId,
                request,
                strategy,
                assignedAgents,
            });
            return sessionId;
        }
        catch (error) {
            console.error(`Failed to process PR review for ${request.repository}#${request.pr_number}:`, error);
            throw error;
        }
    }
    /**
     * Analyze pull request to understand its characteristics
     */
    async analyzePullRequest(request) {
        const analysis = {
            complexity_score: this.calculateComplexityScore(request),
            risk_assessment: this.assessRisk(request),
            test_coverage_impact: this.calculateTestCoverageImpact(request),
            breaking_changes: this.detectBreakingChanges(request),
            security_implications: this.detectSecurityImplications(request),
            performance_impact: this.assessPerformanceImpact(request),
            architectural_changes: this.detectArchitecturalChanges(request),
            documentation_required: this.isDocumentationRequired(request),
        };
        return analysis;
    }
    /**
     * Select appropriate review strategy based on PR characteristics
     */
    selectReviewStrategy(request, analysis) {
        // Security-critical changes
        if (analysis.security_implications ||
            analysis.risk_assessment === "critical") {
            return this.reviewStrategies.get("security-focused");
        }
        // Architectural changes
        if (analysis.architectural_changes || analysis.complexity_score > 80) {
            return this.reviewStrategies.get("architecture-review");
        }
        // Hotfix or urgent changes
        if (request.labels.includes("hotfix") ||
            request.labels.includes("urgent")) {
            return this.reviewStrategies.get("hotfix-review");
        }
        // Default feature review
        return this.reviewStrategies.get("feature-review");
    }
    /**
     * Assign A2A agents for review based on strategy
     */
    async assignReviewAgents(strategy) {
        const availableAgents = await this.getAvailableAgents();
        const assignedAgents = [];
        for (const agentType of strategy.agents) {
            const agent = availableAgents.find((a) => a.type === agentType && a.status === "idle");
            if (agent) {
                agent.status = "working";
                assignedAgents.push(agent);
            }
        }
        return assignedAgents;
    }
    /**
     * Start coordinated review process with assigned agents
     */
    async startCoordinatedReview(session, agents) {
        const reviewTasks = await this.createReviewTasks(session, agents);
        if (session.strategy.parallel) {
            // Execute reviews in parallel
            const reviewPromises = reviewTasks.map((task) => this.executeReviewTask(task));
            const results = await Promise.all(reviewPromises);
            await this.consolidateReviewResults(session.id, results);
        }
        else {
            // Execute reviews sequentially
            const results = [];
            for (const task of reviewTasks) {
                const result = await this.executeReviewTask(task);
                results.push(result);
            }
            await this.consolidateReviewResults(session.id, results);
        }
    }
    /**
     * Create review tasks for assigned agents
     */
    async createReviewTasks(session, agents) {
        const tasks = [];
        for (const agent of agents) {
            const task = {
                id: `review-${session.id}-${agent.id}`,
                session_id: session.id,
                agent_id: agent.id,
                agent_type: agent.type,
                review_type: this.mapAgentTypeToReviewType(agent.type),
                focus_areas: session.strategy.focus_areas,
                files_to_review: this.filterFilesForAgent(session.request.files_changed, agent.type),
                priority: this.calculateTaskPriority(session.analysis, agent.type),
                estimated_duration: this.estimateReviewDuration(session.request, agent.type),
            };
            tasks.push(task);
        }
        return tasks;
    }
    /**
     * Execute individual review task with A2A agent
     */
    async executeReviewTask(task) {
        const startTime = Date.now();
        try {
            // Send review request to A2A agent
            const reviewRequest = {
                task_id: task.id,
                type: "code_review",
                data: {
                    files: task.files_to_review,
                    focus_areas: task.focus_areas,
                    review_type: task.review_type,
                },
            };
            const agentResponse = await this.a2aIntegration.executeTask(task.agent_id, reviewRequest);
            // Process agent response into review result
            const result = {
                agent_id: task.agent_id,
                agent_type: task.agent_type,
                review_type: task.review_type,
                status: agentResponse.status || "comment",
                confidence: agentResponse.confidence || 0.8,
                findings: agentResponse.findings || [],
                suggestions: agentResponse.suggestions || [],
                overall_score: agentResponse.score || 75,
                execution_time: Date.now() - startTime,
            };
            this.emit("review-task-completed", { task, result });
            return result;
        }
        catch (error) {
            console.error(`Review task failed for agent ${task.agent_id}:`, error);
            // Return error result
            return {
                agent_id: task.agent_id,
                agent_type: task.agent_type,
                review_type: task.review_type,
                status: "changes_requested",
                confidence: 0,
                findings: [
                    {
                        type: "error",
                        severity: "high",
                        file: "system",
                        message: `Review failed: ${error}`,
                        rule_id: "system-error",
                    },
                ],
                suggestions: [],
                overall_score: 0,
                execution_time: Date.now() - startTime,
            };
        }
    }
    /**
     * Consolidate review results from all agents
     */
    async consolidateReviewResults(sessionId, results) {
        const session = this.activeReviews.get(sessionId);
        if (!session)
            return;
        session.results = results;
        // Calculate overall review status
        const overallStatus = this.calculateOverallStatus(results);
        const consolidatedFindings = this.consolidateFindings(results);
        const consolidatedSuggestions = this.consolidateSuggestions(results);
        // Create consolidated review
        const consolidatedReview = {
            session_id: sessionId,
            overall_status: overallStatus,
            agent_results: results,
            consolidated_findings: consolidatedFindings,
            consolidated_suggestions: consolidatedSuggestions,
            recommendation: this.generateRecommendation(results, session.analysis),
            confidence: this.calculateOverallConfidence(results),
            review_quality_score: this.calculateReviewQuality(results),
        };
        // Submit review to GitHub
        await this.submitGitHubReview(session.request, consolidatedReview);
        // Update session status
        session.status = "completed";
        session.completed_at = new Date();
        this.emit("pr-review-completed", { sessionId, consolidatedReview });
    }
    /**
     * Submit consolidated review to GitHub
     */
    async submitGitHubReview(request, review) {
        // Format review for GitHub API
        const githubReview = {
            event: review.overall_status,
            body: this.formatReviewBody(review),
            comments: this.formatReviewComments(review.consolidated_findings, review.consolidated_suggestions),
        };
        // Submit via GitHub API (would be actual API call in real implementation)
        console.log(`Submitting review for ${request.repository}#${request.pr_number}:`, githubReview);
        // Emit event for external handlers
        this.emit("github-review-submitted", { request, review: githubReview });
    }
    /**
     * Format review body for GitHub
     */
    formatReviewBody(review) {
        let body = "## 🤖 A2A Agent Review Summary\n\n";
        body += `**Overall Status:** ${review.overall_status.toUpperCase()}\n`;
        body += `**Confidence:** ${(review.confidence * 100).toFixed(1)}%\n`;
        body += `**Quality Score:** ${review.review_quality_score}/100\n\n`;
        if (review.recommendation) {
            body += `**Recommendation:** ${review.recommendation}\n\n`;
        }
        // Agent breakdown
        body += "### Agent Reviews\n\n";
        for (const result of review.agent_results) {
            body += `- **${result.agent_type}**: ${result.status} (${result.overall_score}/100)\n`;
        }
        body += "\n---\n";
        body +=
            "*This review was generated by A2A (Agent-to-Agent) collaboration system*";
        return body;
    }
    /**
     * Format review comments for GitHub
     */
    formatReviewComments(findings, suggestions) {
        const comments = [];
        // Add findings as comments
        for (const finding of findings) {
            if (finding.file && finding.line) {
                comments.push({
                    path: finding.file,
                    position: finding.line,
                    body: `**${finding.severity.toUpperCase()}**: ${finding.message}${finding.suggestion ? `\n\n**Suggestion:** ${finding.suggestion}` : ""}`,
                });
            }
        }
        // Add suggestions as comments
        for (const suggestion of suggestions) {
            if (suggestion.file && suggestion.line_start) {
                let commentBody = `**${suggestion.type.toUpperCase()}**: ${suggestion.rationale}`;
                if (suggestion.suggested_code) {
                    commentBody += "\n\n**Suggested change:**\n```diff\n";
                    if (suggestion.current_code) {
                        commentBody += `- ${suggestion.current_code}\n`;
                    }
                    commentBody += `+ ${suggestion.suggested_code}\n`;
                    commentBody += "```";
                }
                comments.push({
                    path: suggestion.file,
                    position: suggestion.line_start,
                    body: commentBody,
                });
            }
        }
        return comments;
    }
    // Utility methods for PR analysis
    calculateComplexityScore(request) {
        let score = 0;
        // File count factor
        score += Math.min(request.files_changed.length * 5, 30);
        // Change volume factor
        const totalChanges = request.files_changed.reduce((sum, file) => sum + file.changes, 0);
        score += Math.min(totalChanges / 10, 40);
        // File type complexity
        for (const file of request.files_changed) {
            if (file.filename.includes("test"))
                score += 2;
            if (file.filename.endsWith(".ts") || file.filename.endsWith(".js"))
                score += 3;
            if (file.filename.includes("config") ||
                file.filename.includes("security"))
                score += 5;
        }
        return Math.min(score, 100);
    }
    assessRisk(request) {
        const riskFactors = [
            request.files_changed.some((f) => f.filename.includes("security")),
            request.files_changed.some((f) => f.filename.includes("auth")),
            request.files_changed.some((f) => f.filename.includes("config")),
            request.files_changed.length > 20,
            request.labels.includes("breaking-change"),
        ];
        const riskScore = riskFactors.filter(Boolean).length;
        if (riskScore >= 3)
            return "critical";
        if (riskScore >= 2)
            return "high";
        if (riskScore >= 1)
            return "medium";
        return "low";
    }
    calculateTestCoverageImpact(request) {
        const testFiles = request.files_changed.filter((f) => f.filename.includes("test") || f.filename.includes("spec")).length;
        const sourceFiles = request.files_changed.filter((f) => !f.filename.includes("test") && !f.filename.includes("spec")).length;
        if (sourceFiles === 0)
            return 100;
        return Math.min((testFiles / sourceFiles) * 100, 100);
    }
    detectBreakingChanges(request) {
        return (request.labels.includes("breaking-change") ||
            request.files_changed.some((f) => f.deletions > f.additions * 2));
    }
    detectSecurityImplications(request) {
        const securityKeywords = [
            "auth",
            "security",
            "password",
            "token",
            "key",
            "crypto",
        ];
        return (request.files_changed.some((f) => securityKeywords.some((keyword) => f.filename.toLowerCase().includes(keyword))) || request.labels.includes("security"));
    }
    assessPerformanceImpact(request) {
        const performanceKeywords = [
            "performance",
            "optimize",
            "cache",
            "async",
            "parallel",
        ];
        const hasPerformanceChanges = request.files_changed.some((f) => performanceKeywords.some((keyword) => f.filename.toLowerCase().includes(keyword) ||
            (f.patch && f.patch.toLowerCase().includes(keyword))));
        if (hasPerformanceChanges)
            return "positive";
        if (request.files_changed.some((f) => f.changes > 500))
            return "negative";
        return "neutral";
    }
    detectArchitecturalChanges(request) {
        const archKeywords = [
            "architecture",
            "design",
            "pattern",
            "structure",
            "core",
            "framework",
        ];
        return request.files_changed.some((f) => archKeywords.some((keyword) => f.filename.toLowerCase().includes(keyword)));
    }
    isDocumentationRequired(request) {
        return (request.files_changed.some((f) => f.status === "added") ||
            request.files_changed.length > 10 ||
            !request.files_changed.some((f) => f.filename.toLowerCase().includes("readme")));
    }
    mapAgentTypeToReviewType(agentType) {
        const mapping = {
            reviewer: "code_quality",
            security: "security",
            tester: "testing",
            architect: "architecture",
            analyst: "code_quality",
        };
        return mapping[agentType] || "code_quality";
    }
    filterFilesForAgent(files, agentType) {
        // Filter files based on agent specialization
        switch (agentType) {
            case "security":
                return files.filter((f) => f.filename.includes("auth") ||
                    f.filename.includes("security") ||
                    f.filename.includes("crypto"));
            case "tester":
                return files.filter((f) => f.filename.includes("test") ||
                    f.filename.includes("spec") ||
                    f.filename.endsWith(".test.ts") ||
                    f.filename.endsWith(".spec.ts"));
            default:
                return files;
        }
    }
    calculateTaskPriority(analysis, agentType) {
        if (analysis.risk_assessment === "critical" && agentType === "security")
            return "high";
        if (analysis.complexity_score > 80)
            return "high";
        if (analysis.breaking_changes)
            return "high";
        return "medium";
    }
    estimateReviewDuration(request, agentType) {
        const baseTime = 10; // minutes
        const complexityFactor = request.files_changed.length * 2;
        const agentFactor = agentType === "security" ? 1.5 : 1.0;
        return Math.min(baseTime + complexityFactor * agentFactor, 60);
    }
    calculateOverallStatus(results) {
        const approvals = results.filter((r) => r.status === "approved").length;
        const changesRequested = results.filter((r) => r.status === "changes_requested").length;
        if (changesRequested > 0)
            return "REQUEST_CHANGES";
        if (approvals >= 2)
            return "APPROVE";
        return "COMMENT";
    }
    consolidateFindings(results) {
        const allFindings = results.flatMap((r) => r.findings);
        // Remove duplicates and prioritize by severity
        const uniqueFindings = new Map();
        for (const finding of allFindings) {
            const key = `${finding.file}:${finding.line}:${finding.message}`;
            const existing = uniqueFindings.get(key);
            if (!existing ||
                this.getSeverityWeight(finding.severity) >
                    this.getSeverityWeight(existing.severity)) {
                uniqueFindings.set(key, finding);
            }
        }
        return Array.from(uniqueFindings.values()).sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
    }
    consolidateSuggestions(results) {
        const allSuggestions = results.flatMap((r) => r.suggestions);
        // Remove duplicates and prioritize by impact
        const uniqueSuggestions = new Map();
        for (const suggestion of allSuggestions) {
            const key = `${suggestion.file}:${suggestion.line_start}:${suggestion.type}`;
            const existing = uniqueSuggestions.get(key);
            if (!existing ||
                this.getImpactWeight(suggestion.impact) >
                    this.getImpactWeight(existing.impact)) {
                uniqueSuggestions.set(key, suggestion);
            }
        }
        return Array.from(uniqueSuggestions.values()).sort((a, b) => this.getImpactWeight(b.impact) - this.getImpactWeight(a.impact));
    }
    generateRecommendation(results, analysis) {
        const avgScore = results.reduce((sum, r) => sum + r.overall_score, 0) / results.length;
        const criticalFindings = results
            .flatMap((r) => r.findings)
            .filter((f) => f.severity === "critical").length;
        if (criticalFindings > 0) {
            return "Address critical security or functionality issues before merging.";
        }
        if (avgScore > 85) {
            return "Code quality is excellent. Ready for merge after minor adjustments.";
        }
        if (avgScore > 70) {
            return "Good code quality with some areas for improvement. Consider addressing suggestions.";
        }
        return "Significant improvements needed. Please address the identified issues.";
    }
    calculateOverallConfidence(results) {
        if (results.length === 0)
            return 0;
        return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    }
    calculateReviewQuality(results) {
        if (results.length === 0)
            return 0;
        const scores = results.map((r) => r.overall_score);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        // Adjust for review thoroughness
        const thoroughnessBonus = Math.min(results.length * 5, 20);
        return Math.min(avgScore + thoroughnessBonus, 100);
    }
    getSeverityWeight(severity) {
        const weights = { critical: 4, high: 3, medium: 2, low: 1 };
        return weights[severity] || 1;
    }
    getImpactWeight(impact) {
        const weights = { high: 3, medium: 2, low: 1 };
        return weights[impact] || 1;
    }
    async getAvailableAgents() {
        // This would integrate with the bridge to get available agents
        return [];
    }
    setupEventHandlers() {
        this.on("review-timeout", (sessionId) => {
            const session = this.activeReviews.get(sessionId);
            if (session) {
                session.status = "timeout";
                console.warn(`Review session ${sessionId} timed out`);
            }
        });
    }
    /**
     * Get active review sessions
     */
    getActiveReviews() {
        return this.activeReviews;
    }
    /**
     * Cancel a review session
     */
    async cancelReview(sessionId) {
        const session = this.activeReviews.get(sessionId);
        if (session) {
            session.status = "cancelled";
            this.activeReviews.delete(sessionId);
            this.emit("pr-review-cancelled", { sessionId });
        }
    }
}
class PRReviewSession {
    id;
    request;
    strategy;
    analysis;
    status;
    created_at;
    completed_at;
    results;
    constructor(id, request, strategy, analysis) {
        this.id = id;
        this.request = request;
        this.strategy = strategy;
        this.analysis = analysis;
        this.status = "pending";
        this.created_at = new Date();
    }
}
//# sourceMappingURL=github-a2a-pr-system.js.map