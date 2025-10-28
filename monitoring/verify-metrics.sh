#!/bin/bash
# Quick verification script to check Prometheus metrics are working correctly
# Usage: ./monitoring/verify-metrics.sh

set -e

BACKEND_URL="http://localhost:3001"
METRICS_ENDPOINT="$BACKEND_URL/metrics"
HEALTH_ENDPOINT="$BACKEND_URL/health"

echo "🧪 Testing Gemini Flow Backend Metrics"
echo "======================================="
echo ""

# Check if backend is running
echo "1️⃣ Checking if backend is running..."
if curl -s -f "$HEALTH_ENDPOINT" > /dev/null; then
    echo "✅ Backend is running"
    if command -v jq &> /dev/null; then
        curl -s "$HEALTH_ENDPOINT" | jq .
    else
        curl -s "$HEALTH_ENDPOINT"
    fi
else
    echo "❌ Backend is not running. Please start it with: cd backend && npm start"
    exit 1
fi

echo ""
echo "2️⃣ Testing metrics endpoint..."
if curl -s -f "$METRICS_ENDPOINT" > /dev/null; then
    echo "✅ Metrics endpoint is accessible"
else
    echo "❌ Metrics endpoint is not accessible"
    exit 1
fi

echo ""
echo "3️⃣ Checking for default metrics..."
DEFAULT_METRICS=(
    "gemini_flow_process_cpu_user_seconds_total"
    "gemini_flow_process_resident_memory_bytes"
    "gemini_flow_process_heap_bytes"
    "gemini_flow_nodejs_eventloop_lag_seconds"
)

for metric in "${DEFAULT_METRICS[@]}"; do
    if curl -s "$METRICS_ENDPOINT" | grep -q "$metric"; then
        echo "✅ Found: $metric"
    else
        echo "❌ Missing: $metric"
    fi
done

echo ""
echo "4️⃣ Checking for custom HTTP metrics..."
HTTP_METRICS=(
    "gemini_flow_http_request_duration_seconds"
    "gemini_flow_http_requests_total"
)

for metric in "${HTTP_METRICS[@]}"; do
    if curl -s "$METRICS_ENDPOINT" | grep -q "$metric"; then
        echo "✅ Found: $metric"
    else
        echo "❌ Missing: $metric"
    fi
done

echo ""
echo "5️⃣ Checking for custom Gemini API metrics..."
GEMINI_METRICS=(
    "gemini_flow_gemini_api_duration_seconds"
    "gemini_flow_gemini_api_requests_total"
    "gemini_flow_nodes_processed"
    "gemini_flow_edges_processed"
)

for metric in "${GEMINI_METRICS[@]}"; do
    if curl -s "$METRICS_ENDPOINT" | grep -q "$metric"; then
        echo "✅ Found: $metric"
    else
        echo "⚠️  Not yet recorded: $metric (metrics appear after first API call)"
    fi
done

echo ""
echo "6️⃣ Checking for error metrics..."
if curl -s "$METRICS_ENDPOINT" | grep -q "gemini_flow_errors_total"; then
    echo "✅ Found: gemini_flow_errors_total"
else
    echo "⚠️  Not yet recorded: gemini_flow_errors_total (metrics appear after first error)"
fi

echo ""
echo "7️⃣ Sample metrics output (first 30 lines):"
echo "-------------------------------------------"
curl -s "$METRICS_ENDPOINT" | head -30

echo ""
echo "✅ All checks complete!"
echo ""
echo "📊 View full metrics at: $METRICS_ENDPOINT"
echo "📋 View health status at: $HEALTH_ENDPOINT"
echo ""
echo "🚀 Next steps:"
echo "   - Run Prometheus to collect metrics: docker-compose -f monitoring/docker-compose.yml up -d prometheus"
echo "   - View Grafana dashboards: docker-compose -f monitoring/docker-compose.yml up -d grafana"
echo "   - Access Prometheus UI: http://localhost:9090"
echo "   - Access Grafana UI: http://localhost:3000 (admin/admin)"
