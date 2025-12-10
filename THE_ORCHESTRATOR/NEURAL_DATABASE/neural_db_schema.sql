-- Neural Memory Database Schema
-- Supports cross-context memory, vector similarity, and temporal tracking

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Memory Patterns Table (The crystallized knowledge)
CREATE TABLE memory_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_key VARCHAR(255) UNIQUE NOT NULL,
    pattern_type VARCHAR(100) NOT NULL, -- 'code', 'architecture', 'fix', 'optimization'
    content JSONB NOT NULL, -- Flexible pattern data
    embedding VECTOR(1536), -- OpenAI/Claude embedding for similarity search

    -- Metadata
    context VARCHAR(255), -- Project/directory context
    quality_score FLOAT DEFAULT 0.0, -- How valuable is this pattern
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexing
    INDEX idx_pattern_type (pattern_type),
    INDEX idx_context (context),
    INDEX idx_quality_score (quality_score DESC),
    INDEX idx_embedding (embedding) -- For vector similarity
);

-- =====================================================

-- Sessions Table (Track all LLM sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,

    -- Session context
    context VARCHAR(255) NOT NULL, -- Project/repo name
    working_directory TEXT,
    environment JSONB, -- ENV vars, system info

    -- Session type
    interface VARCHAR(50), -- 'cli', 'browser', 'api', 'vscode'
    llm_model VARCHAR(100), -- 'claude-3-opus', 'gpt-4', etc

    -- Metrics
    interaction_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10,4) DEFAULT 0.0,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    last_interaction TIMESTAMP,

    -- Session state
    state VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'

    INDEX idx_session_context (context),
    INDEX idx_session_state (state),
    INDEX idx_started_at (started_at DESC)
);

-- =====================================================

-- Interactions Table (Every prompt/response)
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

    -- Interaction data
    sequence_num INTEGER NOT NULL, -- Order within session
    prompt TEXT NOT NULL,
    prompt_embedding VECTOR(1536), -- For finding similar prompts
    response TEXT,
    response_embedding VECTOR(1536),

    -- Extracted patterns
    patterns JSONB, -- Array of pattern_ids that were relevant
    new_patterns JSONB, -- Patterns discovered in this interaction

    -- Metrics
    prompt_tokens INTEGER,
    response_tokens INTEGER,
    latency_ms INTEGER,
    cost_usd DECIMAL(10,6),

    -- Quality/Success tracking
    was_successful BOOLEAN DEFAULT true,
    error_message TEXT,
    user_feedback VARCHAR(50), -- 'helpful', 'not_helpful', null

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_interaction_session (session_id, sequence_num),
    INDEX idx_prompt_embedding (prompt_embedding),
    INDEX idx_created_at (created_at DESC)
);

-- =====================================================

-- Cross-Context Bridges (Share patterns between contexts)
CREATE TABLE context_bridges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_context VARCHAR(255) NOT NULL,
    target_context VARCHAR(255) NOT NULL,
    pattern_id UUID REFERENCES memory_patterns(id),

    -- Bridge metadata
    confidence FLOAT DEFAULT 0.5, -- How confident are we this applies
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,

    UNIQUE(source_context, target_context, pattern_id),
    INDEX idx_bridge_contexts (source_context, target_context)
);

-- =====================================================

-- Learning Events (Track what the system learns)
CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    interaction_id UUID REFERENCES interactions(id),

    -- What was learned
    event_type VARCHAR(100), -- 'pattern_discovered', 'failure_learned', 'success_confirmed'
    pattern_id UUID REFERENCES memory_patterns(id),

    -- Learning details
    insight TEXT,
    confidence FLOAT,
    impact_score FLOAT, -- How important is this learning

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_learning_session (session_id),
    INDEX idx_learning_type (event_type),
    INDEX idx_impact_score (impact_score DESC)
);

-- =====================================================

-- Pattern Relationships (How patterns relate)
CREATE TABLE pattern_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_a UUID REFERENCES memory_patterns(id),
    pattern_b UUID REFERENCES memory_patterns(id),

    relationship_type VARCHAR(100), -- 'depends_on', 'conflicts_with', 'enhances', 'alternative_to'
    strength FLOAT DEFAULT 0.5, -- How strong is this relationship

    -- Evidence
    evidence_count INTEGER DEFAULT 1,
    last_observed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(pattern_a, pattern_b, relationship_type),
    INDEX idx_pattern_relations (pattern_a, pattern_b)
);

-- =====================================================

-- Global Insights (System-wide learnings)
CREATE TABLE global_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Insight data
    insight_type VARCHAR(100), -- 'meta_pattern', 'emergent_behavior', 'optimization'
    title VARCHAR(500),
    description TEXT,

    -- Supporting evidence
    evidence JSONB, -- Pattern IDs, session IDs, metrics
    confidence FLOAT,

    -- Impact
    estimated_time_saved_minutes INTEGER,
    estimated_cost_saved_usd DECIMAL(10,2),

    -- Status
    is_active BOOLEAN DEFAULT true,
    validated_count INTEGER DEFAULT 0,
    invalidated_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_validated TIMESTAMP,

    INDEX idx_insight_type (insight_type),
    INDEX idx_confidence (confidence DESC)
);

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Top patterns by context
CREATE MATERIALIZED VIEW top_patterns_by_context AS
SELECT
    context,
    pattern_key,
    pattern_type,
    quality_score,
    usage_count,
    success_count / NULLIF(success_count + failure_count, 0) as success_rate
FROM memory_patterns
WHERE usage_count > 0
ORDER BY context, quality_score DESC;

-- Pattern success rates
CREATE MATERIALIZED VIEW pattern_success_rates AS
SELECT
    pattern_key,
    pattern_type,
    SUM(success_count) as total_successes,
    SUM(failure_count) as total_failures,
    SUM(success_count)::FLOAT / NULLIF(SUM(success_count) + SUM(failure_count), 0) as success_rate,
    COUNT(DISTINCT context) as context_count
FROM memory_patterns
GROUP BY pattern_key, pattern_type
ORDER BY success_rate DESC;

-- Session analytics
CREATE MATERIALIZED VIEW session_analytics AS
SELECT
    DATE(started_at) as session_date,
    context,
    interface,
    COUNT(*) as session_count,
    SUM(interaction_count) as total_interactions,
    AVG(interaction_count) as avg_interactions_per_session,
    SUM(total_cost_usd) as daily_cost,
    AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_session_minutes
FROM sessions
WHERE state = 'completed'
GROUP BY DATE(started_at), context, interface;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to find similar patterns using vector similarity
CREATE OR REPLACE FUNCTION find_similar_patterns(
    query_embedding VECTOR(1536),
    context_filter VARCHAR DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    pattern_id UUID,
    pattern_key VARCHAR,
    similarity FLOAT,
    content JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        pattern_key,
        1 - (embedding <-> query_embedding) as similarity,
        content
    FROM memory_patterns
    WHERE (context_filter IS NULL OR context = context_filter)
        AND embedding IS NOT NULL
    ORDER BY embedding <-> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate pattern value score
CREATE OR REPLACE FUNCTION calculate_pattern_value(
    p_pattern_id UUID
) RETURNS FLOAT AS $$
DECLARE
    v_score FLOAT;
    v_success_rate FLOAT;
    v_usage_count INTEGER;
    v_context_count INTEGER;
BEGIN
    SELECT
        COALESCE(success_count::FLOAT / NULLIF(success_count + failure_count, 0), 0.5),
        usage_count,
        (SELECT COUNT(DISTINCT context) FROM context_bridges WHERE pattern_id = p_pattern_id)
    INTO v_success_rate, v_usage_count, v_context_count
    FROM memory_patterns
    WHERE id = p_pattern_id;

    -- Weighted score: success rate + log(usage) + context spread
    v_score := (v_success_rate * 0.5) +
               (LN(v_usage_count + 1) * 0.3) +
               (v_context_count * 0.2);

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update pattern quality score on usage
CREATE OR REPLACE FUNCTION update_pattern_quality()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quality_score := calculate_pattern_value(NEW.id);
    NEW.last_modified := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pattern_quality
    BEFORE UPDATE ON memory_patterns
    FOR EACH ROW
    WHEN (NEW.usage_count != OLD.usage_count OR
          NEW.success_count != OLD.success_count OR
          NEW.failure_count != OLD.failure_count)
    EXECUTE FUNCTION update_pattern_quality();

-- Auto-bridge patterns across contexts
CREATE OR REPLACE FUNCTION auto_bridge_patterns()
RETURNS TRIGGER AS $$
DECLARE
    v_similar_pattern RECORD;
BEGIN
    -- Find similar patterns in other contexts
    FOR v_similar_pattern IN
        SELECT id, context, 1 - (embedding <-> NEW.embedding) as similarity
        FROM memory_patterns
        WHERE id != NEW.id
            AND context != NEW.context
            AND embedding IS NOT NULL
            AND (1 - (embedding <-> NEW.embedding)) > 0.85
        LIMIT 5
    LOOP
        -- Create bridge if similarity is high enough
        INSERT INTO context_bridges (
            source_context,
            target_context,
            pattern_id,
            confidence
        ) VALUES (
            NEW.context,
            v_similar_pattern.context,
            NEW.id,
            v_similar_pattern.similarity
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_bridge
    AFTER INSERT ON memory_patterns
    FOR EACH ROW
    WHEN (NEW.embedding IS NOT NULL)
    EXECUTE FUNCTION auto_bridge_patterns();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_patterns_composite ON memory_patterns(context, pattern_type, quality_score DESC);
CREATE INDEX idx_interactions_patterns ON interactions USING GIN (patterns);
CREATE INDEX idx_interactions_new_patterns ON interactions USING GIN (new_patterns);
CREATE INDEX idx_sessions_active ON sessions(state, context) WHERE state = 'active';

-- Full text search on interactions
CREATE INDEX idx_interactions_prompt_text ON interactions USING GIN (to_tsvector('english', prompt));
CREATE INDEX idx_interactions_response_text ON interactions USING GIN (to_tsvector('english', response));

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Seed with common pattern types
INSERT INTO memory_patterns (pattern_key, pattern_type, content, context, quality_score) VALUES
('error_handling', 'architecture', '{"approach": "centralized error handler", "benefits": "consistent error format"}', 'global', 0.8),
('api_pagination', 'pattern', '{"method": "cursor-based", "advantages": "scalable"}', 'global', 0.75),
('test_structure', 'testing', '{"pattern": "AAA", "description": "Arrange-Act-Assert"}', 'global', 0.9)
ON CONFLICT DO NOTHING;