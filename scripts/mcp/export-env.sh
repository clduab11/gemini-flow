#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.mcp.local"

if [[ ! -f "$ENV_FILE" ]];nthen
  echo "Missing $ENV_FILE; create it with your MCP API keys." >&2
  exit 1
fi

echo "Loading MCP environment from $ENV_FILE"
set -a
source "$ENV_FILE"
set +a

echo "MCP environment variables exported."

