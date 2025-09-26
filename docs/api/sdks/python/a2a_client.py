"""
Gemini Flow A2A (Agent-to-Agent) Python SDK

Comprehensive Python client for interacting with Gemini Flow's
Agent-to-Agent communication system. Supports all 104 A2A-enabled MCP tools
with full type safety and advanced coordination patterns.

Version: 2.0.0-a2a
Author: Gemini Flow A2A Team
"""

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Union, Literal
import logging
import ssl
from contextlib import asynccontextmanager

import aiohttp
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException


# Core Configuration Types
@dataclass
class A2ACertificate:
    """SSL certificate configuration for A2A authentication"""
    cert_file: str
    key_file: str
    ca_file: Optional[str] = None
    passphrase: Optional[str] = None


@dataclass
class RetryPolicy:
    """Retry policy configuration"""
    max_retries: int = 3
    backoff_strategy: Literal['linear', 'exponential', 'custom'] = 'exponential'
    base_delay: float = 1.0
    max_delay: float = 30.0
    retryable_errors: List[str] = field(default_factory=lambda: ['NETWORK_TIMEOUT', 'CONNECTION_FAILED'])


@dataclass
class LoggingConfig:
    """Logging configuration"""
    level: Literal['DEBUG', 'INFO', 'WARN', 'ERROR'] = 'INFO'
    enable_request_logging: bool = False
    enable_response_logging: bool = False


@dataclass
class A2AClientConfig:
    """Main client configuration"""
    base_url: str
    api_key: Optional[str] = None
    certificate: Optional[A2ACertificate] = None
    timeout: float = 30.0
    retry_policy: RetryPolicy = field(default_factory=RetryPolicy)
    websocket_enabled: bool = True
    logging: LoggingConfig = field(default_factory=LoggingConfig)


# Agent and Targeting Types
class AgentRole(Enum):
    """Available agent roles"""
    COORDINATOR = "coordinator"
    RESEARCHER = "researcher"
    CODER = "coder"
    ANALYST = "analyst"
    OPTIMIZER = "optimizer"
    TESTER = "tester"
    REVIEWER = "reviewer"
    SPAWNER = "spawner"
    MEMORY_MANAGER = "memory-manager"
    TASK_ORCHESTRATOR = "task-orchestrator"
    NEURAL_TRAINER = "neural-trainer"
    SYSTEM_ARCHITECT = "system-architect"
    PERFORMANCE_MONITOR = "performance-monitor"
    SECURITY_MANAGER = "security-manager"
    DAA_COORDINATOR = "daa-coordinator"
    CONSENSUS_MANAGER = "consensus-manager"
    RESOURCE_ALLOCATOR = "resource-allocator"


@dataclass
class AgentFilter:
    """Filter criteria for agent selection"""
    role: Optional[AgentRole] = None
    capabilities: Optional[List[str]] = None
    status: Optional[Literal['active', 'idle', 'busy']] = None
    swarm_id: Optional[str] = None


@dataclass
class AgentCondition:
    """Conditional criteria for agent targeting"""
    type: Literal['capability', 'resource', 'status', 'location', 'custom']
    operator: Literal['equals', 'not_equals', 'contains', 'greater_than', 'less_than']
    value: Any


# Agent Targeting Classes
@dataclass
class SingleTarget:
    """Target a single specific agent"""
    type: Literal['single'] = 'single'
    agent_id: str = ''


@dataclass
class MultipleTargets:
    """Target multiple specific agents"""
    type: Literal['multiple'] = 'multiple'
    agent_ids: List[str] = field(default_factory=list)
    coordination_mode: Literal['parallel', 'sequential', 'race'] = 'parallel'


@dataclass
class GroupTarget:
    """Target agents by role/capabilities"""
    type: Literal['group'] = 'group'
    role: AgentRole = AgentRole.COORDINATOR
    capabilities: Optional[List[str]] = None
    max_agents: Optional[int] = None
    selection_strategy: Literal['random', 'load-balanced', 'capability-matched'] = 'load-balanced'


@dataclass
class BroadcastTarget:
    """Broadcast to multiple agents with filter"""
    type: Literal['broadcast'] = 'broadcast'
    filter: Optional[AgentFilter] = None
    exclude_source: bool = False


@dataclass
class ConditionalTarget:
    """Target agents based on conditions"""
    type: Literal['conditional'] = 'conditional'
    conditions: List[AgentCondition] = field(default_factory=list)
    fallback: Optional['AgentTarget'] = None


# Union type for all targeting options
AgentTarget = Union[SingleTarget, MultipleTargets, GroupTarget, BroadcastTarget, ConditionalTarget]


# Coordination Mode Types
@dataclass
class DirectCoordination:
    """Direct 1-to-1 coordination"""
    mode: Literal['direct'] = 'direct'
    timeout: Optional[float] = None
    retries: Optional[int] = None
    acknowledgment: bool = True


@dataclass
class BroadcastCoordination:
    """1-to-many broadcast coordination"""
    mode: Literal['broadcast'] = 'broadcast'
    aggregation: Literal['all', 'majority', 'first', 'any'] = 'all'
    timeout: Optional[float] = None
    partial_success: bool = False


@dataclass
class ConsensusCoordination:
    """Many-to-many consensus coordination"""
    mode: Literal['consensus'] = 'consensus'
    consensus_type: Literal['unanimous', 'majority', 'weighted'] = 'majority'
    voting_timeout: Optional[float] = None
    minimum_participants: Optional[int] = None


@dataclass
class PipelineStage:
    """Individual stage in a pipeline"""
    name: Optional[str] = None
    agent_target: Optional[AgentTarget] = None
    tool_name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    input_transform: Optional[str] = None
    output_transform: Optional[str] = None
    timeout: Optional[float] = None


@dataclass
class PipelineCoordination:
    """Sequential pipeline coordination"""
    mode: Literal['pipeline'] = 'pipeline'
    stages: List[PipelineStage] = field(default_factory=list)
    failure_strategy: Literal['abort', 'skip', 'retry'] = 'abort'
    state_passthrough: bool = True


# Union type for all coordination modes
CoordinationMode = Union[DirectCoordination, BroadcastCoordination, ConsensusCoordination, PipelineCoordination]


# Message Priority
class MessagePriority(Enum):
    """Message priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# MCP Tool Names - All 104 A2A-Enabled Tools
class MCPToolName(Enum):
    """All 104 A2A-enabled MCP tool names"""
    # Core Infrastructure (16 tools)
    CLAUDE_FLOW_SWARM_INIT = "mcp__gemini-flow__swarm_init"
    CLAUDE_FLOW_SWARM_STATUS = "mcp__gemini-flow__swarm_status"
    CLAUDE_FLOW_SWARM_MONITOR = "mcp__gemini-flow__swarm_monitor"
    CLAUDE_FLOW_SWARM_SCALE = "mcp__gemini-flow__swarm_scale"
    CLAUDE_FLOW_SWARM_DESTROY = "mcp__gemini-flow__swarm_destroy"
    RUV_SWARM_SWARM_INIT = "mcp__ruv-swarm__swarm_init"
    RUV_SWARM_SWARM_STATUS = "mcp__ruv-swarm__swarm_status"
    RUV_SWARM_SWARM_MONITOR = "mcp__ruv-swarm__swarm_monitor"
    CLAUDE_FLOW_AGENT_SPAWN = "mcp__gemini-flow__agent_spawn"
    CLAUDE_FLOW_AGENT_LIST = "mcp__gemini-flow__agent_list"
    CLAUDE_FLOW_AGENT_METRICS = "mcp__gemini-flow__agent_metrics"
    RUV_SWARM_AGENT_SPAWN = "mcp__ruv-swarm__agent_spawn"
    RUV_SWARM_AGENT_LIST = "mcp__ruv-swarm__agent_list"
    RUV_SWARM_AGENT_METRICS = "mcp__ruv-swarm__agent_metrics"
    CLAUDE_FLOW_TOPOLOGY_OPTIMIZE = "mcp__gemini-flow__topology_optimize"
    CLAUDE_FLOW_COORDINATION_SYNC = "mcp__gemini-flow__coordination_sync"
    
    # Task Orchestration (12 tools)
    CLAUDE_FLOW_TASK_ORCHESTRATE = "mcp__gemini-flow__task_orchestrate"
    CLAUDE_FLOW_TASK_STATUS = "mcp__gemini-flow__task_status"
    CLAUDE_FLOW_TASK_RESULTS = "mcp__gemini-flow__task_results"
    RUV_SWARM_TASK_ORCHESTRATE = "mcp__ruv-swarm__task_orchestrate"
    RUV_SWARM_TASK_STATUS = "mcp__ruv-swarm__task_status"
    RUV_SWARM_TASK_RESULTS = "mcp__ruv-swarm__task_results"
    CLAUDE_FLOW_PARALLEL_EXECUTE = "mcp__gemini-flow__parallel_execute"
    CLAUDE_FLOW_BATCH_PROCESS = "mcp__gemini-flow__batch_process"
    CLAUDE_FLOW_LOAD_BALANCE = "mcp__gemini-flow__load_balance"
    CLAUDE_FLOW_WORKFLOW_CREATE = "mcp__gemini-flow__workflow_create"
    CLAUDE_FLOW_WORKFLOW_EXECUTE = "mcp__gemini-flow__workflow_execute"
    CLAUDE_FLOW_WORKFLOW_EXPORT = "mcp__gemini-flow__workflow_export"
    
    # Memory & State Management (14 tools)
    CLAUDE_FLOW_MEMORY_USAGE = "mcp__gemini-flow__memory_usage"
    CLAUDE_FLOW_MEMORY_SEARCH = "mcp__gemini-flow__memory_search"
    CLAUDE_FLOW_MEMORY_PERSIST = "mcp__gemini-flow__memory_persist"
    CLAUDE_FLOW_MEMORY_NAMESPACE = "mcp__gemini-flow__memory_namespace"
    CLAUDE_FLOW_MEMORY_BACKUP = "mcp__gemini-flow__memory_backup"
    CLAUDE_FLOW_MEMORY_RESTORE = "mcp__gemini-flow__memory_restore"
    CLAUDE_FLOW_MEMORY_COMPRESS = "mcp__gemini-flow__memory_compress"
    CLAUDE_FLOW_MEMORY_SYNC = "mcp__gemini-flow__memory_sync"
    CLAUDE_FLOW_MEMORY_ANALYTICS = "mcp__gemini-flow__memory_analytics"
    RUV_SWARM_MEMORY_USAGE = "mcp__ruv-swarm__memory_usage"
    CLAUDE_FLOW_STATE_SNAPSHOT = "mcp__gemini-flow__state_snapshot"
    CLAUDE_FLOW_CONTEXT_RESTORE = "mcp__gemini-flow__context_restore"
    CLAUDE_FLOW_CACHE_MANAGE = "mcp__gemini-flow__cache_manage"
    CLAUDE_FLOW_CONFIG_MANAGE = "mcp__gemini-flow__config_manage"
    
    # Neural & AI Operations (17 tools)
    CLAUDE_FLOW_NEURAL_STATUS = "mcp__gemini-flow__neural_status"
    CLAUDE_FLOW_NEURAL_TRAIN = "mcp__gemini-flow__neural_train"
    CLAUDE_FLOW_NEURAL_PATTERNS = "mcp__gemini-flow__neural_patterns"
    CLAUDE_FLOW_NEURAL_PREDICT = "mcp__gemini-flow__neural_predict"
    CLAUDE_FLOW_NEURAL_COMPRESS = "mcp__gemini-flow__neural_compress"
    CLAUDE_FLOW_NEURAL_EXPLAIN = "mcp__gemini-flow__neural_explain"
    RUV_SWARM_NEURAL_STATUS = "mcp__ruv-swarm__neural_status"
    RUV_SWARM_NEURAL_TRAIN = "mcp__ruv-swarm__neural_train"
    RUV_SWARM_NEURAL_PATTERNS = "mcp__ruv-swarm__neural_patterns"
    CLAUDE_FLOW_MODEL_LOAD = "mcp__gemini-flow__model_load"
    CLAUDE_FLOW_MODEL_SAVE = "mcp__gemini-flow__model_save"
    CLAUDE_FLOW_INFERENCE_RUN = "mcp__gemini-flow__inference_run"
    CLAUDE_FLOW_PATTERN_RECOGNIZE = "mcp__gemini-flow__pattern_recognize"
    CLAUDE_FLOW_COGNITIVE_ANALYZE = "mcp__gemini-flow__cognitive_analyze"
    CLAUDE_FLOW_LEARNING_ADAPT = "mcp__gemini-flow__learning_adapt"
    CLAUDE_FLOW_ENSEMBLE_CREATE = "mcp__gemini-flow__ensemble_create"
    CLAUDE_FLOW_TRANSFER_LEARN = "mcp__gemini-flow__transfer_learn"
    
    # DAA Systems (18 tools)
    CLAUDE_FLOW_DAA_AGENT_CREATE = "mcp__gemini-flow__daa_agent_create"
    CLAUDE_FLOW_DAA_CAPABILITY_MATCH = "mcp__gemini-flow__daa_capability_match"
    CLAUDE_FLOW_DAA_RESOURCE_ALLOC = "mcp__gemini-flow__daa_resource_alloc"
    CLAUDE_FLOW_DAA_LIFECYCLE_MANAGE = "mcp__gemini-flow__daa_lifecycle_manage"
    CLAUDE_FLOW_DAA_COMMUNICATION = "mcp__gemini-flow__daa_communication"
    CLAUDE_FLOW_DAA_CONSENSUS = "mcp__gemini-flow__daa_consensus"
    CLAUDE_FLOW_DAA_FAULT_TOLERANCE = "mcp__gemini-flow__daa_fault_tolerance"
    CLAUDE_FLOW_DAA_OPTIMIZATION = "mcp__gemini-flow__daa_optimization"
    RUV_SWARM_DAA_INIT = "mcp__ruv-swarm__daa_init"
    RUV_SWARM_DAA_AGENT_CREATE = "mcp__ruv-swarm__daa_agent_create"
    RUV_SWARM_DAA_AGENT_ADAPT = "mcp__ruv-swarm__daa_agent_adapt"
    RUV_SWARM_DAA_WORKFLOW_CREATE = "mcp__ruv-swarm__daa_workflow_create"
    RUV_SWARM_DAA_WORKFLOW_EXECUTE = "mcp__ruv-swarm__daa_workflow_execute"
    RUV_SWARM_DAA_KNOWLEDGE_SHARE = "mcp__ruv-swarm__daa_knowledge_share"
    RUV_SWARM_DAA_LEARNING_STATUS = "mcp__ruv-swarm__daa_learning_status"
    RUV_SWARM_DAA_COGNITIVE_PATTERN = "mcp__ruv-swarm__daa_cognitive_pattern"
    RUV_SWARM_DAA_META_LEARNING = "mcp__ruv-swarm__daa_meta_learning"
    RUV_SWARM_DAA_PERFORMANCE_METRICS = "mcp__ruv-swarm__daa_performance_metrics"
    
    # Performance & Analytics (12 tools)
    CLAUDE_FLOW_PERFORMANCE_REPORT = "mcp__gemini-flow__performance_report"
    CLAUDE_FLOW_BOTTLENECK_ANALYZE = "mcp__gemini-flow__bottleneck_analyze"
    CLAUDE_FLOW_TOKEN_USAGE = "mcp__gemini-flow__token_usage"
    CLAUDE_FLOW_BENCHMARK_RUN = "mcp__gemini-flow__benchmark_run"
    CLAUDE_FLOW_METRICS_COLLECT = "mcp__gemini-flow__metrics_collect"
    CLAUDE_FLOW_TREND_ANALYSIS = "mcp__gemini-flow__trend_analysis"
    RUV_SWARM_BENCHMARK_RUN = "mcp__ruv-swarm__benchmark_run"
    CLAUDE_FLOW_COST_ANALYSIS = "mcp__gemini-flow__cost_analysis"
    CLAUDE_FLOW_QUALITY_ASSESS = "mcp__gemini-flow__quality_assess"
    CLAUDE_FLOW_ERROR_ANALYSIS = "mcp__gemini-flow__error_analysis"
    CLAUDE_FLOW_USAGE_STATS = "mcp__gemini-flow__usage_stats"
    CLAUDE_FLOW_HEALTH_CHECK = "mcp__gemini-flow__health_check"
    
    # GitHub Integration (8 tools)
    CLAUDE_FLOW_GITHUB_REPO_ANALYZE = "mcp__gemini-flow__github_repo_analyze"
    CLAUDE_FLOW_GITHUB_METRICS = "mcp__gemini-flow__github_metrics"
    CLAUDE_FLOW_GITHUB_PR_MANAGE = "mcp__gemini-flow__github_pr_manage"
    CLAUDE_FLOW_GITHUB_CODE_REVIEW = "mcp__gemini-flow__github_code_review"
    CLAUDE_FLOW_GITHUB_ISSUE_TRACK = "mcp__gemini-flow__github_issue_track"
    CLAUDE_FLOW_GITHUB_RELEASE_COORD = "mcp__gemini-flow__github_release_coord"
    CLAUDE_FLOW_GITHUB_WORKFLOW_AUTO = "mcp__gemini-flow__github_workflow_auto"
    CLAUDE_FLOW_GITHUB_SYNC_COORD = "mcp__gemini-flow__github_sync_coord"
    
    # Workflow & Automation (6 tools)
    CLAUDE_FLOW_AUTOMATION_SETUP = "mcp__gemini-flow__automation_setup"
    CLAUDE_FLOW_PIPELINE_CREATE = "mcp__gemini-flow__pipeline_create"
    CLAUDE_FLOW_SCHEDULER_MANAGE = "mcp__gemini-flow__scheduler_manage"
    CLAUDE_FLOW_TRIGGER_SETUP = "mcp__gemini-flow__trigger_setup"
    CLAUDE_FLOW_WORKFLOW_TEMPLATE = "mcp__gemini-flow__workflow_template"
    CLAUDE_FLOW_SPARC_MODE = "mcp__gemini-flow__sparc_mode"
    
    # System Infrastructure (11 tools)
    CLAUDE_FLOW_TERMINAL_EXECUTE = "mcp__gemini-flow__terminal_execute"
    CLAUDE_FLOW_FEATURES_DETECT = "mcp__gemini-flow__features_detect"
    CLAUDE_FLOW_SECURITY_SCAN = "mcp__gemini-flow__security_scan"
    CLAUDE_FLOW_BACKUP_CREATE = "mcp__gemini-flow__backup_create"
    CLAUDE_FLOW_RESTORE_SYSTEM = "mcp__gemini-flow__restore_system"
    CLAUDE_FLOW_LOG_ANALYSIS = "mcp__gemini-flow__log_analysis"
    CLAUDE_FLOW_DIAGNOSTIC_RUN = "mcp__gemini-flow__diagnostic_run"
    CLAUDE_FLOW_WASM_OPTIMIZE = "mcp__gemini-flow__wasm_optimize"
    RUV_SWARM_FEATURES_DETECT = "mcp__ruv-swarm__features_detect"


# State and Resource Requirements
@dataclass
class StateRequirement:
    """State access requirements"""
    type: Literal['read', 'write', 'exclusive', 'shared']
    namespace: str
    keys: List[str]
    consistency: Literal['eventual', 'strong', 'causal'] = 'eventual'
    timeout: Optional[float] = None


@dataclass
class ResourceRequirement:
    """Resource requirements"""
    type: Literal['cpu', 'memory', 'gpu', 'network', 'storage', 'custom']
    amount: float
    unit: str
    priority: MessagePriority = MessagePriority.MEDIUM
    duration: Optional[float] = None
    exclusive: bool = False


# Message and Response Types
@dataclass
class AgentIdentifier:
    """Agent identification"""
    agent_id: str
    agent_type: Optional[AgentRole] = None
    swarm_id: Optional[str] = None
    capabilities: Optional[List[str]] = None


@dataclass
class ExecutionContext:
    """Execution context for messages"""
    timeout: Optional[float] = None
    priority: Optional[MessagePriority] = None
    environment: Optional[Dict[str, Any]] = None
    resources: Optional[Any] = None


@dataclass
class A2AMessage:
    """A2A message structure"""
    target: AgentTarget
    tool_name: MCPToolName
    coordination: CoordinationMode
    id: Optional[str] = None
    correlation_id: Optional[str] = None
    conversation_id: Optional[str] = None
    source: Optional[AgentIdentifier] = None
    parameters: Optional[Dict[str, Any]] = None
    execution: Optional[ExecutionContext] = None
    state_requirements: Optional[List[StateRequirement]] = None
    resource_requirements: Optional[List[ResourceRequirement]] = None
    timestamp: Optional[float] = None
    ttl: Optional[float] = None
    priority: Optional[MessagePriority] = None
    retry_policy: Optional[RetryPolicy] = None


@dataclass
class ResponseMetadata:
    """Response metadata"""
    agent_version: Optional[str] = None
    processing_time: Optional[float] = None
    resources_used: Optional[Any] = None
    state_modifications: Optional[List[Any]] = None


@dataclass
class A2AError:
    """A2A error information"""
    code: str
    message: str
    details: Optional[Any] = None
    recoverable: bool = False
    suggested_action: Optional[str] = None


@dataclass
class A2AResponse:
    """A2A response structure"""
    message_id: str
    source: AgentIdentifier
    success: bool
    timestamp: float
    metadata: ResponseMetadata
    correlation_id: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[A2AError] = None
    performance: Optional[Dict[str, Any]] = None


# Custom Exceptions
class A2AClientError(Exception):
    """A2A Client error"""
    def __init__(self, message: str, details: Any = None, code: str = "A2A_CLIENT_ERROR"):
        super().__init__(message)
        self.code = code
        self.details = details


class A2ATimeoutError(A2AClientError):
    """A2A timeout error"""
    def __init__(self, message: str = "Operation timed out"):
        super().__init__(message, code="A2A_TIMEOUT_ERROR")


class A2AConnectionError(A2AClientError):
    """A2A connection error"""
    def __init__(self, message: str = "Connection failed"):
        super().__init__(message, code="A2A_CONNECTION_ERROR")


# Main A2A Client Class
class A2AClient:
    """
    Main A2A Client for Python
    
    Provides comprehensive access to all 104 A2A-enabled MCP tools
    with advanced coordination patterns and full async support.
    """
    
    def __init__(self, config: A2AClientConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(getattr(logging, config.logging.level))
        
        # Connection management
        self._http_session: Optional[aiohttp.ClientSession] = None
        self._websocket: Optional[Any] = None
        self._message_queue: Dict[str, asyncio.Future] = {}
        self._connection_pool: Dict[str, Any] = {}
        
        # SSL context setup
        self._ssl_context = None
        if config.certificate:
            self._ssl_context = ssl.create_default_context()
            self._ssl_context.load_cert_chain(
                config.certificate.cert_file,
                config.certificate.key_file,
                config.certificate.passphrase
            )
            if config.certificate.ca_file:
                self._ssl_context.load_verify_locations(config.certificate.ca_file)
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()
    
    async def connect(self) -> None:
        """Establish connections"""
        # Setup HTTP session
        connector = aiohttp.TCPConnector(ssl=self._ssl_context)
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'GeminiFlow-A2A-Python-SDK/2.0.0'
        }
        
        if self.config.api_key:
            headers['X-API-Key'] = self.config.api_key
        
        self._http_session = aiohttp.ClientSession(
            base_url=self.config.base_url,
            connector=connector,
            timeout=timeout,
            headers=headers
        )
        
        # Setup WebSocket if enabled
        if self.config.websocket_enabled:
            await self._setup_websocket()
    
    async def _setup_websocket(self) -> None:
        """Setup WebSocket connection"""
        try:
            ws_url = self.config.base_url.replace('http', 'ws') + '/ws'
            
            extra_headers = {}
            if self.config.api_key:
                extra_headers['X-API-Key'] = self.config.api_key
            
            self._websocket = await websockets.connect(
                ws_url,
                ssl=self._ssl_context,
                extra_headers=extra_headers
            )
            
            # Start message handler
            asyncio.create_task(self._websocket_message_handler())
            
        except Exception as e:
            self.logger.warning(f"WebSocket connection failed: {e}")
            self._websocket = None
    
    async def _websocket_message_handler(self) -> None:
        """Handle incoming WebSocket messages"""
        if not self._websocket:
            return
        
        try:
            async for message in self._websocket:
                try:
                    data = json.loads(message)
                    
                    if data.get('type') == 'response' and data.get('correlation_id'):
                        correlation_id = data['correlation_id']
                        if correlation_id in self._message_queue:
                            future = self._message_queue.pop(correlation_id)
                            if not future.done():
                                future.set_result(data)
                    
                except json.JSONDecodeError:
                    self.logger.error(f"Failed to parse WebSocket message: {message}")
                except Exception as e:
                    self.logger.error(f"Error handling WebSocket message: {e}")
        
        except ConnectionClosed:
            self.logger.info("WebSocket connection closed")
        except WebSocketException as e:
            self.logger.error(f"WebSocket error: {e}")
    
    async def disconnect(self) -> None:
        """Close all connections"""
        if self._http_session:
            await self._http_session.close()
        
        if self._websocket:
            await self._websocket.close()
        
        # Cancel any pending futures
        for future in self._message_queue.values():
            if not future.done():
                future.cancel()
        self._message_queue.clear()
    
    async def send_message(self, message: A2AMessage) -> A2AResponse:
        """Send A2A message with retry policy"""
        # Generate message ID if not provided
        if not message.id:
            message.id = self._generate_message_id()
        
        # Add timestamp
        message.timestamp = time.time()
        
        # Apply retry policy
        return await self._execute_with_retry(lambda: self._do_send_message(message))
    
    async def _do_send_message(self, message: A2AMessage) -> A2AResponse:
        """Internal message sending"""
        try:
            if self._websocket and not self._websocket.closed:
                return await self._send_via_websocket(message)
            else:
                return await self._send_via_http(message)
        except Exception as e:
            raise A2AClientError(f"Message send failed: {str(e)}", details=e)
    
    async def _send_via_websocket(self, message: A2AMessage) -> A2AResponse:
        """Send message via WebSocket"""
        if not self._websocket:
            raise A2AConnectionError("WebSocket not connected")
        
        timeout = message.execution.timeout if message.execution else self.config.timeout
        
        # Create future for response
        future = asyncio.Future()
        self._message_queue[message.id] = future
        
        try:
            # Send message
            await self._websocket.send(json.dumps({
                'type': 'message',
                **self._serialize_message(message)
            }))
            
            # Wait for response
            response_data = await asyncio.wait_for(future, timeout=timeout)
            return self._deserialize_response(response_data)
        
        except asyncio.TimeoutError:
            self._message_queue.pop(message.id, None)
            raise A2ATimeoutError(f"WebSocket message timeout after {timeout}s")
        except Exception as e:
            self._message_queue.pop(message.id, None)
            raise A2AClientError(f"WebSocket send failed: {str(e)}")
    
    async def _send_via_http(self, message: A2AMessage) -> A2AResponse:
        """Send message via HTTP"""
        if not self._http_session:
            raise A2AConnectionError("HTTP session not initialized")
        
        try:
            async with self._http_session.post(
                '/api/v2/a2a/message',
                json=self._serialize_message(message)
            ) as response:
                response.raise_for_status()
                data = await response.json()
                return self._deserialize_response(data)
        
        except aiohttp.ClientError as e:
            raise A2AClientError(f"HTTP request failed: {str(e)}")
    
    async def _execute_with_retry(self, operation: Callable) -> A2AResponse:
        """Execute operation with retry policy"""
        policy = self.config.retry_policy
        last_error = None
        
        for attempt in range(policy.max_retries + 1):
            try:
                return await operation()
            except Exception as error:
                last_error = error
                
                # Check if error is retryable
                error_code = getattr(error, 'code', str(type(error).__name__))
                if error_code not in policy.retryable_errors or attempt == policy.max_retries:
                    raise error
                
                # Calculate delay
                if policy.backoff_strategy == 'exponential':
                    delay = min(policy.base_delay * (2 ** attempt), policy.max_delay)
                else:  # linear
                    delay = min(policy.base_delay * (attempt + 1), policy.max_delay)
                
                await asyncio.sleep(delay)
        
        raise last_error
    
    def _serialize_message(self, message: A2AMessage) -> Dict[str, Any]:
        """Serialize A2A message to dict"""
        def serialize_obj(obj):
            if hasattr(obj, '__dict__'):
                result = {}
                for key, value in obj.__dict__.items():
                    if value is not None:
                        if isinstance(value, Enum):
                            result[key] = value.value
                        elif isinstance(value, list):
                            result[key] = [serialize_obj(item) for item in value]
                        elif hasattr(value, '__dict__'):
                            result[key] = serialize_obj(value)
                        else:
                            result[key] = value
                return result
            elif isinstance(obj, Enum):
                return obj.value
            else:
                return obj
        
        return serialize_obj(message)
    
    def _deserialize_response(self, data: Dict[str, Any]) -> A2AResponse:
        """Deserialize response data to A2AResponse"""
        # Basic deserialization - in production this would be more robust
        return A2AResponse(
            message_id=data.get('message_id', ''),
            correlation_id=data.get('correlation_id'),
            source=AgentIdentifier(
                agent_id=data.get('source', {}).get('agent_id', ''),
                agent_type=AgentRole(data.get('source', {}).get('agent_type')) if data.get('source', {}).get('agent_type') else None,
                swarm_id=data.get('source', {}).get('swarm_id'),
                capabilities=data.get('source', {}).get('capabilities')
            ),
            success=data.get('success', False),
            result=data.get('result'),
            error=A2AError(
                code=data.get('error', {}).get('code', ''),
                message=data.get('error', {}).get('message', ''),
                details=data.get('error', {}).get('details'),
                recoverable=data.get('error', {}).get('recoverable', False),
                suggested_action=data.get('error', {}).get('suggested_action')
            ) if data.get('error') else None,
            timestamp=data.get('timestamp', time.time()),
            metadata=ResponseMetadata(
                agent_version=data.get('metadata', {}).get('agent_version'),
                processing_time=data.get('metadata', {}).get('processing_time'),
                resources_used=data.get('metadata', {}).get('resources_used'),
                state_modifications=data.get('metadata', {}).get('state_modifications')
            ),
            performance=data.get('performance')
        )
    
    def _generate_message_id(self) -> str:
        """Generate unique message ID"""
        return f"msg_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
    
    # High-level helper methods
    
    async def initialize_swarm(
        self,
        provider: Literal['claude-flow', 'ruv-swarm'] = 'claude-flow',
        topology: Literal['hierarchical', 'mesh', 'ring', 'star'] = 'hierarchical',
        max_agents: int = 5,
        strategy: Literal['parallel', 'sequential', 'adaptive', 'balanced'] = 'adaptive',
        coordination_mode: Literal['broadcast', 'consensus'] = 'broadcast'
    ) -> A2AResponse:
        """Initialize a new swarm"""
        tool_name = (MCPToolName.CLAUDE_FLOW_SWARM_INIT if provider == 'claude-flow' 
                    else MCPToolName.RUV_SWARM_SWARM_INIT)
        
        coordination = (BroadcastCoordination(aggregation='all', timeout=30.0) 
                       if coordination_mode == 'broadcast' 
                       else ConsensusCoordination(consensus_type='majority'))
        
        return await self.send_message(A2AMessage(
            target=GroupTarget(role=AgentRole.COORDINATOR),
            tool_name=tool_name,
            parameters={
                'topology': topology,
                'maxAgents': max_agents,
                'strategy': strategy
            },
            coordination=coordination
        ))
    
    async def spawn_agent(
        self,
        agent_type: AgentRole,
        capabilities: List[str],
        name: Optional[str] = None,
        placement_strategy: Literal['load-balanced', 'capability-matched', 'geographic'] = 'load-balanced'
    ) -> A2AResponse:
        """Spawn a new agent"""
        return await self.send_message(A2AMessage(
            target=GroupTarget(
                role=AgentRole.SPAWNER,
                max_agents=1,
                selection_strategy='load-balanced'
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_AGENT_SPAWN,
            parameters={
                'type': agent_type.value,
                'name': name,
                'capabilities': capabilities,
                'placement': {
                    'strategy': placement_strategy
                }
            },
            coordination=ConsensusCoordination(
                consensus_type='majority',
                minimum_participants=2
            )
        ))
    
    async def orchestrate_task(
        self,
        task: str,
        strategy: Literal['parallel', 'sequential', 'adaptive', 'pipeline'] = 'adaptive',
        max_agents: int = 3,
        priority: MessagePriority = MessagePriority.MEDIUM,
        stages: Optional[List[PipelineStage]] = None
    ) -> A2AResponse:
        """Orchestrate a complex task"""
        if strategy == 'pipeline' and stages:
            coordination = PipelineCoordination(
                stages=stages,
                failure_strategy='abort',
                state_passthrough=True
            )
        else:
            coordination = BroadcastCoordination(
                aggregation='majority',
                timeout=120.0
            )
        
        return await self.send_message(A2AMessage(
            target=GroupTarget(
                role=AgentRole.TASK_ORCHESTRATOR,
                max_agents=max_agents
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_TASK_ORCHESTRATE,
            parameters={
                'task': task,
                'strategy': strategy,
                'maxAgents': max_agents
            },
            coordination=coordination,
            priority=priority
        ))
    
    async def store_memory(
        self,
        key: str,
        value: Any,
        namespace: str = 'default',
        ttl: Optional[float] = None,
        consistency: Literal['eventual', 'strong', 'causal'] = 'strong',
        replication_factor: int = 3
    ) -> A2AResponse:
        """Store data in distributed memory"""
        return await self.send_message(A2AMessage(
            target=GroupTarget(
                role=AgentRole.MEMORY_MANAGER,
                max_agents=replication_factor
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_MEMORY_USAGE,
            parameters={
                'action': 'store',
                'key': key,
                'value': value,
                'namespace': namespace,
                'ttl': ttl
            },
            coordination=ConsensusCoordination(
                consensus_type='majority',
                voting_timeout=10.0
            ),
            state_requirements=[StateRequirement(
                type='write',
                namespace=namespace,
                keys=[key],
                consistency=consistency
            )]
        ))
    
    async def retrieve_memory(
        self,
        key: str,
        namespace: str = 'default',
        consistency: Literal['eventual', 'strong', 'causal'] = 'eventual'
    ) -> A2AResponse:
        """Retrieve data from distributed memory"""
        max_agents = 3 if consistency == 'strong' else 1
        coordination = (ConsensusCoordination(consensus_type='majority') 
                       if consistency == 'strong' 
                       else DirectCoordination())
        
        return await self.send_message(A2AMessage(
            target=GroupTarget(
                role=AgentRole.MEMORY_MANAGER,
                max_agents=max_agents
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_MEMORY_USAGE,
            parameters={
                'action': 'retrieve',
                'key': key,
                'namespace': namespace
            },
            coordination=coordination,
            state_requirements=[StateRequirement(
                type='read',
                namespace=namespace,
                keys=[key],
                consistency=consistency
            )]
        ))
    
    async def train_neural_model(
        self,
        model_type: str,
        training_data: str,
        participants: List[Dict[str, Any]],
        hyperparameters: Dict[str, Any],
        coordination_mode: Literal['parameter-server', 'all-reduce', 'federated'] = 'parameter-server'
    ) -> A2AResponse:
        """Train neural model with distributed agents"""
        agent_ids = [p['agent_id'] for p in participants]
        
        stages = [
            PipelineStage(
                name='initialization',
                agent_target=SingleTarget(agent_id=next(
                    p['agent_id'] for p in participants if p.get('role') == 'coordinator'
                )),
                tool_name=MCPToolName.CLAUDE_FLOW_NEURAL_TRAIN.value
            ),
            PipelineStage(
                name='distributed-training',
                agent_target=MultipleTargets(
                    agent_ids=[p['agent_id'] for p in participants if p.get('role') == 'worker'],
                    coordination_mode='parallel'
                ),
                tool_name=MCPToolName.CLAUDE_FLOW_NEURAL_TRAIN.value
            )
        ]
        
        return await self.send_message(A2AMessage(
            target=MultipleTargets(
                agent_ids=agent_ids,
                coordination_mode='parallel'
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_NEURAL_TRAIN,
            parameters={
                'modelType': model_type,
                'trainingData': training_data,
                'participants': participants,
                'hyperparameters': hyperparameters,
                'coordination': {'mode': coordination_mode}
            },
            coordination=PipelineCoordination(
                stages=stages,
                failure_strategy='retry'
            ),
            resource_requirements=[ResourceRequirement(
                type='gpu',
                amount=len([p for p in participants if p.get('role') == 'worker']),
                unit='device',
                priority=MessagePriority.HIGH
            )]
        ))
    
    async def initiate_consensus(
        self,
        proposal_type: Literal['resource-allocation', 'policy-change', 'agent-promotion', 'emergency-action'],
        proposal_details: Dict[str, Any],
        participants: List[Dict[str, Any]],
        algorithm: Literal['raft', 'pbft', 'tendermint', 'custom'] = 'raft',
        timeout: float = 30.0,
        threshold: Optional[float] = None
    ) -> A2AResponse:
        """Initiate consensus among agents"""
        agent_ids = [p['agent_id'] for p in participants]
        
        return await self.send_message(A2AMessage(
            target=MultipleTargets(
                agent_ids=agent_ids,
                coordination_mode='parallel'
            ),
            tool_name=MCPToolName.RUV_SWARM_DAA_CONSENSUS,
            parameters={
                'proposal': {
                    'type': proposal_type,
                    'details': proposal_details
                },
                'participants': participants,
                'algorithm': algorithm,
                'timeout': timeout,
                'threshold': threshold
            },
            coordination=ConsensusCoordination(
                consensus_type='majority',
                voting_timeout=timeout,
                minimum_participants=len(participants) // 2 + 1
            )
        ))
    
    async def analyze_repository(
        self,
        repo: str,
        analysis_type: Literal['code_quality', 'performance', 'security'] = 'code_quality',
        max_analyzers: int = 3
    ) -> A2AResponse:
        """Analyze GitHub repository"""
        return await self.send_message(A2AMessage(
            target=GroupTarget(
                role=AgentRole.ANALYST,
                capabilities=['github', analysis_type],
                max_agents=max_analyzers
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_GITHUB_REPO_ANALYZE,
            parameters={
                'repo': repo,
                'analysis_type': analysis_type
            },
            coordination=BroadcastCoordination(
                aggregation='all',
                timeout=180.0
            )
        ))
    
    async def generate_performance_report(
        self,
        format: Literal['summary', 'detailed', 'json'] = 'summary',
        timeframe: Literal['24h', '7d', '30d'] = '24h',
        components: Optional[List[str]] = None
    ) -> A2AResponse:
        """Generate performance report"""
        return await self.send_message(A2AMessage(
            target=GroupTarget(
                role=AgentRole.PERFORMANCE_MONITOR,
                max_agents=1
            ),
            tool_name=MCPToolName.CLAUDE_FLOW_PERFORMANCE_REPORT,
            parameters={
                'format': format,
                'timeframe': timeframe,
                'components': components
            },
            coordination=DirectCoordination()
        ))
    
    # Utility methods
    
    async def get_swarm_status(self, swarm_id: Optional[str] = None) -> A2AResponse:
        """Get swarm status"""
        return await self.send_message(A2AMessage(
            target=GroupTarget(role=AgentRole.COORDINATOR),
            tool_name=MCPToolName.CLAUDE_FLOW_SWARM_STATUS,
            parameters={'swarmId': swarm_id} if swarm_id else {},
            coordination=BroadcastCoordination(aggregation='majority')
        ))
    
    async def list_agents(self, filter: Optional[AgentFilter] = None) -> A2AResponse:
        """List all agents"""
        return await self.send_message(A2AMessage(
            target=BroadcastTarget(filter=filter),
            tool_name=MCPToolName.CLAUDE_FLOW_AGENT_LIST,
            parameters={'filter': filter.__dict__ if filter else None},
            coordination=BroadcastCoordination(aggregation='all')
        ))
    
    def is_connected(self) -> bool:
        """Check if client is connected"""
        return (self._http_session is not None and not self._http_session.closed and
                (not self.config.websocket_enabled or 
                 (self._websocket is not None and not self._websocket.closed)))


# Utility Functions
class A2AUtils:
    """Utility functions for A2A operations"""
    
    @staticmethod
    def single_target(agent_id: str) -> SingleTarget:
        """Create single agent target"""
        return SingleTarget(agent_id=agent_id)
    
    @staticmethod
    def multiple_targets(
        agent_ids: List[str], 
        coordination_mode: Literal['parallel', 'sequential', 'race'] = 'parallel'
    ) -> MultipleTargets:
        """Create multiple agent target"""
        return MultipleTargets(agent_ids=agent_ids, coordination_mode=coordination_mode)
    
    @staticmethod
    def group_target(
        role: AgentRole,
        capabilities: Optional[List[str]] = None,
        max_agents: Optional[int] = None,
        selection_strategy: Literal['random', 'load-balanced', 'capability-matched'] = 'load-balanced'
    ) -> GroupTarget:
        """Create group agent target"""
        return GroupTarget(
            role=role,
            capabilities=capabilities,
            max_agents=max_agents,
            selection_strategy=selection_strategy
        )
    
    @staticmethod
    def broadcast_target(filter: Optional[AgentFilter] = None) -> BroadcastTarget:
        """Create broadcast target"""
        return BroadcastTarget(filter=filter)
    
    @staticmethod
    def direct_coordination(
        timeout: Optional[float] = None,
        retries: Optional[int] = None,
        acknowledgment: bool = True
    ) -> DirectCoordination:
        """Create direct coordination"""
        return DirectCoordination(
            timeout=timeout,
            retries=retries,
            acknowledgment=acknowledgment
        )
    
    @staticmethod
    def broadcast_coordination(
        aggregation: Literal['all', 'majority', 'first', 'any'] = 'all',
        timeout: Optional[float] = None,
        partial_success: bool = False
    ) -> BroadcastCoordination:
        """Create broadcast coordination"""
        return BroadcastCoordination(
            aggregation=aggregation,
            timeout=timeout,
            partial_success=partial_success
        )
    
    @staticmethod
    def consensus_coordination(
        consensus_type: Literal['unanimous', 'majority', 'weighted'] = 'majority',
        voting_timeout: Optional[float] = None,
        minimum_participants: Optional[int] = None
    ) -> ConsensusCoordination:
        """Create consensus coordination"""
        return ConsensusCoordination(
            consensus_type=consensus_type,
            voting_timeout=voting_timeout,
            minimum_participants=minimum_participants
        )
    
    @staticmethod
    def pipeline_coordination(
        stages: List[PipelineStage],
        failure_strategy: Literal['abort', 'skip', 'retry'] = 'abort',
        state_passthrough: bool = True
    ) -> PipelineCoordination:
        """Create pipeline coordination"""
        return PipelineCoordination(
            stages=stages,
            failure_strategy=failure_strategy,
            state_passthrough=state_passthrough
        )
    
    @staticmethod
    def validate_message(message: A2AMessage) -> List[str]:
        """Validate A2A message"""
        errors = []
        
        if not message.target:
            errors.append("Message target is required")
        
        if not message.tool_name:
            errors.append("Tool name is required")
        
        if not message.coordination:
            errors.append("Coordination mode is required")
        
        # Validate target-specific requirements
        if (isinstance(message.target, MultipleTargets) and 
            (not message.target.agent_ids or len(message.target.agent_ids) == 0)):
            errors.append("Multiple target requires at least one agent ID")
        
        if isinstance(message.target, GroupTarget) and not message.target.role:
            errors.append("Group target requires a role")
        
        # Validate coordination-specific requirements
        if (isinstance(message.coordination, PipelineCoordination) and
            (not message.coordination.stages or len(message.coordination.stages) == 0)):
            errors.append("Pipeline coordination requires at least one stage")
        
        return errors


# Example usage context manager
@asynccontextmanager
async def create_a2a_client(config: A2AClientConfig):
    """Context manager for A2A client"""
    client = A2AClient(config)
    try:
        await client.connect()
        yield client
    finally:
        await client.disconnect()


# Export all public classes and functions
__all__ = [
    # Main client class
    'A2AClient',
    
    # Configuration classes
    'A2AClientConfig', 'A2ACertificate', 'RetryPolicy', 'LoggingConfig',
    
    # Agent and targeting
    'AgentRole', 'AgentFilter', 'AgentCondition', 'AgentIdentifier',
    'SingleTarget', 'MultipleTargets', 'GroupTarget', 'BroadcastTarget', 'ConditionalTarget',
    
    # Coordination modes
    'DirectCoordination', 'BroadcastCoordination', 'ConsensusCoordination', 'PipelineCoordination', 'PipelineStage',
    
    # Message types
    'A2AMessage', 'A2AResponse', 'A2AError', 'ResponseMetadata',
    'ExecutionContext', 'StateRequirement', 'ResourceRequirement',
    
    # Enums
    'MessagePriority', 'MCPToolName',
    
    # Exceptions
    'A2AClientError', 'A2ATimeoutError', 'A2AConnectionError',
    
    # Utilities
    'A2AUtils', 'create_a2a_client'
]