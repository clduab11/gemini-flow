CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    capabilities TEXT, -- JSON array
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    metadata TEXT -- JSON object
);

CREATE TABLE swarms (
    id TEXT PRIMARY KEY,
    topology TEXT NOT NULL, -- hierarchical, mesh, ring, star
    max_agents INTEGER DEFAULT 8,
    strategy TEXT DEFAULT 'parallel',
    status TEXT DEFAULT 'initializing',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    config TEXT, -- JSON configuration
    performance_metrics TEXT -- JSON metrics
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    swarm_id TEXT,
    agent_id TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    dependencies TEXT, -- JSON array
    started_at INTEGER,
    completed_at INTEGER,
    result TEXT, -- JSON result
    error_message TEXT,
    FOREIGN KEY (swarm_id) REFERENCES swarms(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE memory_store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    namespace TEXT DEFAULT 'default',
    agent_id TEXT,
    swarm_id TEXT,
    ttl INTEGER, -- expiration timestamp
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    access_count INTEGER DEFAULT 0,
    UNIQUE(key, namespace)
);

CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'agent', 'swarm', 'task'
    entity_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    metadata TEXT -- JSON additional data
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    swarm_id TEXT,
    type TEXT NOT NULL, -- 'hive-mind', 'workflow', 'batch'
    status TEXT DEFAULT 'active',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    ended_at INTEGER,
    context TEXT, -- JSON session context
    performance_data TEXT -- JSON performance metrics
);

CREATE TABLE consensus_decisions (
    id TEXT PRIMARY KEY,
    swarm_id TEXT NOT NULL,
    proposal TEXT NOT NULL,
    decision TEXT NOT NULL,
    confidence REAL,
    participants INTEGER,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    voting_data TEXT, -- JSON voting details
    FOREIGN KEY (swarm_id) REFERENCES swarms(id)
);

CREATE TABLE neural_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type TEXT NOT NULL,
    pattern_data TEXT NOT NULL, -- JSON neural weights
    accuracy REAL,
    training_iterations INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    definition TEXT NOT NULL, -- JSON workflow definition
    version INTEGER DEFAULT 1,
    created_by TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    execution_count INTEGER DEFAULT 0
);

CREATE TABLE hooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    handler TEXT NOT NULL, -- Function or command
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT 1,
    metadata TEXT -- JSON configuration
);

CREATE TABLE configuration (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT,
    description TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    details TEXT -- JSON audit details
);

CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_memory_key ON memory_store(key, namespace);
CREATE INDEX idx_metrics_entity ON metrics(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);