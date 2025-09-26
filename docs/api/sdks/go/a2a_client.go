// Package a2aclient provides a comprehensive Go client for Gemini Flow's
// Agent-to-Agent (A2A) communication system. Supports all 104 A2A-enabled MCP tools
// with full type safety and advanced coordination patterns.
//
// Version: 2.0.0-a2a
// Author: Gemini Flow A2A Team
package a2aclient

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/google/uuid"
)

// Core Configuration Types

// A2ACertificate represents SSL certificate configuration for A2A authentication
type A2ACertificate struct {
	CertFile   string `json:"cert_file"`
	KeyFile    string `json:"key_file"`
	CAFile     string `json:"ca_file,omitempty"`
	Passphrase string `json:"passphrase,omitempty"`
}

// RetryPolicy defines retry behavior configuration
type RetryPolicy struct {
	MaxRetries       int           `json:"max_retries"`
	BackoffStrategy  string        `json:"backoff_strategy"` // "linear", "exponential", "custom"
	BaseDelay        time.Duration `json:"base_delay"`
	MaxDelay         time.Duration `json:"max_delay"`
	RetryableErrors  []string      `json:"retryable_errors"`
}

// LoggingConfig defines logging behavior
type LoggingConfig struct {
	Level                  string `json:"level"` // "DEBUG", "INFO", "WARN", "ERROR"
	EnableRequestLogging   bool   `json:"enable_request_logging"`
	EnableResponseLogging  bool   `json:"enable_response_logging"`
}

// A2AClientConfig is the main client configuration
type A2AClientConfig struct {
	BaseURL           string             `json:"base_url"`
	APIKey            string             `json:"api_key,omitempty"`
	Certificate       *A2ACertificate    `json:"certificate,omitempty"`
	Timeout           time.Duration      `json:"timeout"`
	RetryPolicy       *RetryPolicy       `json:"retry_policy"`
	WebSocketEnabled  bool               `json:"websocket_enabled"`
	Logging           *LoggingConfig     `json:"logging"`
}

// Agent and Targeting Types

// AgentRole represents the available agent roles
type AgentRole string

const (
	AgentRoleCoordinator        AgentRole = "coordinator"
	AgentRoleResearcher         AgentRole = "researcher"
	AgentRoleCoder              AgentRole = "coder"
	AgentRoleAnalyst            AgentRole = "analyst"
	AgentRoleOptimizer          AgentRole = "optimizer"
	AgentRoleTester             AgentRole = "tester"
	AgentRoleReviewer           AgentRole = "reviewer"
	AgentRoleSpawner            AgentRole = "spawner"
	AgentRoleMemoryManager      AgentRole = "memory-manager"
	AgentRoleTaskOrchestrator   AgentRole = "task-orchestrator"
	AgentRoleNeuralTrainer      AgentRole = "neural-trainer"
	AgentRoleSystemArchitect    AgentRole = "system-architect"
	AgentRolePerformanceMonitor AgentRole = "performance-monitor"
	AgentRoleSecurityManager    AgentRole = "security-manager"
	AgentRoleDAACoordinator     AgentRole = "daa-coordinator"
	AgentRoleConsensusManager   AgentRole = "consensus-manager"
	AgentRoleResourceAllocator  AgentRole = "resource-allocator"
)

// AgentFilter defines filter criteria for agent selection
type AgentFilter struct {
	Role         *AgentRole `json:"role,omitempty"`
	Capabilities []string   `json:"capabilities,omitempty"`
	Status       string     `json:"status,omitempty"` // "active", "idle", "busy"
	SwarmID      string     `json:"swarm_id,omitempty"`
}

// AgentCondition defines conditional criteria for agent targeting
type AgentCondition struct {
	Type     string      `json:"type"`     // "capability", "resource", "status", "location", "custom"
	Operator string      `json:"operator"` // "equals", "not_equals", "contains", "greater_than", "less_than"
	Value    interface{} `json:"value"`
}

// Agent Targeting Types

// SingleTarget targets a single specific agent
type SingleTarget struct {
	Type    string `json:"type"` // "single"
	AgentID string `json:"agent_id"`
}

// MultipleTargets targets multiple specific agents
type MultipleTargets struct {
	Type             string   `json:"type"` // "multiple"
	AgentIDs         []string `json:"agent_ids"`
	CoordinationMode string   `json:"coordination_mode"` // "parallel", "sequential", "race"
}

// GroupTarget targets agents by role/capabilities
type GroupTarget struct {
	Type              string    `json:"type"` // "group"
	Role              AgentRole `json:"role"`
	Capabilities      []string  `json:"capabilities,omitempty"`
	MaxAgents         *int      `json:"max_agents,omitempty"`
	SelectionStrategy string    `json:"selection_strategy"` // "random", "load-balanced", "capability-matched"
}

// BroadcastTarget broadcasts to multiple agents with filter
type BroadcastTarget struct {
	Type          string       `json:"type"` // "broadcast"
	Filter        *AgentFilter `json:"filter,omitempty"`
	ExcludeSource bool         `json:"exclude_source,omitempty"`
}

// ConditionalTarget targets agents based on conditions
type ConditionalTarget struct {
	Type       string            `json:"type"` // "conditional"
	Conditions []AgentCondition  `json:"conditions"`
	Fallback   *AgentTarget      `json:"fallback,omitempty"`
}

// AgentTarget is a union type for all targeting options
type AgentTarget struct {
	SingleTarget      *SingleTarget      `json:"single_target,omitempty"`
	MultipleTargets   *MultipleTargets   `json:"multiple_targets,omitempty"`
	GroupTarget       *GroupTarget       `json:"group_target,omitempty"`
	BroadcastTarget   *BroadcastTarget   `json:"broadcast_target,omitempty"`
	ConditionalTarget *ConditionalTarget `json:"conditional_target,omitempty"`
}

// Coordination Mode Types

// DirectCoordination represents direct 1-to-1 coordination
type DirectCoordination struct {
	Mode           string `json:"mode"` // "direct"
	Timeout        *int   `json:"timeout,omitempty"`
	Retries        *int   `json:"retries,omitempty"`
	Acknowledgment bool   `json:"acknowledgment"`
}

// BroadcastCoordination represents 1-to-many broadcast coordination
type BroadcastCoordination struct {
	Mode           string `json:"mode"` // "broadcast"
	Aggregation    string `json:"aggregation"` // "all", "majority", "first", "any"
	Timeout        *int   `json:"timeout,omitempty"`
	PartialSuccess bool   `json:"partial_success,omitempty"`
}

// ConsensusCoordination represents many-to-many consensus coordination
type ConsensusCoordination struct {
	Mode                string `json:"mode"` // "consensus"
	ConsensusType       string `json:"consensus_type"` // "unanimous", "majority", "weighted"
	VotingTimeout       *int   `json:"voting_timeout,omitempty"`
	MinimumParticipants *int   `json:"minimum_participants,omitempty"`
}

// PipelineStage represents an individual stage in a pipeline
type PipelineStage struct {
	Name            string       `json:"name,omitempty"`
	AgentTarget     *AgentTarget `json:"agent_target,omitempty"`
	ToolName        string       `json:"tool_name,omitempty"`
	Parameters      interface{}  `json:"parameters,omitempty"`
	InputTransform  string       `json:"input_transform,omitempty"`
	OutputTransform string       `json:"output_transform,omitempty"`
	Timeout         *int         `json:"timeout,omitempty"`
}

// PipelineCoordination represents sequential pipeline coordination
type PipelineCoordination struct {
	Mode             string           `json:"mode"` // "pipeline"
	Stages           []PipelineStage  `json:"stages"`
	FailureStrategy  string           `json:"failure_strategy"` // "abort", "skip", "retry"
	StatePassthrough bool             `json:"state_passthrough"`
}

// CoordinationMode is a union type for all coordination modes
type CoordinationMode struct {
	DirectCoordination    *DirectCoordination    `json:"direct_coordination,omitempty"`
	BroadcastCoordination *BroadcastCoordination `json:"broadcast_coordination,omitempty"`
	ConsensusCoordination *ConsensusCoordination `json:"consensus_coordination,omitempty"`
	PipelineCoordination  *PipelineCoordination  `json:"pipeline_coordination,omitempty"`
}

// Message Priority
type MessagePriority string

const (
	MessagePriorityLow      MessagePriority = "low"
	MessagePriorityMedium   MessagePriority = "medium"
	MessagePriorityHigh     MessagePriority = "high" 
	MessagePriorityCritical MessagePriority = "critical"
)

// MCP Tool Names - All 104 A2A-Enabled Tools
type MCPToolName string

const (
	// Core Infrastructure (16 tools)
	MCPToolClaudeFlowSwarmInit       MCPToolName = "mcp__gemini-flow__swarm_init"
	MCPToolClaudeFlowSwarmStatus     MCPToolName = "mcp__gemini-flow__swarm_status"
	MCPToolClaudeFlowSwarmMonitor    MCPToolName = "mcp__gemini-flow__swarm_monitor"
	MCPToolClaudeFlowSwarmScale      MCPToolName = "mcp__gemini-flow__swarm_scale"
	MCPToolClaudeFlowSwarmDestroy    MCPToolName = "mcp__gemini-flow__swarm_destroy"
	MCPToolRuvSwarmSwarmInit         MCPToolName = "mcp__ruv-swarm__swarm_init"
	MCPToolRuvSwarmSwarmStatus       MCPToolName = "mcp__ruv-swarm__swarm_status"
	MCPToolRuvSwarmSwarmMonitor      MCPToolName = "mcp__ruv-swarm__swarm_monitor"
	MCPToolClaudeFlowAgentSpawn      MCPToolName = "mcp__gemini-flow__agent_spawn"
	MCPToolClaudeFlowAgentList       MCPToolName = "mcp__gemini-flow__agent_list"
	MCPToolClaudeFlowAgentMetrics    MCPToolName = "mcp__gemini-flow__agent_metrics"
	MCPToolRuvSwarmAgentSpawn        MCPToolName = "mcp__ruv-swarm__agent_spawn"
	MCPToolRuvSwarmAgentList         MCPToolName = "mcp__ruv-swarm__agent_list"
	MCPToolRuvSwarmAgentMetrics      MCPToolName = "mcp__ruv-swarm__agent_metrics"
	MCPToolClaudeFlowTopologyOptimize MCPToolName = "mcp__gemini-flow__topology_optimize"
	MCPToolClaudeFlowCoordinationSync MCPToolName = "mcp__gemini-flow__coordination_sync"

	// Task Orchestration (12 tools)
	MCPToolClaudeFlowTaskOrchestrate  MCPToolName = "mcp__gemini-flow__task_orchestrate"
	MCPToolClaudeFlowTaskStatus       MCPToolName = "mcp__gemini-flow__task_status"
	MCPToolClaudeFlowTaskResults      MCPToolName = "mcp__gemini-flow__task_results"
	MCPToolRuvSwarmTaskOrchestrate    MCPToolName = "mcp__ruv-swarm__task_orchestrate"
	MCPToolRuvSwarmTaskStatus         MCPToolName = "mcp__ruv-swarm__task_status"
	MCPToolRuvSwarmTaskResults        MCPToolName = "mcp__ruv-swarm__task_results"
	MCPToolClaudeFlowParallelExecute  MCPToolName = "mcp__gemini-flow__parallel_execute"
	MCPToolClaudeFlowBatchProcess     MCPToolName = "mcp__gemini-flow__batch_process"
	MCPToolClaudeFlowLoadBalance      MCPToolName = "mcp__gemini-flow__load_balance"
	MCPToolClaudeFlowWorkflowCreate   MCPToolName = "mcp__gemini-flow__workflow_create"
	MCPToolClaudeFlowWorkflowExecute  MCPToolName = "mcp__gemini-flow__workflow_execute"
	MCPToolClaudeFlowWorkflowExport   MCPToolName = "mcp__gemini-flow__workflow_export"

	// Memory & State Management (14 tools)
	MCPToolClaudeFlowMemoryUsage      MCPToolName = "mcp__gemini-flow__memory_usage"
	MCPToolClaudeFlowMemorySearch     MCPToolName = "mcp__gemini-flow__memory_search"
	MCPToolClaudeFlowMemoryPersist    MCPToolName = "mcp__gemini-flow__memory_persist"
	MCPToolClaudeFlowMemoryNamespace  MCPToolName = "mcp__gemini-flow__memory_namespace"
	MCPToolClaudeFlowMemoryBackup     MCPToolName = "mcp__gemini-flow__memory_backup"
	MCPToolClaudeFlowMemoryRestore    MCPToolName = "mcp__gemini-flow__memory_restore"
	MCPToolClaudeFlowMemoryCompress   MCPToolName = "mcp__gemini-flow__memory_compress"
	MCPToolClaudeFlowMemorySync       MCPToolName = "mcp__gemini-flow__memory_sync"
	MCPToolClaudeFlowMemoryAnalytics  MCPToolName = "mcp__gemini-flow__memory_analytics"
	MCPToolRuvSwarmMemoryUsage        MCPToolName = "mcp__ruv-swarm__memory_usage"
	MCPToolClaudeFlowStateSnapshot    MCPToolName = "mcp__gemini-flow__state_snapshot"
	MCPToolClaudeFlowContextRestore   MCPToolName = "mcp__gemini-flow__context_restore"
	MCPToolClaudeFlowCacheManage      MCPToolName = "mcp__gemini-flow__cache_manage"
	MCPToolClaudeFlowConfigManage     MCPToolName = "mcp__gemini-flow__config_manage"

	// Neural & AI Operations (17 tools)
	MCPToolClaudeFlowNeuralStatus     MCPToolName = "mcp__gemini-flow__neural_status"
	MCPToolClaudeFlowNeuralTrain      MCPToolName = "mcp__gemini-flow__neural_train"
	MCPToolClaudeFlowNeuralPatterns   MCPToolName = "mcp__gemini-flow__neural_patterns"
	MCPToolClaudeFlowNeuralPredict    MCPToolName = "mcp__gemini-flow__neural_predict"
	MCPToolClaudeFlowNeuralCompress   MCPToolName = "mcp__gemini-flow__neural_compress"
	MCPToolClaudeFlowNeuralExplain    MCPToolName = "mcp__gemini-flow__neural_explain"
	MCPToolRuvSwarmNeuralStatus       MCPToolName = "mcp__ruv-swarm__neural_status"
	MCPToolRuvSwarmNeuralTrain        MCPToolName = "mcp__ruv-swarm__neural_train"
	MCPToolRuvSwarmNeuralPatterns     MCPToolName = "mcp__ruv-swarm__neural_patterns"
	MCPToolClaudeFlowModelLoad        MCPToolName = "mcp__gemini-flow__model_load"
	MCPToolClaudeFlowModelSave        MCPToolName = "mcp__gemini-flow__model_save"
	MCPToolClaudeFlowInferenceRun     MCPToolName = "mcp__gemini-flow__inference_run"
	MCPToolClaudeFlowPatternRecognize MCPToolName = "mcp__gemini-flow__pattern_recognize"
	MCPToolClaudeFlowCognitiveAnalyze MCPToolName = "mcp__gemini-flow__cognitive_analyze"
	MCPToolClaudeFlowLearningAdapt    MCPToolName = "mcp__gemini-flow__learning_adapt"
	MCPToolClaudeFlowEnsembleCreate   MCPToolName = "mcp__gemini-flow__ensemble_create"
	MCPToolClaudeFlowTransferLearn    MCPToolName = "mcp__gemini-flow__transfer_learn"

	// DAA Systems (18 tools)
	MCPToolClaudeFlowDAAAgentCreate     MCPToolName = "mcp__gemini-flow__daa_agent_create"
	MCPToolClaudeFlowDAACapabilityMatch MCPToolName = "mcp__gemini-flow__daa_capability_match"
	MCPToolClaudeFlowDAAResourceAlloc   MCPToolName = "mcp__gemini-flow__daa_resource_alloc"
	MCPToolClaudeFlowDAALifecycleManage MCPToolName = "mcp__gemini-flow__daa_lifecycle_manage"
	MCPToolClaudeFlowDAACommunication   MCPToolName = "mcp__gemini-flow__daa_communication"
	MCPToolClaudeFlowDAAConsensus       MCPToolName = "mcp__gemini-flow__daa_consensus"
	MCPToolClaudeFlowDAAFaultTolerance  MCPToolName = "mcp__gemini-flow__daa_fault_tolerance"
	MCPToolClaudeFlowDAAOptimization    MCPToolName = "mcp__gemini-flow__daa_optimization"
	MCPToolRuvSwarmDAAInit              MCPToolName = "mcp__ruv-swarm__daa_init"
	MCPToolRuvSwarmDAAAgentCreate       MCPToolName = "mcp__ruv-swarm__daa_agent_create"
	MCPToolRuvSwarmDAAAgentAdapt        MCPToolName = "mcp__ruv-swarm__daa_agent_adapt"
	MCPToolRuvSwarmDAAWorkflowCreate    MCPToolName = "mcp__ruv-swarm__daa_workflow_create"
	MCPToolRuvSwarmDAAWorkflowExecute   MCPToolName = "mcp__ruv-swarm__daa_workflow_execute"
	MCPToolRuvSwarmDAAKnowledgeShare    MCPToolName = "mcp__ruv-swarm__daa_knowledge_share"
	MCPToolRuvSwarmDAALearningStatus    MCPToolName = "mcp__ruv-swarm__daa_learning_status"
	MCPToolRuvSwarmDAACognitivePattern  MCPToolName = "mcp__ruv-swarm__daa_cognitive_pattern"
	MCPToolRuvSwarmDAAMetaLearning      MCPToolName = "mcp__ruv-swarm__daa_meta_learning"
	MCPToolRuvSwarmDAAPerformanceMetrics MCPToolName = "mcp__ruv-swarm__daa_performance_metrics"

	// Performance & Analytics (12 tools)
	MCPToolClaudeFlowPerformanceReport  MCPToolName = "mcp__gemini-flow__performance_report"
	MCPToolClaudeFlowBottleneckAnalyze  MCPToolName = "mcp__gemini-flow__bottleneck_analyze"
	MCPToolClaudeFlowTokenUsage         MCPToolName = "mcp__gemini-flow__token_usage"
	MCPToolClaudeFlowBenchmarkRun       MCPToolName = "mcp__gemini-flow__benchmark_run"
	MCPToolClaudeFlowMetricsCollect     MCPToolName = "mcp__gemini-flow__metrics_collect"
	MCPToolClaudeFlowTrendAnalysis      MCPToolName = "mcp__gemini-flow__trend_analysis"
	MCPToolRuvSwarmBenchmarkRun         MCPToolName = "mcp__ruv-swarm__benchmark_run"
	MCPToolClaudeFlowCostAnalysis       MCPToolName = "mcp__gemini-flow__cost_analysis"
	MCPToolClaudeFlowQualityAssess      MCPToolName = "mcp__gemini-flow__quality_assess"
	MCPToolClaudeFlowErrorAnalysis      MCPToolName = "mcp__gemini-flow__error_analysis"
	MCPToolClaudeFlowUsageStats         MCPToolName = "mcp__gemini-flow__usage_stats"
	MCPToolClaudeFlowHealthCheck        MCPToolName = "mcp__gemini-flow__health_check"

	// GitHub Integration (8 tools)
	MCPToolClaudeFlowGitHubRepoAnalyze   MCPToolName = "mcp__gemini-flow__github_repo_analyze"
	MCPToolClaudeFlowGitHubMetrics       MCPToolName = "mcp__gemini-flow__github_metrics"
	MCPToolClaudeFlowGitHubPRManage      MCPToolName = "mcp__gemini-flow__github_pr_manage"
	MCPToolClaudeFlowGitHubCodeReview    MCPToolName = "mcp__gemini-flow__github_code_review"
	MCPToolClaudeFlowGitHubIssueTrack    MCPToolName = "mcp__gemini-flow__github_issue_track"
	MCPToolClaudeFlowGitHubReleaseCoord  MCPToolName = "mcp__gemini-flow__github_release_coord"
	MCPToolClaudeFlowGitHubWorkflowAuto  MCPToolName = "mcp__gemini-flow__github_workflow_auto"
	MCPToolClaudeFlowGitHubSyncCoord     MCPToolName = "mcp__gemini-flow__github_sync_coord"

	// Workflow & Automation (6 tools)
	MCPToolClaudeFlowAutomationSetup    MCPToolName = "mcp__gemini-flow__automation_setup"
	MCPToolClaudeFlowPipelineCreate     MCPToolName = "mcp__gemini-flow__pipeline_create"
	MCPToolClaudeFlowSchedulerManage    MCPToolName = "mcp__gemini-flow__scheduler_manage"
	MCPToolClaudeFlowTriggerSetup       MCPToolName = "mcp__gemini-flow__trigger_setup"
	MCPToolClaudeFlowWorkflowTemplate   MCPToolName = "mcp__gemini-flow__workflow_template"
	MCPToolClaudeFlowSparcMode          MCPToolName = "mcp__gemini-flow__sparc_mode"

	// System Infrastructure (11 tools)
	MCPToolClaudeFlowTerminalExecute  MCPToolName = "mcp__gemini-flow__terminal_execute"
	MCPToolClaudeFlowFeaturesDetect   MCPToolName = "mcp__gemini-flow__features_detect"
	MCPToolClaudeFlowSecurityScan     MCPToolName = "mcp__gemini-flow__security_scan"
	MCPToolClaudeFlowBackupCreate     MCPToolName = "mcp__gemini-flow__backup_create"
	MCPToolClaudeFlowRestoreSystem    MCPToolName = "mcp__gemini-flow__restore_system"
	MCPToolClaudeFlowLogAnalysis      MCPToolName = "mcp__gemini-flow__log_analysis"
	MCPToolClaudeFlowDiagnosticRun    MCPToolName = "mcp__gemini-flow__diagnostic_run"
	MCPToolClaudeFlowWasmOptimize     MCPToolName = "mcp__gemini-flow__wasm_optimize"
	MCPToolRuvSwarmFeaturesDetect     MCPToolName = "mcp__ruv-swarm__features_detect"
)

// State and Resource Requirements

// StateRequirement defines state access requirements
type StateRequirement struct {
	Type        string   `json:"type"`        // "read", "write", "exclusive", "shared"
	Namespace   string   `json:"namespace"`
	Keys        []string `json:"keys"`
	Consistency string   `json:"consistency"` // "eventual", "strong", "causal"
	Timeout     *int     `json:"timeout,omitempty"`
}

// ResourceRequirement defines resource requirements
type ResourceRequirement struct {
	Type      string          `json:"type"`      // "cpu", "memory", "gpu", "network", "storage", "custom"
	Amount    float64         `json:"amount"`
	Unit      string          `json:"unit"`
	Priority  MessagePriority `json:"priority"`
	Duration  *int            `json:"duration,omitempty"`
	Exclusive bool            `json:"exclusive,omitempty"`
}

// Message and Response Types

// AgentIdentifier represents agent identification
type AgentIdentifier struct {
	AgentID      string    `json:"agent_id"`
	AgentType    AgentRole `json:"agent_type,omitempty"`
	SwarmID      string    `json:"swarm_id,omitempty"`
	Capabilities []string  `json:"capabilities,omitempty"`
}

// ExecutionContext defines execution context for messages
type ExecutionContext struct {
	Timeout     *int                   `json:"timeout,omitempty"`
	Priority    *MessagePriority       `json:"priority,omitempty"`
	Environment map[string]interface{} `json:"environment,omitempty"`
	Resources   interface{}            `json:"resources,omitempty"`
}

// A2AMessage represents the A2A message structure
type A2AMessage struct {
	ID                   string                 `json:"id,omitempty"`
	CorrelationID        string                 `json:"correlation_id,omitempty"`
	ConversationID       string                 `json:"conversation_id,omitempty"`
	Source               *AgentIdentifier       `json:"source,omitempty"`
	Target               AgentTarget            `json:"target"`
	ToolName             MCPToolName            `json:"tool_name"`
	Parameters           map[string]interface{} `json:"parameters,omitempty"`
	Execution            *ExecutionContext      `json:"execution,omitempty"`
	Coordination         CoordinationMode       `json:"coordination"`
	StateRequirements    []StateRequirement     `json:"state_requirements,omitempty"`
	ResourceRequirements []ResourceRequirement  `json:"resource_requirements,omitempty"`
	Timestamp            *int64                 `json:"timestamp,omitempty"`
	TTL                  *int                   `json:"ttl,omitempty"`
	Priority             *MessagePriority       `json:"priority,omitempty"`
	RetryPolicy          *RetryPolicy           `json:"retry_policy,omitempty"`
}

// ResponseMetadata contains response metadata
type ResponseMetadata struct {
	AgentVersion        string      `json:"agent_version,omitempty"`
	ProcessingTime      *float64    `json:"processing_time,omitempty"`
	ResourcesUsed       interface{} `json:"resources_used,omitempty"`
	StateModifications  []interface{} `json:"state_modifications,omitempty"`
}

// A2AError represents A2A error information
type A2AError struct {
	Code            string      `json:"code"`
	Message         string      `json:"message"`
	Details         interface{} `json:"details,omitempty"`
	Recoverable     bool        `json:"recoverable"`
	SuggestedAction string      `json:"suggested_action,omitempty"`
}

// A2AResponse represents the A2A response structure
type A2AResponse struct {
	MessageID     string                 `json:"message_id"`
	CorrelationID string                 `json:"correlation_id,omitempty"`
	Source        AgentIdentifier        `json:"source"`
	Success       bool                   `json:"success"`
	Result        interface{}            `json:"result,omitempty"`
	Error         *A2AError              `json:"error,omitempty"`
	Timestamp     int64                  `json:"timestamp"`
	Metadata      ResponseMetadata       `json:"metadata"`
	Performance   map[string]interface{} `json:"performance,omitempty"`
}

// Custom Error Types

// A2AClientError represents an A2A client error
type A2AClientError struct {
	Code    string
	Message string
	Details interface{}
}

func (e *A2AClientError) Error() string {
	return fmt.Sprintf("A2A Error [%s]: %s", e.Code, e.Message)
}

// NewA2AClientError creates a new A2A client error
func NewA2AClientError(code, message string, details interface{}) *A2AClientError {
	return &A2AClientError{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// A2AClient represents the main A2A client
type A2AClient struct {
	config         *A2AClientConfig
	httpClient     *http.Client
	wsConn         *websocket.Conn
	wsDialer       *websocket.Dialer
	messageQueue   map[string]chan *A2AResponse
	queueMutex     sync.RWMutex
	connected      bool
	connectionMux  sync.RWMutex
}

// NewA2AClient creates a new A2A client
func NewA2AClient(config *A2AClientConfig) *A2AClient {
	// Set defaults
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}
	if config.RetryPolicy == nil {
		config.RetryPolicy = &RetryPolicy{
			MaxRetries:      3,
			BackoffStrategy: "exponential",
			BaseDelay:       1 * time.Second,
			MaxDelay:        30 * time.Second,
			RetryableErrors: []string{"NETWORK_TIMEOUT", "CONNECTION_FAILED"},
		}
	}
	if config.Logging == nil {
		config.Logging = &LoggingConfig{
			Level:                 "INFO",
			EnableRequestLogging:  false,
			EnableResponseLogging: false,
		}
	}

	// Setup HTTP client
	transport := &http.Transport{}
	if config.Certificate != nil {
		cert, err := tls.LoadX509KeyPair(config.Certificate.CertFile, config.Certificate.KeyFile)
		if err == nil {
			transport.TLSClientConfig = &tls.Config{
				Certificates: []tls.Certificate{cert},
			}
		}
	}

	httpClient := &http.Client{
		Timeout:   config.Timeout,
		Transport: transport,
	}

	// Setup WebSocket dialer
	wsDialer := &websocket.Dialer{
		HandshakeTimeout: config.Timeout,
		TLSClientConfig:  transport.TLSClientConfig,
	}

	return &A2AClient{
		config:       config,
		httpClient:   httpClient,
		wsDialer:     wsDialer,
		messageQueue: make(map[string]chan *A2AResponse),
	}
}

// Connect establishes connections to the A2A service
func (c *A2AClient) Connect(ctx context.Context) error {
	c.connectionMux.Lock()
	defer c.connectionMux.Unlock()

	if c.config.WebSocketEnabled {
		if err := c.connectWebSocket(ctx); err != nil {
			return fmt.Errorf("failed to connect WebSocket: %w", err)
		}
	}

	c.connected = true
	return nil
}

// connectWebSocket establishes WebSocket connection
func (c *A2AClient) connectWebSocket(ctx context.Context) error {
	wsURL := c.config.BaseURL
	wsURL = "ws" + wsURL[4:] // Replace http/https with ws/wss
	wsURL += "/ws"

	headers := http.Header{}
	if c.config.APIKey != "" {
		headers.Set("X-API-Key", c.config.APIKey)
	}
	headers.Set("User-Agent", "GeminiFlow-A2A-Go-SDK/2.0.0")

	conn, _, err := c.wsDialer.DialContext(ctx, wsURL, headers)
	if err != nil {
		return err
	}

	c.wsConn = conn

	// Start message handler
	go c.handleWebSocketMessages()

	return nil
}

// handleWebSocketMessages handles incoming WebSocket messages
func (c *A2AClient) handleWebSocketMessages() {
	defer func() {
		if c.wsConn != nil {
			c.wsConn.Close()
		}
	}()

	for {
		_, message, err := c.wsConn.ReadMessage()
		if err != nil {
			break
		}

		var response A2AResponse
		if err := json.Unmarshal(message, &response); err != nil {
			continue
		}

		c.queueMutex.RLock()
		if ch, exists := c.messageQueue[response.CorrelationID]; exists {
			select {
			case ch <- &response:
			default:
			}
		}
		c.queueMutex.RUnlock()
	}
}

// Disconnect closes all connections
func (c *A2AClient) Disconnect() error {
	c.connectionMux.Lock()
	defer c.connectionMux.Unlock()

	if c.wsConn != nil {
		c.wsConn.Close()
		c.wsConn = nil
	}

	c.connected = false
	return nil
}

// IsConnected returns connection status
func (c *A2AClient) IsConnected() bool {
	c.connectionMux.RLock()
	defer c.connectionMux.RUnlock()
	return c.connected
}

// SendMessage sends an A2A message with retry policy
func (c *A2AClient) SendMessage(ctx context.Context, message *A2AMessage) (*A2AResponse, error) {
	// Generate message ID if not provided
	if message.ID == "" {
		message.ID = c.generateMessageID()
	}

	// Add timestamp
	now := time.Now().Unix()
	message.Timestamp = &now

	// Execute with retry
	return c.executeWithRetry(ctx, func() (*A2AResponse, error) {
		return c.doSendMessage(ctx, message)
	})
}

// doSendMessage performs the actual message sending
func (c *A2AClient) doSendMessage(ctx context.Context, message *A2AMessage) (*A2AResponse, error) {
	if c.wsConn != nil {
		return c.sendViaWebSocket(ctx, message)
	}
	return c.sendViaHTTP(ctx, message)
}

// sendViaWebSocket sends message via WebSocket
func (c *A2AClient) sendViaWebSocket(ctx context.Context, message *A2AMessage) (*A2AResponse, error) {
	// Create response channel
	responseChan := make(chan *A2AResponse, 1)
	c.queueMutex.Lock()
	c.messageQueue[message.ID] = responseChan
	c.queueMutex.Unlock()

	defer func() {
		c.queueMutex.Lock()
		delete(c.messageQueue, message.ID)
		c.queueMutex.Unlock()
	}()

	// Send message
	messageBytes, err := json.Marshal(message)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %w", err)
	}

	if err := c.wsConn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
		return nil, fmt.Errorf("failed to send WebSocket message: %w", err)
	}

	// Wait for response
	timeout := c.config.Timeout
	if message.Execution != nil && message.Execution.Timeout != nil {
		timeout = time.Duration(*message.Execution.Timeout) * time.Second
	}

	select {
	case response := <-responseChan:
		return response, nil
	case <-time.After(timeout):
		return nil, NewA2AClientError("A2A_TIMEOUT_ERROR", "WebSocket message timeout", nil)
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// sendViaHTTP sends message via HTTP
func (c *A2AClient) sendViaHTTP(ctx context.Context, message *A2AMessage) (*A2AResponse, error) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.config.BaseURL+"/api/v2/a2a/message", bytes.NewReader(messageBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "GeminiFlow-A2A-Go-SDK/2.0.0")
	if c.config.APIKey != "" {
		req.Header.Set("X-API-Key", c.config.APIKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP request failed with status %d", resp.StatusCode)
	}

	responseBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var response A2AResponse
	if err := json.Unmarshal(responseBytes, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &response, nil
}

// executeWithRetry executes operation with retry policy
func (c *A2AClient) executeWithRetry(ctx context.Context, operation func() (*A2AResponse, error)) (*A2AResponse, error) {
	policy := c.config.RetryPolicy
	var lastErr error

	for attempt := 0; attempt <= policy.MaxRetries; attempt++ {
		response, err := operation()
		if err == nil {
			return response, nil
		}

		lastErr = err

		// Check if error is retryable
		if !c.isRetryableError(err, policy.RetryableErrors) || attempt == policy.MaxRetries {
			break
		}

		// Calculate delay
		var delay time.Duration
		if policy.BackoffStrategy == "exponential" {
			delay = time.Duration(math.Min(float64(policy.BaseDelay)*math.Pow(2, float64(attempt)), float64(policy.MaxDelay)))
		} else {
			delay = time.Duration(math.Min(float64(policy.BaseDelay)*float64(attempt+1), float64(policy.MaxDelay)))
		}

		select {
		case <-time.After(delay):
			continue
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	return nil, lastErr
}

// isRetryableError checks if error is retryable
func (c *A2AClient) isRetryableError(err error, retryableErrors []string) bool {
	if clientErr, ok := err.(*A2AClientError); ok {
		for _, retryableErr := range retryableErrors {
			if clientErr.Code == retryableErr {
				return true
			}
		}
	}
	return false
}

// generateMessageID generates a unique message ID
func (c *A2AClient) generateMessageID() string {
	return fmt.Sprintf("msg_%d_%s", time.Now().UnixMilli(), uuid.New().String()[:8])
}

// High-level helper methods

// InitializeSwarm initializes a new swarm
func (c *A2AClient) InitializeSwarm(ctx context.Context, config SwarmConfig) (*A2AResponse, error) {
	toolName := MCPToolClaudeFlowSwarmInit
	if config.Provider == "ruv-swarm" {
		toolName = MCPToolRuvSwarmSwarmInit
	}

	var coordination CoordinationMode
	if config.CoordinationMode == "broadcast" {
		coordination = CoordinationMode{
			BroadcastCoordination: &BroadcastCoordination{
				Mode:        "broadcast",
				Aggregation: "all",
				Timeout:     intPtr(30),
			},
		}
	} else {
		coordination = CoordinationMode{
			ConsensusCoordination: &ConsensusCoordination{
				Mode:          "consensus",
				ConsensusType: "majority",
			},
		}
	}

	message := &A2AMessage{
		Target: AgentTarget{
			GroupTarget: &GroupTarget{
				Type: "group",
				Role: AgentRoleCoordinator,
			},
		},
		ToolName: toolName,
		Parameters: map[string]interface{}{
			"topology":   config.Topology,
			"maxAgents":  config.MaxAgents,
			"strategy":   config.Strategy,
		},
		Coordination: coordination,
	}

	return c.SendMessage(ctx, message)
}

// SwarmConfig represents swarm initialization configuration
type SwarmConfig struct {
	Provider         string // "claude-flow" or "ruv-swarm"
	Topology         string // "hierarchical", "mesh", "ring", "star"
	MaxAgents        int
	Strategy         string // "parallel", "sequential", "adaptive", "balanced"
	CoordinationMode string // "broadcast" or "consensus"
}

// SpawnAgent spawns a new agent
func (c *A2AClient) SpawnAgent(ctx context.Context, config AgentSpawnConfig) (*A2AResponse, error) {
	message := &A2AMessage{
		Target: AgentTarget{
			GroupTarget: &GroupTarget{
				Type:              "group",
				Role:              AgentRoleSpawner,
				MaxAgents:         intPtr(1),
				SelectionStrategy: "load-balanced",
			},
		},
		ToolName: MCPToolClaudeFlowAgentSpawn,
		Parameters: map[string]interface{}{
			"type":         string(config.Type),
			"name":         config.Name,
			"capabilities": config.Capabilities,
			"placement": map[string]interface{}{
				"strategy": config.PlacementStrategy,
			},
		},
		Coordination: CoordinationMode{
			ConsensusCoordination: &ConsensusCoordination{
				Mode:                "consensus",
				ConsensusType:       "majority",
				MinimumParticipants: intPtr(2),
			},
		},
	}

	return c.SendMessage(ctx, message)
}

// AgentSpawnConfig represents agent spawn configuration
type AgentSpawnConfig struct {
	Type              AgentRole
	Name              string
	Capabilities      []string
	PlacementStrategy string // "load-balanced", "capability-matched", "geographic"
}

// OrchestrateTasks orchestrates a complex task
func (c *A2AClient) OrchestrateTask(ctx context.Context, config TaskOrchestrationConfig) (*A2AResponse, error) {
	var coordination CoordinationMode

	if config.Strategy == "pipeline" && len(config.Stages) > 0 {
		coordination = CoordinationMode{
			PipelineCoordination: &PipelineCoordination{
				Mode:             "pipeline",
				Stages:           config.Stages,
				FailureStrategy:  "abort",
				StatePassthrough: true,
			},
		}
	} else {
		coordination = CoordinationMode{
			BroadcastCoordination: &BroadcastCoordination{
				Mode:        "broadcast",
				Aggregation: "majority",
				Timeout:     intPtr(120),
			},
		}
	}

	message := &A2AMessage{
		Target: AgentTarget{
			GroupTarget: &GroupTarget{
				Type:      "group",
				Role:      AgentRoleTaskOrchestrator,
				MaxAgents: intPtr(config.MaxAgents),
			},
		},
		ToolName: MCPToolClaudeFlowTaskOrchestrate,
		Parameters: map[string]interface{}{
			"task":      config.Task,
			"strategy":  config.Strategy,
			"maxAgents": config.MaxAgents,
		},
		Coordination: coordination,
		Priority:     &config.Priority,
	}

	return c.SendMessage(ctx, message)
}

// TaskOrchestrationConfig represents task orchestration configuration
type TaskOrchestrationConfig struct {
	Task      string
	Strategy  string // "parallel", "sequential", "adaptive", "pipeline"
	MaxAgents int
	Priority  MessagePriority
	Stages    []PipelineStage
}

// StoreMemory stores data in distributed memory
func (c *A2AClient) StoreMemory(ctx context.Context, config MemoryStoreConfig) (*A2AResponse, error) {
	message := &A2AMessage{
		Target: AgentTarget{
			GroupTarget: &GroupTarget{
				Type:      "group",
				Role:      AgentRoleMemoryManager,
				MaxAgents: intPtr(config.ReplicationFactor),
			},
		},
		ToolName: MCPToolClaudeFlowMemoryUsage,
		Parameters: map[string]interface{}{
			"action":    "store",
			"key":       config.Key,
			"value":     config.Value,
			"namespace": config.Namespace,
			"ttl":       config.TTL,
		},
		Coordination: CoordinationMode{
			ConsensusCoordination: &ConsensusCoordination{
				Mode:          "consensus",
				ConsensusType: "majority",
				VotingTimeout: intPtr(10),
			},
		},
		StateRequirements: []StateRequirement{
			{
				Type:        "write",
				Namespace:   config.Namespace,
				Keys:        []string{config.Key},
				Consistency: config.Consistency,
			},
		},
	}

	return c.SendMessage(ctx, message)
}

// MemoryStoreConfig represents memory store configuration
type MemoryStoreConfig struct {
	Key               string
	Value             interface{}
	Namespace         string
	TTL               *int
	Consistency       string // "eventual", "strong", "causal"
	ReplicationFactor int
}

// RetrieveMemory retrieves data from distributed memory
func (c *A2AClient) RetrieveMemory(ctx context.Context, config MemoryRetrieveConfig) (*A2AResponse, error) {
	maxAgents := 1
	var coordination CoordinationMode

	if config.Consistency == "strong" {
		maxAgents = 3
		coordination = CoordinationMode{
			ConsensusCoordination: &ConsensusCoordination{
				Mode:          "consensus",
				ConsensusType: "majority",
			},
		}
	} else {
		coordination = CoordinationMode{
			DirectCoordination: &DirectCoordination{
				Mode: "direct",
			},
		}
	}

	message := &A2AMessage{
		Target: AgentTarget{
			GroupTarget: &GroupTarget{
				Type:      "group",
				Role:      AgentRoleMemoryManager,
				MaxAgents: intPtr(maxAgents),
			},
		},
		ToolName: MCPToolClaudeFlowMemoryUsage,
		Parameters: map[string]interface{}{
			"action":    "retrieve",
			"key":       config.Key,
			"namespace": config.Namespace,
		},
		Coordination: coordination,
		StateRequirements: []StateRequirement{
			{
				Type:        "read",
				Namespace:   config.Namespace,
				Keys:        []string{config.Key},
				Consistency: config.Consistency,
			},
		},
	}

	return c.SendMessage(ctx, message)
}

// MemoryRetrieveConfig represents memory retrieve configuration
type MemoryRetrieveConfig struct {
	Key         string
	Namespace   string
	Consistency string // "eventual", "strong", "causal"
}

// GetSwarmStatus gets swarm status
func (c *A2AClient) GetSwarmStatus(ctx context.Context, swarmID string) (*A2AResponse, error) {
	params := make(map[string]interface{})
	if swarmID != "" {
		params["swarmId"] = swarmID
	}

	message := &A2AMessage{
		Target: AgentTarget{
			GroupTarget: &GroupTarget{
				Type: "group",
				Role: AgentRoleCoordinator,
			},
		},
		ToolName:   MCPToolClaudeFlowSwarmStatus,
		Parameters: params,
		Coordination: CoordinationMode{
			BroadcastCoordination: &BroadcastCoordination{
				Mode:        "broadcast",
				Aggregation: "majority",
			},
		},
	}

	return c.SendMessage(ctx, message)
}

// ListAgents lists all agents
func (c *A2AClient) ListAgents(ctx context.Context, filter *AgentFilter) (*A2AResponse, error) {
	params := make(map[string]interface{})
	if filter != nil {
		params["filter"] = filter
	}

	message := &A2AMessage{
		Target: AgentTarget{
			BroadcastTarget: &BroadcastTarget{
				Type:   "broadcast",
				Filter: filter,
			},
		},
		ToolName:   MCPToolClaudeFlowAgentList,
		Parameters: params,
		Coordination: CoordinationMode{
			BroadcastCoordination: &BroadcastCoordination{
				Mode:        "broadcast",
				Aggregation: "all",
			},
		},
	}

	return c.SendMessage(ctx, message)
}

// A2AUtils provides utility functions for A2A operations
type A2AUtils struct{}

// SingleTarget creates a single agent target
func (A2AUtils) SingleTarget(agentID string) AgentTarget {
	return AgentTarget{
		SingleTarget: &SingleTarget{
			Type:    "single",
			AgentID: agentID,
		},
	}
}

// MultipleTargets creates a multiple agent target
func (A2AUtils) MultipleTargets(agentIDs []string, coordinationMode string) AgentTarget {
	if coordinationMode == "" {
		coordinationMode = "parallel"
	}
	return AgentTarget{
		MultipleTargets: &MultipleTargets{
			Type:             "multiple",
			AgentIDs:         agentIDs,
			CoordinationMode: coordinationMode,
		},
	}
}

// GroupTarget creates a group agent target
func (A2AUtils) GroupTarget(role AgentRole, capabilities []string, maxAgents *int, selectionStrategy string) AgentTarget {
	if selectionStrategy == "" {
		selectionStrategy = "load-balanced"
	}
	return AgentTarget{
		GroupTarget: &GroupTarget{
			Type:              "group",
			Role:              role,
			Capabilities:      capabilities,
			MaxAgents:         maxAgents,
			SelectionStrategy: selectionStrategy,
		},
	}
}

// BroadcastTarget creates a broadcast target
func (A2AUtils) BroadcastTarget(filter *AgentFilter) AgentTarget {
	return AgentTarget{
		BroadcastTarget: &BroadcastTarget{
			Type:   "broadcast",
			Filter: filter,
		},
	}
}

// DirectCoordination creates direct coordination
func (A2AUtils) DirectCoordination(timeout, retries *int, acknowledgment bool) CoordinationMode {
	return CoordinationMode{
		DirectCoordination: &DirectCoordination{
			Mode:           "direct",
			Timeout:        timeout,
			Retries:        retries,
			Acknowledgment: acknowledgment,
		},
	}
}

// BroadcastCoordination creates broadcast coordination
func (A2AUtils) BroadcastCoordination(aggregation string, timeout *int, partialSuccess bool) CoordinationMode {
	if aggregation == "" {
		aggregation = "all"
	}
	return CoordinationMode{
		BroadcastCoordination: &BroadcastCoordination{
			Mode:           "broadcast",
			Aggregation:    aggregation,
			Timeout:        timeout,
			PartialSuccess: partialSuccess,
		},
	}
}

// ConsensusCoordination creates consensus coordination
func (A2AUtils) ConsensusCoordination(consensusType string, votingTimeout, minimumParticipants *int) CoordinationMode {
	if consensusType == "" {
		consensusType = "majority"
	}
	return CoordinationMode{
		ConsensusCoordination: &ConsensusCoordination{
			Mode:                "consensus",
			ConsensusType:       consensusType,
			VotingTimeout:       votingTimeout,
			MinimumParticipants: minimumParticipants,
		},
	}
}

// PipelineCoordination creates pipeline coordination
func (A2AUtils) PipelineCoordination(stages []PipelineStage, failureStrategy string, statePassthrough bool) CoordinationMode {
	if failureStrategy == "" {
		failureStrategy = "abort"
	}
	return CoordinationMode{
		PipelineCoordination: &PipelineCoordination{
			Mode:             "pipeline",
			Stages:           stages,
			FailureStrategy:  failureStrategy,
			StatePassthrough: statePassthrough,
		},
	}
}

// ValidateMessage validates an A2A message
func (A2AUtils) ValidateMessage(message *A2AMessage) []string {
	var errors []string

	if message.Target.SingleTarget == nil && message.Target.MultipleTargets == nil &&
		message.Target.GroupTarget == nil && message.Target.BroadcastTarget == nil &&
		message.Target.ConditionalTarget == nil {
		errors = append(errors, "Message target is required")
	}

	if message.ToolName == "" {
		errors = append(errors, "Tool name is required")
	}

	if message.Coordination.DirectCoordination == nil && message.Coordination.BroadcastCoordination == nil &&
		message.Coordination.ConsensusCoordination == nil && message.Coordination.PipelineCoordination == nil {
		errors = append(errors, "Coordination mode is required")
	}

	// Validate target-specific requirements
	if message.Target.MultipleTargets != nil && len(message.Target.MultipleTargets.AgentIDs) == 0 {
		errors = append(errors, "Multiple target requires at least one agent ID")
	}

	if message.Target.GroupTarget != nil && message.Target.GroupTarget.Role == "" {
		errors = append(errors, "Group target requires a role")
	}

	// Validate coordination-specific requirements
	if message.Coordination.PipelineCoordination != nil && len(message.Coordination.PipelineCoordination.Stages) == 0 {
		errors = append(errors, "Pipeline coordination requires at least one stage")
	}

	return errors
}

// Utility functions

// intPtr returns a pointer to an int
func intPtr(i int) *int {
	return &i
}

// stringPtr returns a pointer to a string
func stringPtr(s string) *string {
	return &s
}

// Default utilities instance
var Utils A2AUtils