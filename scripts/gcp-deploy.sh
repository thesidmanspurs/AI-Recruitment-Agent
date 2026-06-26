#!/usr/bin/env bash
#
# Build + deploy to Cloud Run.
# Run anytime after gcp-setup.sh. Idempotent — safe to re-run.
#
# Usage:
#   ./scripts/gcp-deploy.sh PROJECT_ID [REGION] [CLOUD_SQL_CONN]
#
# Examples:
#   ./scripts/gcp-deploy.sh ai-recruitment-agent-496912
#   ./scripts/gcp-deploy.sh ai-recruitment-agent-496912 us-central1 \
#       ai-recruitment-agent-496912:us-central1:agent-db

set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
SQL_CONN="${3:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 PROJECT_ID [REGION] [CLOUD_SQL_CONN]" >&2
  exit 1
fi

# Auto-discover the SQL connection name if not provided
if [[ -z "$SQL_CONN" ]]; then
  SQL_CONN="$(gcloud sql instances describe agent-db --project="$PROJECT_ID" --format='value(connectionName)' 2>/dev/null || true)"
  if [[ -z "$SQL_CONN" ]]; then
    echo "Couldn't auto-discover Cloud SQL connection name. Pass it as the 3rd arg." >&2
    exit 1
  fi
fi

# Tag the image with the short git SHA for traceability; fall back to "latest"
# (the cloudbuild built-in $COMMIT_SHA is empty for manual `builds submit`).
IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null || echo latest)"

echo "Deploying to project=$PROJECT_ID region=$REGION sql=$SQL_CONN tag=$IMAGE_TAG..."

gcloud builds submit \
  --project="$PROJECT_ID" \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_CLOUDSQL_CONN=${SQL_CONN},_IMAGE_TAG=${IMAGE_TAG}" \
  .

URL="$(gcloud run services describe ai-recruitment-agent \
  --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"

echo ""
echo "Deployed: $URL"
echo "Health  : $URL/api/health"
echo "Admin   : $URL/admin"
