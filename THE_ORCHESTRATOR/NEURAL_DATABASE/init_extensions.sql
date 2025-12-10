-- Enable required PostgreSQL extensions

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- JSON validation
CREATE EXTENSION IF NOT EXISTS "jsonb_plpython3u";

-- Performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE neural_memory TO neural;