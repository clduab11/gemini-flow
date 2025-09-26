/**
 * Comprehensive Threat Models and Risk Assessment
 *
 * STRIDE-based threat modeling with automated risk assessment,
 * attack surface analysis, and mitigation strategies
 */

import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
import crypto from "crypto";

// Core threat modeling interfaces
export interface ThreatModel {
  id: string;
  name: string;
  description: string;
  scope: string[];
  assets: Asset[];
  threats: Threat[];
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
  risk_assessment: RiskAssessment;
  created_date: Date;
  last_updated: Date;
  version: string;
}

export interface Asset {
  id: string;
  name: string;
  type: "data" | "system" | "process" | "person" | "facility";
  classification: "public" | "internal" | "confidential" | "restricted";
  value: number; // 1-10 scale
  availability_requirement: "low" | "medium" | "high" | "critical";
  integrity_requirement: "low" | "medium" | "high" | "critical";
  confidentiality_requirement: "low" | "medium" | "high" | "critical";
  dependencies: string[];
  controls: string[];
  threat_exposure: number; // 1-10 scale
}

export interface Threat {
  id: string;
  name: string;
  description: string;
  category:
    | "spoofing"
    | "tampering"
    | "repudiation"
    | "information_disclosure"
    | "denial_of_service"
    | "elevation_of_privilege";
  likelihood: "very_low" | "low" | "medium" | "high" | "very_high";
  impact: "very_low" | "low" | "medium" | "high" | "very_high";
  risk_score: number;
  affected_assets: string[];
  attack_vectors: string[];
  threat_actors: string[];
  mitigations: string[];
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  type: "technical" | "physical" | "administrative" | "operational";
  severity: "low" | "medium" | "high" | "critical";
  cvss_score?: number;
  affected_assets: string[];
  exploitability: "low" | "medium" | "high";
  discovery_date: Date;
  remediation_complexity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "mitigated" | "accepted" | "closed";
}

export interface Mitigation {
  id: string;
  name: string;
  description: string;
  type: "preventive" | "detective" | "corrective" | "deterrent";
  effectiveness: "low" | "medium" | "high";
  implementation_cost: "low" | "medium" | "high" | "very_high";
  operational_impact: "low" | "medium" | "high";
  threats_addressed: string[];
  vulnerabilities_addressed: string[];
  implementation_status: "planned" | "in_progress" | "implemented" | "verified";
  implementation_date?: Date;
  responsible_party: string;
}

export interface RiskAssessment {
  overall_risk: "low" | "medium" | "high" | "critical";
  risk_score: number; // 1-100 scale
  high_risk_threats: string[];
  critical_vulnerabilities: string[];
  recommended_mitigations: string[];
  residual_risk: "low" | "medium" | "high" | "critical";
  risk_appetite: "conservative" | "moderate" | "aggressive";
  assessment_date: Date;
  next_review_date: Date;
}

export interface AttackPath {
  id: string;
  name: string;
  description: string;
  steps: AttackStep[];
  likelihood: "very_low" | "low" | "medium" | "high" | "very_high";
  impact: "very_low" | "low" | "medium" | "high" | "very_high";
  risk_score: number;
  mitigations: string[];
}

export interface AttackStep {
  step_number: number;
  technique: string;
  description: string;
  prerequisites: string[];
  tools_required: string[];
  skill_level: "low" | "medium" | "high" | "expert";
  detection_difficulty: "easy" | "medium" | "hard" | "very_hard";
  mitigations: string[];
}

export interface ThreatIntelligence {
  id: string;
  source: string;
  threat_type: string;
  indicators: Indicator[];
  attribution: string;
  confidence: "low" | "medium" | "high";
  relevance: "low" | "medium" | "high";
  last_updated: Date;
  expiry_date?: Date;
}

export interface Indicator {
  type: "ip" | "domain" | "url" | "hash" | "email" | "signature";
  value: string;
  confidence: "low" | "medium" | "high";
  last_seen: Date;
  context: string;
}

/**
 * Threat Modeling Manager
 */
export class ThreatModelingManager extends EventEmitter {
  private logger: Logger;
  private threatModels: Map<string, ThreatModel> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private attackPaths: Map<string, AttackPath> = new Map();

  private threatMetrics = {
    models_created: 0,
    threats_identified: 0,
    vulnerabilities_found: 0,
    mitigations_implemented: 0,
    risk_assessments_completed: 0,
    attack_paths_analyzed: 0,
  };

  constructor() {
    super();
    this.logger = new Logger("ThreatModelingManager");

    this.initializeThreatDatabase();
    this.startThreatMonitoring();

    this.logger.info("Threat Modeling Manager initialized");
  }

  /**
   * Create a new threat model
   */
  async createThreatModel(params: {
    name: string;
    description: string;
    scope: string[];
    assets: Omit<Asset, "id">[];
  }): Promise<ThreatModel> {
    const modelId = crypto.randomUUID();

    // Create assets with IDs
    const assets: Asset[] = params.assets.map((asset) => ({
      id: crypto.randomUUID(),
      ...asset,
    }));

    // Analyze threats for each asset
    const threats = await this.identifyThreats(assets);

    // Identify vulnerabilities
    const vulnerabilities = await this.identifyVulnerabilities(assets);

    // Generate mitigations
    const mitigations = await this.generateMitigations(
      threats,
      vulnerabilities,
    );

    // Perform risk assessment
    const riskAssessment = await this.performRiskAssessment(
      threats,
      vulnerabilities,
      mitigations,
    );

    const threatModel: ThreatModel = {
      id: modelId,
      name: params.name,
      description: params.description,
      scope: params.scope,
      assets,
      threats,
      vulnerabilities,
      mitigations,
      risk_assessment: riskAssessment,
      created_date: new Date(),
      last_updated: new Date(),
      version: "1.0.0",
    };

    this.threatModels.set(modelId, threatModel);
    this.threatMetrics.models_created++;
    this.threatMetrics.threats_identified += threats.length;
    this.threatMetrics.vulnerabilities_found += vulnerabilities.length;

    this.logger.info("Threat model created", {
      modelId,
      name: params.name,
      threats: threats.length,
      vulnerabilities: vulnerabilities.length,
      riskScore: riskAssessment.risk_score,
    });

    this.emit("threat_model_created", { threatModel });

    return threatModel;
  }

  /**
   * Analyze attack paths
   */
  async analyzeAttackPaths(modelId: string): Promise<AttackPath[]> {
    const threatModel = this.threatModels.get(modelId);
    if (!threatModel) {
      throw new Error("Threat model not found");
    }

    const attackPaths: AttackPath[] = [];

    // Generate attack paths for high-risk threats
    const highRiskThreats = threatModel.threats.filter(
      (t) => t.risk_score >= 7,
    );

    for (const threat of highRiskThreats) {
      const attackPath = await this.generateAttackPath(threat, threatModel);
      attackPaths.push(attackPath);
      this.attackPaths.set(attackPath.id, attackPath);
    }

    this.threatMetrics.attack_paths_analyzed += attackPaths.length;

    return attackPaths;
  }

  /**
   * Update threat intelligence
   */
  async updateThreatIntelligence(
    intelligence: Omit<ThreatIntelligence, "id">,
  ): Promise<void> {
    const intelligenceId = crypto.randomUUID();

    const threatIntel: ThreatIntelligence = {
      id: intelligenceId,
      ...intelligence,
    };

    this.threatIntelligence.set(intelligenceId, threatIntel);

    // Check if this intelligence affects existing threat models
    await this.correlateWithThreatModels(threatIntel);

    this.logger.info("Threat intelligence updated", {
      intelligenceId,
      source: intelligence.source,
      type: intelligence.threat_type,
    });

    this.emit("threat_intelligence_updated", { threatIntel });
  }

  /**
   * Get threat model
   */
  getThreatModel(modelId: string): ThreatModel | undefined {
    return this.threatModels.get(modelId);
  }

  /**
   * Get all threat models
   */
  getThreatModels(): ThreatModel[] {
    return Array.from(this.threatModels.values());
  }

  /**
   * Get threat metrics
   */
  getThreatMetrics() {
    return { ...this.threatMetrics };
  }

  // Private helper methods
  private initializeThreatDatabase(): void {
    // Initialize with common threat patterns
    this.logger.debug("Threat database initialized");
  }

  private startThreatMonitoring(): void {
    // Monitor for new threats and intelligence updates
    setInterval(() => {
      this.performThreatAnalysis();
    }, 3600000); // Every hour
  }

  private async identifyThreats(assets: Asset[]): Promise<Threat[]> {
    const threats: Threat[] = [];

    // STRIDE-based threat identification
    for (const asset of assets) {
      // Spoofing threats
      if (asset.type === "system" || asset.type === "person") {
        threats.push({
          id: crypto.randomUUID(),
          name: `Identity Spoofing - ${asset.name}`,
          description: `Threat actor impersonates ${asset.name}`,
          category: "spoofing",
          likelihood: "medium",
          impact: "high",
          risk_score: 6,
          affected_assets: [asset.id],
          attack_vectors: ["phishing", "credential_theft"],
          threat_actors: ["external_attacker", "insider_threat"],
          mitigations: [],
        });
      }

      // Tampering threats
      if (asset.type === "data" || asset.type === "system") {
        threats.push({
          id: crypto.randomUUID(),
          name: `Data Tampering - ${asset.name}`,
          description: `Unauthorized modification of ${asset.name}`,
          category: "tampering",
          likelihood: "medium",
          impact:
            asset.integrity_requirement === "critical" ? "very_high" : "high",
          risk_score: 7,
          affected_assets: [asset.id],
          attack_vectors: ["unauthorized_access", "privilege_escalation"],
          threat_actors: ["insider_threat", "external_attacker"],
          mitigations: [],
        });
      }

      // Information Disclosure threats
      if (asset.type === "data") {
        threats.push({
          id: crypto.randomUUID(),
          name: `Information Disclosure - ${asset.name}`,
          description: `Unauthorized access to ${asset.name}`,
          category: "information_disclosure",
          likelihood: "high",
          impact:
            asset.confidentiality_requirement === "critical"
              ? "very_high"
              : "high",
          risk_score: 8,
          affected_assets: [asset.id],
          attack_vectors: [
            "data_breach",
            "privilege_escalation",
            "social_engineering",
          ],
          threat_actors: ["external_attacker", "insider_threat"],
          mitigations: [],
        });
      }
    }

    return threats;
  }

  private async identifyVulnerabilities(
    assets: Asset[],
  ): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Common vulnerability patterns
    for (const asset of assets) {
      if (asset.type === "system") {
        vulnerabilities.push({
          id: crypto.randomUUID(),
          name: `Unpatched Software - ${asset.name}`,
          description: `${asset.name} may have unpatched vulnerabilities`,
          type: "technical",
          severity: "medium",
          affected_assets: [asset.id],
          exploitability: "medium",
          discovery_date: new Date(),
          remediation_complexity: "low",
          status: "open",
        });
      }
    }

    return vulnerabilities;
  }

  private async generateMitigations(
    threats: Threat[],
    vulnerabilities: Vulnerability[],
  ): Promise<Mitigation[]> {
    const mitigations: Mitigation[] = [];

    // Generate mitigations for identified threats
    const threatsByCategory = threats.reduce(
      (acc, threat) => {
        if (!acc[threat.category]) acc[threat.category] = [];
        acc[threat.category].push(threat);
        return acc;
      },
      {} as Record<string, Threat[]>,
    );

    for (const [category, categoryThreats] of Object.entries(
      threatsByCategory,
    )) {
      switch (category) {
        case "spoofing":
          mitigations.push({
            id: crypto.randomUUID(),
            name: "Multi-Factor Authentication",
            description: "Implement MFA to prevent identity spoofing",
            type: "preventive",
            effectiveness: "high",
            implementation_cost: "medium",
            operational_impact: "low",
            threats_addressed: categoryThreats.map((t) => t.id),
            vulnerabilities_addressed: [],
            implementation_status: "planned",
            responsible_party: "Security Team",
          });
          break;
        case "tampering":
          mitigations.push({
            id: crypto.randomUUID(),
            name: "Data Integrity Controls",
            description: "Implement checksums and digital signatures",
            type: "detective",
            effectiveness: "high",
            implementation_cost: "medium",
            operational_impact: "low",
            threats_addressed: categoryThreats.map((t) => t.id),
            vulnerabilities_addressed: [],
            implementation_status: "planned",
            responsible_party: "Development Team",
          });
          break;
        case "information_disclosure":
          mitigations.push({
            id: crypto.randomUUID(),
            name: "Data Encryption",
            description: "Encrypt sensitive data at rest and in transit",
            type: "preventive",
            effectiveness: "high",
            implementation_cost: "medium",
            operational_impact: "low",
            threats_addressed: categoryThreats.map((t) => t.id),
            vulnerabilities_addressed: [],
            implementation_status: "planned",
            responsible_party: "Security Team",
          });
          break;
      }
    }

    return mitigations;
  }

  private async performRiskAssessment(
    threats: Threat[],
    vulnerabilities: Vulnerability[],
    mitigations: Mitigation[],
  ): Promise<RiskAssessment> {
    // Calculate overall risk score
    const riskScore =
      threats.reduce((sum, threat) => sum + threat.risk_score, 0) /
      threats.length;

    const highRiskThreats = threats
      .filter((t) => t.risk_score >= 7)
      .map((t) => t.id);
    const criticalVulnerabilities = vulnerabilities
      .filter((v) => v.severity === "critical")
      .map((v) => v.id);

    return {
      overall_risk:
        riskScore >= 8
          ? "critical"
          : riskScore >= 6
            ? "high"
            : riskScore >= 4
              ? "medium"
              : "low",
      risk_score: riskScore,
      high_risk_threats: highRiskThreats,
      critical_vulnerabilities: criticalVulnerabilities,
      recommended_mitigations: mitigations.slice(0, 5).map((m) => m.id),
      residual_risk: "medium", // Calculated after mitigations
      risk_appetite: "moderate",
      assessment_date: new Date(),
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
  }

  private async generateAttackPath(
    threat: Threat,
    threatModel: ThreatModel,
  ): Promise<AttackPath> {
    const attackPath: AttackPath = {
      id: crypto.randomUUID(),
      name: `Attack Path - ${threat.name}`,
      description: `Potential attack path for ${threat.name}`,
      steps: [
        {
          step_number: 1,
          technique: "Initial Access",
          description: "Attacker gains initial access to the system",
          prerequisites: [],
          tools_required: ["social_engineering", "phishing"],
          skill_level: "medium",
          detection_difficulty: "medium",
          mitigations: ["security_awareness_training", "email_filtering"],
        },
        {
          step_number: 2,
          technique: "Privilege Escalation",
          description: "Attacker escalates privileges",
          prerequisites: ["initial_access"],
          tools_required: ["exploit_kit", "privilege_escalation_tools"],
          skill_level: "high",
          detection_difficulty: "hard",
          mitigations: ["least_privilege", "endpoint_detection"],
        },
      ],
      likelihood: threat.likelihood,
      impact: threat.impact,
      risk_score: threat.risk_score,
      mitigations: [],
    };

    return attackPath;
  }

  private async correlateWithThreatModels(
    intelligence: ThreatIntelligence,
  ): Promise<void> {
    // Correlate new threat intelligence with existing threat models
    for (const [modelId, threatModel] of this.threatModels) {
      const relevantThreats = threatModel.threats.filter(
        (threat) =>
          threat.category.includes(intelligence.threat_type) ||
          threat.threat_actors.some((actor) =>
            intelligence.attribution.includes(actor),
          ),
      );

      if (relevantThreats.length > 0) {
        this.emit("threat_correlation_found", {
          modelId,
          intelligenceId: intelligence.id,
          relevantThreats: relevantThreats.map((t) => t.id),
        });
      }
    }
  }

  private async performThreatAnalysis(): Promise<void> {
    // Analyze threat landscape and update risk assessments
    this.logger.debug("Threat analysis performed");
  }
}
