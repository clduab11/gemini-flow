-- SEO Intelligence Platform - Complete Database Schema
-- Multi-tenant, scalable, production-ready

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For complex indexes
CREATE EXTENSION IF NOT EXISTS "timescaledb"; -- For time-series data

-- =====================================================
-- CORE MULTI-TENANT STRUCTURE (Reusable!)
-- =====================================================

-- Tenants (Account level)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}', -- Enabled features
    limits JSONB DEFAULT '{"projects": 1, "keywords": 100, "pages": 1000}',
    
    -- API Access
    api_key VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    api_secret VARCHAR(64) DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (can belong to multiple tenants)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    
    -- Auth
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Tenant relationships
CREATE TABLE user_tenants (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

-- Projects (Workspace concept)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Main domain for this project
    domain VARCHAR(255),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    competitors TEXT[], -- Array of competitor domains
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, slug)
);

-- =====================================================
-- SEO CORE ENTITIES
-- =====================================================

-- Domains being tracked
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    
    -- Authority metrics
    authority_score DECIMAL(5,2),
    trust_score DECIMAL(5,2),
    spam_score DECIMAL(5,2),
    
    -- Traffic metrics
    organic_traffic BIGINT,
    organic_keywords INTEGER,
    organic_traffic_value DECIMAL(12,2),
    
    -- Technical metrics
    indexed_pages INTEGER,
    page_speed_mobile DECIMAL(5,2),
    page_speed_desktop DECIMAL(5,2),
    
    -- Status
    verified BOOLEAN DEFAULT FALSE,
    last_crawled_at TIMESTAMPTZ,
    crawl_status VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, domain)
);

-- Keywords to track
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    keyword VARCHAR(500) NOT NULL,
    
    -- Metrics
    search_volume INTEGER,
    search_volume_trend JSONB, -- Monthly trend data
    difficulty DECIMAL(5,2),
    opportunity DECIMAL(5,2), -- Custom opportunity score
    
    -- Commercial data
    cpc DECIMAL(10,2),
    competition DECIMAL(5,2),
    
    -- Classification
    intent VARCHAR(50) CHECK (intent IN ('informational', 'navigational', 'commercial', 'transactional')),
    topic_cluster VARCHAR(255),
    tags TEXT[],
    
    -- Location/Language
    country_code VARCHAR(2) DEFAULT 'US',
    language_code VARCHAR(5) DEFAULT 'en',
    location VARCHAR(255), -- For local SEO
    
    -- SERP Features
    serp_features JSONB, -- {featured_snippet: true, local_pack: true, etc}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, keyword, country_code, location)
);

-- Rankings - Time series data (Hypertable)
CREATE TABLE rankings (
    project_id UUID NOT NULL,
    keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    
    -- Ranking data
    position INTEGER,
    url TEXT,
    title TEXT,
    description TEXT,
    
    -- Device/Location
    device VARCHAR(20) DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
    location VARCHAR(255),
    
    -- SERP info
    serp_features JSONB, -- Features present for this specific SERP
    competitors JSONB, -- Top 10 competitors for this SERP
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (project_id, keyword_id, domain_id, device, timestamp)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('rankings', 'timestamp');

-- Pages (Crawled content)
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    url_hash VARCHAR(64) GENERATED ALWAYS AS (encode(sha256(url::bytea), 'hex')) STORED,
    
    -- Content
    title TEXT,
    meta_description TEXT,
    h1 TEXT,
    h2_array TEXT[],
    canonical_url TEXT,
    
    -- Metrics
    word_count INTEGER,
    reading_time INTEGER, -- in seconds
    
    -- Links
    internal_links_in INTEGER DEFAULT 0,
    internal_links_out INTEGER DEFAULT 0,
    external_links_out INTEGER DEFAULT 0,
    
    -- Technical
    status_code INTEGER,
    redirect_chain JSONB,
    page_size_bytes INTEGER,
    load_time_ms INTEGER,
    
    -- SEO Elements
    meta_robots TEXT,
    structured_data JSONB,
    open_graph JSONB,
    
    -- Content quality
    content_hash VARCHAR(64),
    readability_score DECIMAL(5,2),
    
    -- Crawl info
    last_crawled_at TIMESTAMPTZ,
    crawl_frequency VARCHAR(50) DEFAULT 'weekly',
    change_frequency VARCHAR(50), -- detected change frequency
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(domain_id, url_hash)
);

-- Backlinks
CREATE TABLE backlinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_domain VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    target_domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    
    -- Link attributes
    anchor_text TEXT,
    anchor_type VARCHAR(50), -- exact, partial, branded, naked, generic
    rel_attributes TEXT[], -- nofollow, ugc, sponsored, etc
    link_context TEXT, -- Surrounding text
    
    -- Quality metrics
    source_authority DECIMAL(5,2),
    source_relevance DECIMAL(5,2),
    source_traffic BIGINT,
    is_image BOOLEAN DEFAULT FALSE,
    
    -- Status
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Analysis
CREATE TABLE content_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    
    -- Content scores
    content_score DECIMAL(5,2), -- Overall score
    relevance_score DECIMAL(5,2),
    comprehensiveness_score DECIMAL(5,2),
    readability_score DECIMAL(5,2),
    
    -- Optimization suggestions
    suggestions JSONB,
    missing_topics TEXT[],
    recommended_word_count INTEGER,
    
    -- Competitor comparison
    competitor_analysis JSONB,
    content_gap JSONB,
    
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CRAWLER INFRASTRUCTURE
-- =====================================================

-- Crawl queue
CREATE TABLE crawl_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    url_hash VARCHAR(64) GENERATED ALWAYS AS (encode(sha256(url::bytea), 'hex')) STORED,
    
    -- Priority and scheduling
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    
    -- Worker assignment
    worker_id VARCHAR(100),
    locked_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(domain_id, url_hash)
);

-- Crawl history
CREATE TABLE crawl_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES domains(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Stats
    pages_crawled INTEGER DEFAULT 0,
    pages_discovered INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Performance
    total_bytes BIGINT,
    avg_response_time_ms INTEGER,
    
    -- Status
    status VARCHAR(50),
    error_summary JSONB
);

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

-- Report templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- weekly, monthly, custom, white-label
    
    -- Configuration
    sections JSONB, -- Which sections to include
    branding JSONB, -- White-label settings
    
    -- Schedule
    schedule_cron VARCHAR(100),
    recipients TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id),
    
    -- Report data
    title VARCHAR(255),
    period_start DATE,
    period_end DATE,
    data JSONB, -- Report data
    
    -- Files
    pdf_url TEXT,
    excel_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'generating',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- API & USAGE TRACKING
-- =====================================================

-- API keys (for public API access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 of the actual key
    name VARCHAR(255),
    
    -- Permissions
    scopes TEXT[], -- read:keywords, write:rankings, etc
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage logs (Hypertable)
CREATE TABLE api_usage (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    
    -- Request info
    ip_address INET,
    user_agent TEXT,
    
    -- Response info
    status_code INTEGER,
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    
    -- Billing
    credits_used INTEGER DEFAULT 1,
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('api_usage', 'timestamp');

-- Feature usage tracking
CREATE TABLE feature_usage (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    feature VARCHAR(100) NOT NULL,
    
    -- Usage details
    credits_used INTEGER DEFAULT 1,
    input_size INTEGER, -- For bulk operations
    output_size INTEGER,
    
    -- Context
    project_id UUID REFERENCES projects(id),
    metadata JSONB,
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('feature_usage', 'timestamp');

-- =====================================================
-- AUDIT & COMPLIANCE
-- =====================================================

-- Audit log for all changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, export, etc
    resource_type VARCHAR(100),
    resource_id UUID,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tenant isolation
CREATE INDEX idx_all_tables_tenant_id ON projects(tenant_id);
CREATE INDEX idx_domains_project ON domains(project_id);
CREATE INDEX idx_keywords_project ON keywords(project_id);

-- Search performance
CREATE INDEX idx_keywords_search ON keywords USING gin(keyword gin_trgm_ops);
CREATE INDEX idx_pages_url_hash ON pages(domain_id, url_hash);
CREATE INDEX idx_backlinks_target ON backlinks(target_domain_id);

-- Time series queries
CREATE INDEX idx_rankings_keyword_time ON rankings(keyword_id, timestamp DESC);
CREATE INDEX idx_api_usage_tenant_time ON api_usage(tenant_id, timestamp DESC);

-- Crawl queue performance
CREATE INDEX idx_crawl_queue_next ON crawl_queue(status, priority DESC, scheduled_at) 
    WHERE status = 'pending';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON projects
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON domains
    USING (project_id IN (
        SELECT id FROM projects WHERE tenant_id = current_setting('app.current_tenant')::uuid
    ));

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate opportunity score
CREATE OR REPLACE FUNCTION calculate_opportunity_score(
    search_volume INTEGER,
    difficulty DECIMAL,
    current_position INTEGER
) RETURNS DECIMAL AS $$
BEGIN
    -- Higher volume, lower difficulty, worse current position = higher opportunity
    RETURN GREATEST(0, LEAST(100, 
        (search_volume::DECIMAL / 100) * 
        (100 - difficulty) * 
        (CASE 
            WHEN current_position IS NULL THEN 2
            WHEN current_position > 50 THEN 1.5  
            WHEN current_position > 20 THEN 1.2
            ELSE 0.8
        END)
    ));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Default plans
INSERT INTO tenants (id, slug, name, email, plan) VALUES
    ('00000000-0000-0000-0000-000000000001', 'demo', 'Demo Account', 'demo@seo-platform.com', 'pro');

-- Sample user
INSERT INTO users (id, email, password_hash, name) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@seo-platform.com', '$2b$10$YourHashHere', 'Admin User');

-- Link user to tenant
INSERT INTO user_tenants (user_id, tenant_id, role) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner');
