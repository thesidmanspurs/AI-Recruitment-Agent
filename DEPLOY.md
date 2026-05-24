# Deploying AI Recruitment Agent to GCP Cloud Run

Step-by-step deployment. Total wall-clock: **~15 minutes** the first time, **~3 minutes** for subsequent deploys.

## Prerequisites

- A GCP project (e.g. `ai-recruitment-agent-496912`) with billing enabled
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- Owner or Editor role on the project
- `openssl` installed (used to generate JWT secret + DB password)
- Your Gemini API key + Apollo API keys ready to paste

## Architecture summary (what gets created)

```
GCP project
├── Cloud SQL: agent-db (Postgres 16, db-f1-micro, ~$8/mo)
│   └── database: recruitment_agent
├── Artifact Registry: containers (Docker repo)
├── Secret Manager: 9 secrets (DB URL, JWT, Gemini, 5× Apollo, CORS)
└── Cloud Run service: ai-recruitment-agent
    ├── Container: built from this repo
    ├── Auto-scaled 0 → 3 instances
    ├── Public URL: https://ai-recruitment-agent-{HASH}-{REGION}.a.run.app
    └── Connected to Cloud SQL via Unix socket
```

## One-time setup (do this once per GCP project)

```bash
# Linux / macOS / WSL
chmod +x scripts/gcp-setup.sh scripts/gcp-deploy.sh
./scripts/gcp-setup.sh ai-recruitment-agent-496912 us-central1
```

```powershell
# Windows PowerShell (with WSL or Git Bash, then run the bash setup)
wsl bash ./scripts/gcp-setup.sh ai-recruitment-agent-496912 us-central1
```

The script:

1. Switches `gcloud` to the right project
2. Enables Cloud Run, Cloud SQL, Cloud Build, Artifact Registry, Secret Manager, VPC Access APIs
3. Creates the Artifact Registry Docker repo
4. Provisions Cloud SQL Postgres 16 (db-f1-micro tier; ~$8/mo — resize for prod)
5. Creates the `recruitment_agent` database, generates a strong DB password
6. Prompts you for each API key (Gemini, Apollo ×5), stores them in Secret Manager
7. Auto-generates a 48-byte `JWT_SECRET`
8. Grants the Cloud Run runtime service account `roles/secretmanager.secretAccessor` and `roles/cloudsql.client`
9. Grants Cloud Build `roles/run.admin` + `roles/iam.serviceAccountUser`

Expect ~5 minutes of waiting on Cloud SQL provisioning.

## Deploy (run every time you ship a code change)

```bash
./scripts/gcp-deploy.sh ai-recruitment-agent-496912
```

```powershell
./scripts/gcp-deploy.ps1 -ProjectId ai-recruitment-agent-496912
```

The script:

1. Submits a Cloud Build job using `cloudbuild.yaml`
2. Builds the multi-stage Docker image (frontend + backend) from this repo
3. Pushes the image to Artifact Registry (tagged `:latest` + `:$COMMIT_SHA`)
4. Deploys the new image to Cloud Run with all secrets attached
5. On the new container's cold start, Prisma runs `migrate deploy` against Cloud SQL
6. Prints the public URL

Output looks like:

```
Deployed: https://ai-recruitment-agent-abcdef-uc.a.run.app
Health  : https://ai-recruitment-agent-abcdef-uc.a.run.app/api/health
Admin   : https://ai-recruitment-agent-abcdef-uc.a.run.app/admin
```

## First-time post-deploy steps

1. **Create the admin account** — register through the UI (https://YOUR-URL/), then promote yourself:
   ```bash
   gcloud sql connect agent-db --user=postgres --database=recruitment_agent
   ```
   ```sql
   UPDATE "User" SET role='ADMIN' WHERE email='you@example.com';
   \q
   ```

2. **Verify the pipeline**: sign in, create a campaign, click Source candidates, watch real Apollo people land in the Approved Queue.

3. **Tune the daily-usage cap**: Admin Console → Settings → `daily_free_limit` (default 50).

## Day-2 operations

| Task | Command |
|---|---|
| View live logs | `gcloud run services logs tail ai-recruitment-agent --region=us-central1` |
| Rotate an API key | `echo -n "NEW_KEY" \| gcloud secrets versions add APOLLO_API_KEY --data-file=-` then redeploy or restart the service |
| Roll back to previous revision | `gcloud run services update-traffic ai-recruitment-agent --to-revisions=PREVIOUS_REVISION=100 --region=us-central1` |
| Open the DB shell | `gcloud sql connect agent-db --user=postgres --database=recruitment_agent` |
| Scale up Cloud SQL | `gcloud sql instances patch agent-db --tier=db-custom-1-3840` |
| Increase Cloud Run max instances | `gcloud run services update ai-recruitment-agent --max-instances=10 --region=us-central1` |

## Cost expectations (small-team usage)

| Component | Spec | Monthly |
|---|---|---|
| Cloud Run | min-instances=0, ~10 req/min average | ~$1-5 (first 2M requests free) |
| Cloud SQL | db-f1-micro, 10GB storage | ~$8 |
| Artifact Registry | <1GB images | ~$0.10 |
| Secret Manager | 9 secrets | ~$0.06 |
| Cloud Build | ~5 builds/month | free tier covers ~120/month |
| Gemini API | within free tier for typical usage | $0 |
| Apollo Basic | external | $49 |
| **GCP-only total** | | **~$10-15/mo** |

## Custom domain (optional)

```bash
gcloud run domain-mappings create \
  --service=ai-recruitment-agent \
  --domain=recruiter.yourdomain.com \
  --region=us-central1
```

Then add the DNS CNAME records Cloud Run prints. The `CORS_ORIGIN` secret must include the custom domain.

## Disaster recovery

| Scenario | Recovery |
|---|---|
| Bad deploy | `gcloud run services update-traffic ai-recruitment-agent --to-revisions=PREV=100 --region=us-central1` |
| Lost JWT_SECRET | Sign in won't break (existing JWTs still validate). Rotate by adding new secret version + redeploy → forces all users to re-login |
| Cloud SQL corrupted | `gcloud sql backups list --instance=agent-db` → `gcloud sql backups restore BACKUP_ID --restore-instance=agent-db` |
| Compromised API key | Rotate the affected secret in Secret Manager + Apollo/Gemini dashboards |
| Need to nuke everything | `gcloud sql instances delete agent-db`, `gcloud run services delete ai-recruitment-agent`, then re-run setup from scratch |

## Re-deploy elsewhere

This setup is portable to any other GCP project with two commands:

```bash
./scripts/gcp-setup.sh NEW_PROJECT_ID us-central1
./scripts/gcp-deploy.sh NEW_PROJECT_ID
```

No code changes needed — all configuration is via env vars + Secret Manager.

## Files this deploy uses

- `Dockerfile` — multi-stage build (Node 22-alpine)
- `.dockerignore` — keeps the image lean
- `cloudbuild.yaml` — Cloud Build pipeline definition
- `scripts/gcp-setup.sh` — one-time project provisioning
- `scripts/gcp-deploy.sh` / `.ps1` — deploy on every change
- `prisma/schema.prisma` + `prisma/migrations/*` — schema versioning
- `.env.example` — template for local development (root-level)
- `frontend/.env.example` — `VITE_API_BASE_URL` only

See `SPEC.md` for the full system architecture.
