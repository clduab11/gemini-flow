-- Security Database Schema for Production Hardening
-- Supports comprehensive security framework with audit logging, compliance, and zero-trust architecture

-- =======================
-- AUDIT AND COMPLIANCE TABLES
-- =======================

-- Comprehensive audit logging with 7-year retention
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id TEXT,
  session_id TEXT,
  resource TEXT,
  action TEXT,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'blocked', 'warning')),
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON
  risk_score INTEGER DEFAULT 0,
  compliance_tags TEXT, -- JSON array
  retention_until DATETIME NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  signature TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_retention ON audit_logs(retention_until);

-- CSRF token management
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires ON csrf_tokens(expires_at);

-- Security incidents tracking
CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
  category TEXT NOT NULL CHECK (category IN ('malware', 'data_breach', 'unauthorized_access', 'ddos', 'insider_threat', 'other')),
  detected_at DATETIME NOT NULL,
  resolved_at DATETIME,
  reported_by TEXT NOT NULL,
  assigned_to TEXT,
  affected_systems TEXT, -- JSON array
  affected_users TEXT, -- JSON array
  timeline TEXT, -- JSON array of incident events
  evidence TEXT, -- JSON array of evidence
  mitigation_steps TEXT, -- JSON array
  root_cause TEXT,
  lessons_learned TEXT, -- JSON array
  cost DECIMAL(10,2),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON security_incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_detected ON security_incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON security_incidents(assigned_to);

-- Threat detection rules
CREATE TABLE IF NOT EXISTS threat_detection_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('authentication', 'authorization', 'data_access', 'network', 'behavioral')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  query_text TEXT NOT NULL,
  threshold_value INTEGER NOT NULL,
  time_window INTEGER NOT NULL, -- minutes
  enabled BOOLEAN DEFAULT TRUE,
  actions TEXT, -- JSON array
  false_positive_rate DECIMAL(5,4),
  last_triggered DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_threat_rules_category ON threat_detection_rules(category);
CREATE INDEX IF NOT EXISTS idx_threat_rules_enabled ON threat_detection_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_threat_rules_severity ON threat_detection_rules(severity);

-- Vulnerability assessments
CREATE TABLE IF NOT EXISTS vulnerability_assessments (
  id TEXT PRIMARY KEY,
  target_system TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('automated', 'manual', 'penetration_test')),
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  findings TEXT, -- JSON array of vulnerability findings
  risk_score INTEGER NOT NULL DEFAULT 0,
  remediation_plan TEXT, -- JSON array
  next_assessment_date DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vuln_assessments_target ON vulnerability_assessments(target_system);
CREATE INDEX IF NOT EXISTS idx_vuln_assessments_type ON vulnerability_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_vuln_assessments_started ON vulnerability_assessments(started_at);
CREATE INDEX IF NOT EXISTS idx_vuln_assessments_risk ON vulnerability_assessments(risk_score);

-- GDPR data subject requests
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
  subject_id TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  verification_data TEXT, -- JSON
  scope_data TEXT, -- JSON array
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  response_data TEXT, -- JSON
  estimated_completion DATETIME,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests(type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_subject ON gdpr_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_created ON gdpr_requests(created_at);

-- SOC2 compliance reports
CREATE TABLE IF NOT EXISTS compliance_reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('SOC2', 'GDPR', 'CCPA', 'HIPAA', 'ISO27001')),
  status TEXT NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'partial', 'unknown')),
  controls_passed INTEGER NOT NULL DEFAULT 0,
  controls_total INTEGER NOT NULL DEFAULT 0,
  findings TEXT, -- JSON array
  risk_assessment TEXT, -- JSON
  next_assessment DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created ON compliance_reports(created_at);

-- =======================
-- ZERO-TRUST ARCHITECTURE TABLES
-- =======================

-- Device trust registry
CREATE TABLE IF NOT EXISTS device_trust (
  device_id TEXT PRIMARY KEY,
  user_id TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'server')),
  operating_system TEXT NOT NULL,
  os_version TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  enrollment_date DATETIME NOT NULL,
  last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_level TEXT NOT NULL CHECK (trust_level IN ('untrusted', 'low', 'medium', 'high')),
  compliance_status TEXT, -- JSON
  risk_factors TEXT, -- JSON array
  certificates TEXT, -- JSON array
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_trust_user ON device_trust(user_id);
CREATE INDEX IF NOT EXISTS idx_device_trust_type ON device_trust(device_type);
CREATE INDEX IF NOT EXISTS idx_device_trust_level ON device_trust(trust_level);
CREATE INDEX IF NOT EXISTS idx_device_trust_score ON device_trust(trust_score);
CREATE INDEX IF NOT EXISTS idx_device_trust_last_seen ON device_trust(last_seen);

-- Network segments for micro-segmentation
CREATE TABLE IF NOT EXISTS network_segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  ip_ranges TEXT, -- JSON array
  allowed_ports TEXT, -- JSON array
  protocols TEXT, -- JSON array
  trust_level TEXT NOT NULL CHECK (trust_level IN ('untrusted', 'low', 'medium', 'high', 'critical')),
  access_rules TEXT, -- JSON array
  monitoring_config TEXT, -- JSON
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_network_segments_name ON network_segments(name);
CREATE INDEX IF NOT EXISTS idx_network_segments_trust_level ON network_segments(trust_level);

-- Zero-trust sessions
CREATE TABLE IF NOT EXISTS zero_trust_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  application_id TEXT,
  start_time DATETIME NOT NULL,
  last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiry_time DATETIME NOT NULL,
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  access_grants TEXT, -- JSON array
  verification_events TEXT, -- JSON array
  behavior_profile TEXT, -- JSON
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zt_sessions_user ON zero_trust_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_zt_sessions_device ON zero_trust_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_zt_sessions_status ON zero_trust_sessions(status);
CREATE INDEX IF NOT EXISTS idx_zt_sessions_risk_level ON zero_trust_sessions(risk_level);
CREATE INDEX IF NOT EXISTS idx_zt_sessions_expiry ON zero_trust_sessions(expiry_time);
CREATE INDEX IF NOT EXISTS idx_zt_sessions_last_activity ON zero_trust_sessions(last_activity);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'device', 'application', 'session')),
  subject_id TEXT NOT NULL,
  assessment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors TEXT, -- JSON array
  mitigation_actions TEXT, -- JSON array
  valid_until DATETIME NOT NULL,
  automatic_reassessment BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_subject ON risk_assessments(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_score ON risk_assessments(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_time ON risk_assessments(assessment_time);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_valid ON risk_assessments(valid_until);

-- Access policies for zero-trust
CREATE TABLE IF NOT EXISTS access_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('user', 'device', 'application', 'segment')),
  source_identifiers TEXT, -- JSON array
  destination_type TEXT NOT NULL CHECK (destination_type IN ('resource', 'service', 'segment')),
  destination_identifiers TEXT, -- JSON array
  permissions TEXT, -- JSON array
  conditions TEXT, -- JSON array
  time_restrictions TEXT, -- JSON
  risk_threshold INTEGER DEFAULT 50,
  enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_policies_source ON access_policies(source_type);
CREATE INDEX IF NOT EXISTS idx_access_policies_destination ON access_policies(destination_type);
CREATE INDEX IF NOT EXISTS idx_access_policies_enabled ON access_policies(enabled);

-- Behavior analytics profiles
CREATE TABLE IF NOT EXISTS behavior_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  baseline_data TEXT, -- JSON
  current_session_data TEXT, -- JSON
  historical_data TEXT, -- JSON
  last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_behavior_profiles_user_device ON behavior_profiles(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_updated ON behavior_profiles(last_updated);

-- =======================
-- SECURITY EVENTS AND MONITORING
-- =======================

-- Real-time security events
CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_type TEXT CHECK (source_type IN ('user', 'device', 'application', 'system', 'network')),
  source_id TEXT,
  target_type TEXT CHECK (target_type IN ('user', 'device', 'application', 'resource', 'network')),
  target_id TEXT,
  details TEXT, -- JSON
  correlation_id TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_source ON security_events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_security_events_target ON security_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_security_events_processed ON security_events(processed);
CREATE INDEX IF NOT EXISTS idx_security_events_correlation ON security_events(correlation_id);

-- Firewall rules and network access control
CREATE TABLE IF NOT EXISTS firewall_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('allow', 'deny', 'log')),
  protocol TEXT NOT NULL CHECK (protocol IN ('tcp', 'udp', 'icmp', 'all')),
  source_ip TEXT,
  destination_ip TEXT,
  source_port TEXT,
  destination_port TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN DEFAULT TRUE,
  temporary BOOLEAN DEFAULT FALSE,
  expires_at DATETIME,
  hit_count INTEGER DEFAULT 0,
  last_hit DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_firewall_rules_enabled ON firewall_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_firewall_rules_priority ON firewall_rules(priority);
CREATE INDEX IF NOT EXISTS idx_firewall_rules_action ON firewall_rules(action);
CREATE INDEX IF NOT EXISTS idx_firewall_rules_expires ON firewall_rules(expires_at);
CREATE INDEX IF NOT EXISTS idx_firewall_rules_temporary ON firewall_rules(temporary);

-- WAF (Web Application Firewall) rules
CREATE TABLE IF NOT EXISTS waf_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  condition_text TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('block', 'challenge', 'log', 'allow')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN DEFAULT TRUE,
  hit_count INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  last_triggered DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waf_rules_enabled ON waf_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_waf_rules_action ON waf_rules(action);
CREATE INDEX IF NOT EXISTS idx_waf_rules_severity ON waf_rules(severity);
CREATE INDEX IF NOT EXISTS idx_waf_rules_hit_count ON waf_rules(hit_count);

-- =======================
-- SECRETS AND CREDENTIALS MANAGEMENT
-- =======================

-- Encrypted secrets storage
CREATE TABLE IF NOT EXISTS secrets_vault (
  id TEXT PRIMARY KEY,
  secret_name TEXT NOT NULL UNIQUE,
  secret_type TEXT NOT NULL CHECK (secret_type IN ('api_key', 'password', 'certificate', 'token', 'connection_string')),
  encrypted_value BLOB NOT NULL,
  encryption_key_id TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  last_rotated DATETIME,
  rotation_interval INTEGER DEFAULT 90, -- days
  next_rotation DATETIME,
  access_count INTEGER DEFAULT 0,
  last_accessed DATETIME,
  expires_at DATETIME,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_secrets_name ON secrets_vault(secret_name);
CREATE INDEX IF NOT EXISTS idx_secrets_type ON secrets_vault(secret_type);
CREATE INDEX IF NOT EXISTS idx_secrets_status ON secrets_vault(status);
CREATE INDEX IF NOT EXISTS idx_secrets_rotation ON secrets_vault(next_rotation);
CREATE INDEX IF NOT EXISTS idx_secrets_expires ON secrets_vault(expires_at);

-- Secret access audit log
CREATE TABLE IF NOT EXISTS secret_access_log (
  id TEXT PRIMARY KEY,
  secret_id TEXT NOT NULL,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'create', 'update', 'delete', 'rotate')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  access_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (secret_id) REFERENCES secrets_vault(id)
);

CREATE INDEX IF NOT EXISTS idx_secret_access_secret ON secret_access_log(secret_id);
CREATE INDEX IF NOT EXISTS idx_secret_access_user ON secret_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_secret_access_time ON secret_access_log(access_time);
CREATE INDEX IF NOT EXISTS idx_secret_access_type ON secret_access_log(access_type);

-- =======================
-- RUNBOOK EXECUTION TRACKING
-- =======================

-- Security runbook definitions
CREATE TABLE IF NOT EXISTS security_runbooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  estimated_duration INTEGER NOT NULL, -- minutes
  steps_definition TEXT, -- JSON array
  tags TEXT, -- JSON array
  version TEXT NOT NULL DEFAULT '1.0.0',
  enabled BOOLEAN DEFAULT TRUE,
  last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_runbooks_category ON security_runbooks(category);
CREATE INDEX IF NOT EXISTS idx_runbooks_severity ON security_runbooks(severity);
CREATE INDEX IF NOT EXISTS idx_runbooks_enabled ON security_runbooks(enabled);

-- Runbook execution tracking
CREATE TABLE IF NOT EXISTS runbook_executions (
  id TEXT PRIMARY KEY,
  runbook_id TEXT NOT NULL,
  incident_id TEXT,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  executed_by TEXT NOT NULL,
  current_step_index INTEGER DEFAULT 0,
  step_results TEXT, -- JSON array
  variables TEXT, -- JSON
  FOREIGN KEY (runbook_id) REFERENCES security_runbooks(id)
);

CREATE INDEX IF NOT EXISTS idx_runbook_executions_runbook ON runbook_executions(runbook_id);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_incident ON runbook_executions(incident_id);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_status ON runbook_executions(status);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_started ON runbook_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_runbook_executions_executor ON runbook_executions(executed_by);

-- =======================
-- PERFORMANCE AND MONITORING METRICS
-- =======================

-- Security performance metrics
CREATE TABLE IF NOT EXISTS security_metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tags TEXT, -- JSON
  aggregation_period TEXT CHECK (aggregation_period IN ('1m', '5m', '15m', '1h', '1d')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_metrics_name ON security_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_security_metrics_timestamp ON security_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_metrics_period ON security_metrics(aggregation_period);

-- System health checks
CREATE TABLE IF NOT EXISTS health_checks (
  id TEXT PRIMARY KEY,
  component_name TEXT NOT NULL,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  response_time_ms INTEGER,
  error_message TEXT,
  details TEXT, -- JSON
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_checks_component ON health_checks(component_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON health_checks(checked_at);

-- =======================
-- DATA RETENTION AND CLEANUP
-- =======================

-- Create triggers for automatic cleanup of old data
CREATE TRIGGER IF NOT EXISTS cleanup_expired_csrf_tokens
  AFTER INSERT ON csrf_tokens
  BEGIN
    DELETE FROM csrf_tokens WHERE expires_at < datetime('now', '-1 hour');
  END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_security_events
  AFTER INSERT ON security_events
  WHEN (SELECT COUNT(*) FROM security_events) > 1000000
  BEGIN
    DELETE FROM security_events 
    WHERE id IN (
      SELECT id FROM security_events 
      ORDER BY timestamp ASC 
      LIMIT 100000
    );
  END;

CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
  AFTER INSERT ON zero_trust_sessions
  BEGIN
    UPDATE zero_trust_sessions 
    SET status = 'expired' 
    WHERE expiry_time < datetime('now') AND status = 'active';
  END;

CREATE TRIGGER IF NOT EXISTS update_device_trust_timestamp
  AFTER UPDATE ON device_trust
  BEGIN
    UPDATE device_trust SET updated_at = CURRENT_TIMESTAMP WHERE device_id = NEW.device_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_session_timestamp
  AFTER UPDATE ON zero_trust_sessions
  BEGIN
    UPDATE zero_trust_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- =======================
-- VIEWS FOR SECURITY DASHBOARDS
-- =======================

-- Security dashboard summary view
CREATE VIEW IF NOT EXISTS security_dashboard_summary AS
SELECT 
  'active_incidents' as metric,
  COUNT(*) as value,
  'count' as unit
FROM security_incidents 
WHERE status IN ('open', 'investigating')
UNION ALL
SELECT 
  'high_risk_sessions' as metric,
  COUNT(*) as value,
  'count' as unit
FROM zero_trust_sessions 
WHERE status = 'active' AND risk_level IN ('high', 'critical')
UNION ALL
SELECT 
  'untrusted_devices' as metric,
  COUNT(*) as value,
  'count' as unit
FROM device_trust 
WHERE trust_level = 'untrusted'
UNION ALL
SELECT 
  'recent_threats' as metric,
  COUNT(*) as value,
  'count' as unit
FROM security_events 
WHERE severity IN ('high', 'critical') 
AND timestamp > datetime('now', '-24 hours');

-- Recent security events view
CREATE VIEW IF NOT EXISTS recent_security_events AS
SELECT 
  id,
  event_type,
  timestamp,
  severity,
  source_type,
  source_id,
  target_type,
  target_id,
  json_extract(details, '$.description') as description
FROM security_events 
WHERE timestamp > datetime('now', '-7 days')
ORDER BY timestamp DESC
LIMIT 1000;

-- Risk assessment summary view
CREATE VIEW IF NOT EXISTS risk_assessment_summary AS
SELECT 
  subject_type,
  risk_level,
  COUNT(*) as count,
  AVG(risk_score) as avg_risk_score,
  MAX(assessment_time) as latest_assessment
FROM risk_assessments 
WHERE valid_until > datetime('now')
GROUP BY subject_type, risk_level
ORDER BY subject_type, risk_level;

-- Device trust summary view
CREATE VIEW IF NOT EXISTS device_trust_summary AS
SELECT 
  device_type,
  trust_level,
  COUNT(*) as count,
  AVG(trust_score) as avg_trust_score,
  MIN(last_seen) as oldest_last_seen,
  MAX(last_seen) as latest_last_seen
FROM device_trust 
GROUP BY device_type, trust_level
ORDER BY device_type, trust_level;

-- Compliance status view
CREATE VIEW IF NOT EXISTS compliance_status_summary AS
SELECT 
  type,
  status,
  controls_passed,
  controls_total,
  CASE 
    WHEN controls_total > 0 THEN ROUND((controls_passed * 100.0 / controls_total), 2)
    ELSE 0
  END as compliance_percentage,
  created_at as assessment_date
FROM compliance_reports 
WHERE id IN (
  SELECT id FROM compliance_reports cr1
  WHERE cr1.created_at = (
    SELECT MAX(cr2.created_at) 
    FROM compliance_reports cr2 
    WHERE cr2.type = cr1.type
  )
)
ORDER BY type;

-- =======================
-- INITIAL DATA AND CONFIGURATION
-- =======================

-- Insert default threat detection rules
INSERT OR IGNORE INTO threat_detection_rules (
  id, name, description, category, severity, query_text, threshold_value, time_window, actions
) VALUES 
(
  'failed_login_attempts',
  'Multiple Failed Login Attempts',
  'Detects multiple failed login attempts from same IP address',
  'authentication',
  'medium',
  'SELECT client_ip, COUNT(*) as attempts FROM audit_logs WHERE event_type = "authentication_failed" AND created_at > datetime("now", "-${time_window} minutes") GROUP BY client_ip',
  5,
  15,
  '["block_ip", "alert_security_team"]'
),
(
  'privilege_escalation',
  'Privilege Escalation Attempt',
  'Detects attempts to access higher privilege resources',
  'authorization',
  'high',
  'SELECT user_id, resource, COUNT(*) as attempts FROM audit_logs WHERE result = "blocked" AND event_type = "access_denied" AND created_at > datetime("now", "-${time_window} minutes") GROUP BY user_id, resource',
  3,
  10,
  '["disable_user", "alert_security_team", "start_investigation"]'
),
(
  'data_exfiltration',
  'Potential Data Exfiltration',
  'Detects unusual data access patterns indicating potential exfiltration',
  'data_access',
  'critical',
  'SELECT user_id, COUNT(*) as access_count, SUM(CAST(json_extract(details, "$.data_size") AS INTEGER)) as total_data FROM audit_logs WHERE event_type = "data_access" AND created_at > datetime("now", "-${time_window} minutes") GROUP BY user_id',
  100,
  60,
  '["suspend_user", "block_data_access", "alert_security_team", "start_forensics"]'
);

-- Insert default firewall rules (basic security)
INSERT OR IGNORE INTO firewall_rules (
  id, name, action, protocol, source_ip, destination_port, priority
) VALUES 
(
  'block_ssh_bruteforce',
  'Block SSH Brute Force',
  'deny',
  'tcp',
  'any',
  '22',
  100
),
(
  'allow_https',
  'Allow HTTPS Traffic',
  'allow',
  'tcp',
  'any',
  '443',
  200
),
(
  'allow_http',
  'Allow HTTP Traffic',
  'allow',
  'tcp',
  'any',
  '80',
  200
);

-- Insert default WAF rules
INSERT OR IGNORE INTO waf_rules (
  id, name, condition_text, action, severity
) VALUES 
(
  'sql_injection_basic',
  'Basic SQL Injection Protection',
  'contains(lower(request.body), "union select") or contains(lower(request.query), "1=1")',
  'block',
  'high'
),
(
  'xss_basic',
  'Basic XSS Protection',
  'contains(request.query, "<script") or contains(request.body, "javascript:")',
  'block',
  'medium'
),
(
  'path_traversal',
  'Path Traversal Protection',
  'contains(request.path, "../") or contains(request.path, "..\\")',
  'block',
  'high'
);

-- Create initial security metrics
INSERT OR IGNORE INTO security_metrics (
  id, metric_name, metric_value, metric_unit, aggregation_period
) VALUES 
(
  'init_blocked_requests',
  'blocked_requests_total',
  0,
  'count',
  '1h'
),
(
  'init_detected_threats',
  'detected_threats_total', 
  0,
  'count',
  '1h'
),
(
  'init_active_sessions',
  'active_sessions_count',
  0,
  'count',
  '5m'
);

-- =======================
-- SECURITY SCHEMA VERSION
-- =======================

CREATE TABLE IF NOT EXISTS security_schema_version (
  version TEXT PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT OR IGNORE INTO security_schema_version (version, description) 
VALUES ('1.0.0', 'Initial production security hardening schema with comprehensive audit logging, zero-trust architecture, and compliance frameworks');
