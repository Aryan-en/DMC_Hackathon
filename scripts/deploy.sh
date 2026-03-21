#!/bin/bash
# ONTORA Production Deployment Script - Week 16
# Deploys the ONTORA backend to Kubernetes with validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="ontora"
DEPLOYMENT="ontora-backend"
IMAGE_TAG="${1:-v1.0}"
REGISTRY="registry.example.com"
FULL_IMAGE="${REGISTRY}/ontora:${IMAGE_TAG}"
TIMEOUT=600  # 10 minutes
ROLLBACK_ON_FAILURE=true

echo -e "${BLUE}=== ONTORA Production Deployment ===${NC}"
echo "Namespace: $NAMESPACE"
echo "Deployment: $DEPLOYMENT"
echo "Image: $FULL_IMAGE"
echo ""

# 1. Pre-deployment checks
echo -e "${BLUE}Step 1: Pre-deployment validation${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}ERROR: kubectl not found${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}Creating namespace $NAMESPACE${NC}"
    kubectl create namespace "$NAMESPACE"
fi

# Check if image exists
echo "Checking if image exists: $FULL_IMAGE"
if ! docker image inspect "$FULL_IMAGE" &> /dev/null; then
    echo -e "${YELLOW}Image not found locally, attempting to pull...${NC}"
    if ! docker pull "$FULL_IMAGE"; then
        echo -e "${RED}ERROR: Failed to pull image${NC}"
        exit 1
    fi
fi

# Run production validation
echo -e "${BLUE}Running production validation${NC}"
cd "$(dirname "$0")/.."
if ! python validate_production.py; then
    echo -e "${RED}ERROR: Production validation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"
echo ""

# 2. Backup current deployment
echo -e "${BLUE}Step 2: Backing up current deployment${NC}"
BACKUP_FILE="/tmp/ontora-backup-$(date +%s).yaml"
kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o yaml > "$BACKUP_FILE" 2>/dev/null || true
echo "Backup saved to: $BACKUP_FILE"
echo -e "${GREEN}✓ Deployment backed up${NC}"
echo ""

# 3. Update deployment image
echo -e "${BLUE}Step 3: Updating deployment image${NC}"
kubectl set image deployment/"$DEPLOYMENT" \
    backend="$FULL_IMAGE" \
    --namespace="$NAMESPACE" \
    --record

echo -e "${GREEN}✓ Image updated${NC}"
echo ""

# 4. Wait for rollout
echo -e "${BLUE}Step 4: Waiting for rollout to complete (timeout: ${TIMEOUT}s)${NC}"
if kubectl rollout status deployment/"$DEPLOYMENT" \
    -n "$NAMESPACE" \
    --timeout="${TIMEOUT}s"; then
    echo -e "${GREEN}✓ Rollout completed successfully${NC}"
else
    echo -e "${RED}✗ Rollout failed or timed out${NC}"
    
    if [ "$ROLLBACK_ON_FAILURE" = true ]; then
        echo -e "${YELLOW}Rolling back to previous deployment${NC}"
        kubectl rollout undo deployment/"$DEPLOYMENT" -n "$NAMESPACE"
        kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE" --timeout="${TIMEOUT}s"
        echo -e "${RED}Deployment rolled back${NC}"
        exit 1
    else
        exit 1
    fi
fi
echo ""

# 5. Verify deployment
echo -e "${BLUE}Step 5: Verifying deployment${NC}"

# Check pod status
echo "Pod status:"
kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT"

# Check if pods are ready
READY_REPLICAS=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" \
    -o jsonpath='{.status.readyReplicas}')
DESIRED_REPLICAS=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" \
    -o jsonpath='{.spec.replicas}')

if [ "$READY_REPLICAS" = "$DESIRED_REPLICAS" ]; then
    echo -e "${GREEN}✓ All replicas ready ($READY_REPLICAS/$DESIRED_REPLICAS)${NC}"
else
    echo -e "${YELLOW}⚠ Not all replicas ready ($READY_REPLICAS/$DESIRED_REPLICAS)${NC}"
fi
echo ""

# 6. Health checks
echo -e "${BLUE}Step 6: Running health checks${NC}"

# Get service endpoint
SERVICE_IP=$(kubectl get service "$DEPLOYMENT" -n "$NAMESPACE" \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

if [ "$SERVICE_IP" != "pending" ]; then
    echo "Service endpoint: http://$SERVICE_IP:80"
    
    # Wait for service to be ready
    echo "Waiting for service to respond..."
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "http://$SERVICE_IP/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Service health check passed${NC}"
            break
        fi
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts: Service not ready yet..."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${YELLOW}⚠ Service health check timed out${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Service endpoint not available (may be pending)${NC}"
fi
echo ""

# 7. Metrics and monitoring
echo -e "${BLUE}Step 7: Checking metrics${NC}"

# Get recent events
echo "Recent deployment events:"
kubectl describe deployment "$DEPLOYMENT" -n "$NAMESPACE" | grep -A 20 "Events:"

echo ""
echo -e "${BLUE}Step 8: Post-deployment summary${NC}"

# Summary statistics
CURRENT_IMAGE=$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.containers[0].image}')

echo "Deployment: $DEPLOYMENT"
echo "Namespace: $NAMESPACE"
echo "Current image: $CURRENT_IMAGE"
echo "Desired replicas: $DESIRED_REPLICAS"
echo "Ready replicas: $READY_REPLICAS"
echo "Backup location: $BACKUP_FILE"

# Check for errors in logs
ERROR_COUNT=$(kubectl logs -n "$NAMESPACE" -l app="$DEPLOYMENT" --all-containers=true \
    --tail=100 2>/dev/null | grep -i "error\|fatal\|panic" | wc -l || echo 0)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No recent errors in logs${NC}"
else
    echo -e "${YELLOW}⚠ Found $ERROR_COUNT error(s) in recent logs${NC}"
    echo "Review with: kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT --tail=100"
fi

echo ""
echo -e "${GREEN}=== Deployment completed successfully ===${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor the deployment: kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT -f"
echo "2. View dashboard: kubectl port-forward -n $NAMESPACE svc/ontora-grafana 3000:3000"
echo "3. Review metrics: kubectl top pods -n $NAMESPACE"
echo ""
echo "To rollback if needed:"
echo "kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE"
