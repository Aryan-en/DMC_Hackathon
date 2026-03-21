#!/bin/bash
# Smoke Tests for ONTORA Production Deployment
# Tests basic functionality and availability

set -euo pipefail

# Configuration
API_BASE="${1:-http://localhost:8000}"
TIMEOUT=30
FAILURES=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== ONTORA Production Smoke Tests ===${NC}"
echo "API Base: $API_BASE"
echo ""

# Helper functions
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    
    echo -n "Testing $name... "
    
    response=$(curl -s -X "$method" -w "\n%{http_code}" \
        -H "Content-Type: application/json" \
        --max-time "$TIMEOUT" \
        "$API_BASE$endpoint" 2>/dev/null || echo "000")
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

test_response() {
    local name=$1
    local method=$2
    local endpoint=$3
    local required_field=$4
    
    echo -n "Testing $name... "
    
    response=$(curl -s -X "$method" \
        -H "Content-Type: application/json" \
        --max-time "$TIMEOUT" \
        "$API_BASE$endpoint" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q "$required_field"; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Missing field: $required_field)"
        echo "Response: $response"
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

# ===== Basic Health Checks =====
echo -e "${BLUE}--- Health Checks ---${NC}"
test_endpoint "Health check" "GET" "/health" "200"
test_endpoint "API health check" "GET" "/api/health" "200"
test_endpoint "Metrics endpoint" "GET" "/metrics" "200"

# ===== API Version =====
echo -e "${BLUE}--- Version Checks ---${NC}"
test_response "Version endpoint" "GET" "/api/version" "version"

# ===== Security Headers =====
echo -e "${BLUE}--- Security Headers ---${NC}"
echo -n "Checking security headers... "
headers=$(curl -s -I "$API_BASE/health" 2>/dev/null | grep -i "strict-transport-security\|x-frame-options\|x-content-type-options" | wc -l)
if [ "$headers" -ge 2 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Some security headers missing)"
fi

# ===== Rate Limiting =====
echo -e "${BLUE}--- Rate Limiting ---${NC}"
echo -n "Testing rate limiting... "
rate_limit_error=0
for i in {1..105}; do
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/health" --max-time 2)
    if [ "$response" = "429" ]; then
        rate_limit_error=1
        break
    fi
done

if [ "$rate_limit_error" = "1" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Rate limit triggered)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Rate limiting not detected)"
fi

# ===== Input Validation =====
echo -e "${BLUE}--- Input Validation ---${NC}"
echo -n "Testing XSS prevention... "
response=$(curl -s "$API_BASE/api/users?id=<script>" --max-time "$TIMEOUT" 2>/dev/null)
if echo "$response" | grep -q "INVALID_REQUEST\|invalid characters"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (XSS payload not blocked)"
fi

echo -n "Testing SQL injection prevention... "
response=$(curl -s "$API_BASE/api/users?id=1' OR '1'='1" --max-time "$TIMEOUT" 2>/dev/null)
if echo "$response" | grep -q "INVALID_REQUEST\|invalid characters"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (SQL injection payload not blocked)"
fi

# ===== Database Connectivity =====
echo -e "${BLUE}--- Database Connectivity ---${NC}"
test_response "Health check includes database status" "GET" "/api/health" "postgres\|neo4j"

# ===== Performance =====
echo -e "${BLUE}--- Performance ---${NC}"
echo -n "Testing response latency... "
start=$(date +%s%N)
curl -s "$API_BASE/health" > /dev/null 2>&1
end=$(date +%s%N)
latency=$(( (end - start) / 1000000 ))

if [ "$latency" -lt 500 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${latency}ms)"
elif [ "$latency" -lt 1000 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} (${latency}ms - acceptable but slower than ideal)"
else
    echo -e "${RED}✗ FAIL${NC} (${latency}ms - too slow)"
    FAILURES=$((FAILURES + 1))
fi

# ===== Service Dependencies =====
echo -e "${BLUE}--- Service Dependencies ---${NC}"

# Check if backend can connect to databases
echo -n "Checking PostgreSQL connectivity... "
if curl -s "$API_BASE/api/health" | grep -q '"postgres".*"ok"'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILURES=$((FAILURES + 1))
fi

echo -n "Checking Neo4j connectivity... "
if curl -s "$API_BASE/api/health" | grep -q '"neo4j".*"ok"'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILURES=$((FAILURES + 1))
fi

# ===== Monitoring =====
echo -e "${BLUE}--- Monitoring ---${NC}"
test_response "Prometheus metrics available" "GET" "/metrics" "ontora_requests_total"

# ===== Summary =====
echo ""
echo -e "${BLUE}=== Test Summary ===${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILURES test(s) failed${NC}"
    exit 1
fi
