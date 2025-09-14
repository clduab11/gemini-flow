#!/bin/bash
# deploy-mcp-servers.sh

echo "🚀 Deploying MCP Servers..."

# Set environment variables from secure sources
export GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"
export TAVILY_API_KEY="${TAVILY_API_KEY}"
export PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY}"
export KAGI_API_KEY="${KAGI_API_KEY}"
export JINA_AI_API_KEY="${JINA_AI_API_KEY}"
export BRAVE_API_KEY="${BRAVE_API_KEY}"
export FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY}"

# Start prerequisite services
echo "🔴 Starting Redis..."
redis-server --port 6379 --daemonize yes

# Deploy all MCP servers
echo "🛠️  Deploying MCP servers..."
npx -y @modelcontextprotocol/server-redis redis://localhost:6379 &
python3 -m mcp_server_git &
npx -y @modelcontextprotocol/server-puppeteer &
npx -y @modelcontextprotocol/server-sequential-thinking &
npx -y @modelcontextprotocol/server-filesystem /Users/chrisdukes/Desktop &
npx -y @modelcontextprotocol/server-github &
npx -y @modelcontextprotocol/server-memory &
npx -y @supabase/mcp-server-supabase@latest --access-token=$SUPABASE_ACCESS_TOKEN &
npx -y mcp-omnisearch &

echo "✅ All MCP servers deployed!"
echo "🔧 Servers running in background processes"
echo "📋 Check server status with: ps aux | grep mcp"
