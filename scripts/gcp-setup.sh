#!/usr/bin/env bash
#
# One-time GCP setup for AI Recruitment Agent.
# Run this ONCE per project. Subsequent deploys use `gcp-deploy.sh`.
#
# What it does:
#   1. Enables required APIs
#   2. Creates Artifact Registry repo (for container images)
#   3. Provisions Cloud SQL Postgres (db-f1-micro for dev; resize for prod)
#   4. Creates the application database + user
#   5. Stores all secrets in Secret Manager (interactive prompt — paste values)
#   6. Grants the Cloud Run service account the right roles
#
# Usage:
#   ./scripts/gcp-setup.sh PROJECT_ID [REGION]
#
# Example:
#   ./scripts/gcp-setup.sh ai-recruitment-agent-496912 us-central1

set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
SERVICE="ai-recruitment-agent"
AR_REPO="containers"
SQL_INSTANCE="agent-db"
SQL_TIER="db-f1-micro"        # ~$8/mo. Resize to db-custom-1-3840 for production.
DB_NAME="recruitment_agent"
DB_USER="app"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 PROJECT_ID [REGION]" >&2
  exit 1
fi

echo "═══════════════════════════════════════════════════════════════════"
echo "  GCP Setup — project=$PROJECT_ID region=$REGION"
echo "═══════════════════════════════════════════════════════════════════"

gcloud config set project "$PROJECT_ID"

# ── 1. APIs ───────────────────────────────────────────────────────────────
echo ""
echo "[1/6] Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com

# ── 2. Artifact Registry repo ─────────────────────────────────────────────
echo ""
echo "[2/6] Creating Artifact Registry repo '$AR_REPO'..."
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="AI Recruitment Agent container images" \
  2>/dev/null || echo "  (already exists, skipping)"

# ── 3. Cloud SQL Postgres ─────────────────────────────────────────────────
echo ""
echo "[3/6] Creating Cloud SQL Postgres instance '$SQL_INSTANCE' (~5 min)..."
gcloud sql instances create "$SQL_INSTANCE" \
  --database-version=POSTGRES_16 \
  --tier="$SQL_TIER" \
  --region="$REGION" \
  --storage-auto-increase \
  --storage-size=10GB \
  --backup \
  --backup-start-time=02:00 \
  2>/dev/null || echo "  (already exists, skipping)"

SQL_CONN="$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(connectionName)')"
echo "  Connection name: $SQL_CONN"

# ── 4. DB user + app database ─────────────────────────────────────────────
echo ""
echo "[4/6] Setting DB user password (Secret Manager) + creating database..."
DB_PASSWORD="$(openssl rand -base64 24)"

# Set the postgres user password (root)
echo "  Setting password for SQL user 'postgres'..."
gcloud sql users set-password postgres --instance="$SQL_INSTANCE" --password="$DB_PASSWORD" \
  2>/dev/null || true

gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" \
  2>/dev/null || echo "  (DB already exists, skipping)"

# Cloud Run uses Unix-socket connection: host=/cloudsql/<connection>
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${SQL_CONN}"

# ── 5. Secret Manager — write all secrets ─────────────────────────────────
echo ""
echo "[5/6] Writing secrets to Secret Manager..."

create_secret () {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    echo -n "$value" | gcloud secrets versions add "$name" --data-file=-
  else
    echo -n "$value" | gcloud secrets create "$name" --replication-policy=automatic --data-file=-
  fi
}

create_secret DATABASE_URL "$DATABASE_URL"

# Interactive prompts for the other secrets
prompt_secret () {
  local name="$1"
  local label="$2"
  local default_value="${3:-}"
  local current_value=""
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    echo "  $name: already exists — leave blank to keep, or paste a new value to rotate."
  else
    echo "  $name: $label"
  fi
  printf "    > "
  read -r current_value </dev/tty
  if [[ -z "$current_value" ]] && ! gcloud secrets describe "$name" >/dev/null 2>&1; then
    current_value="$default_value"
  fi
  if [[ -n "$current_value" ]]; then
    create_secret "$name" "$current_value"
  fi
}

# Generate a JWT secret if not already in Secret Manager
if ! gcloud secrets describe JWT_SECRET >/dev/null 2>&1; then
  create_secret JWT_SECRET "$(openssl rand -base64 48)"
  echo "  JWT_SECRET: auto-generated (48 random bytes)"
fi

prompt_secret GEMINI_API_KEY            "your Gemini API key (from AI Studio)"
prompt_secret APOLLO_API_KEY            "Apollo key for api/v1/people/match"
prompt_secret APOLLO_PEOPLE_SEARCH_KEY  "Apollo key for api/v1/mixed_people/api_search"
prompt_secret APOLLO_BULK_MATCH_KEY     "Apollo key for api/v1/people/bulk_match"
prompt_secret APOLLO_ORG_SEARCH_KEY     "Apollo key for api/v1/organizations/search"
prompt_secret APOLLO_ORG_ENRICH_KEY     "Apollo key for api/v1/organizations/enrich"

# CORS allowlist — default to the Cloud Run URL pattern; user can override.
RUN_URL_GUESS="https://${SERVICE}-${REGION}.a.run.app"
prompt_secret CORS_ORIGIN "comma-separated allowed origins (default: $RUN_URL_GUESS)" "$RUN_URL_GUESS"

# ── 6. IAM — grant Cloud Run runtime SA access to secrets + SQL ───────────
echo ""
echo "[6/6] Granting Cloud Run service account IAM access..."
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$RUN_SA" \
  --role=roles/secretmanager.secretAccessor \
  --condition=None >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$RUN_SA" \
  --role=roles/cloudsql.client \
  --condition=None >/dev/null

# Cloud Build service account also needs Run admin + SA user
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" \
  --role=roles/run.admin \
  --condition=None >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CB_SA" \
  --role=roles/iam.serviceAccountUser \
  --condition=None >/dev/null

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  SETUP COMPLETE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Cloud SQL connection : $SQL_CONN"
echo "Next step: deploy the app with:"
echo ""
echo "  ./scripts/gcp-deploy.sh $PROJECT_ID $REGION $SQL_CONN"
echo ""
