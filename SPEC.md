# AI Recruitment Agent — System Spec

End-to-end autonomous recruiter: Gemini reads a job description, Apollo surfaces real LinkedIn candidates with verified emails, Gemini drafts personalised outreach, SMTP delivers it, the system tracks 48-hour follow-ups.

---

## 1. Architecture at a glance

```
                          ┌────────────────────────────┐
                          │   React 19 SPA (Vite)      │
                          │   served by the Express    │
                          │   backend at /             │
                          └────────────┬───────────────┘
                                       │ HTTP + JWT
                                       ▼
        ┌─────────────────────────────────────────────────────────┐
        │  Express backend  (Node 22 + TypeScript + Prisma)       │
        │  ─────────────────────────────────────────────────────  │
        │  • config/  – env loader + database client              │
        │  • types/   – typed contracts                           │
        │  • middleware/ – authenticate, requireAdmin, cors,      │
        │                  errorHandler, logger                   │
        │  • repositories/ – Prisma queries (tenant-scoped)       │
        │  • services/ai/        – Gemini (JD, sourcing, msg)    │
        │  • services/apollo/    – Search, Match-by-id, Org      │
        │  • services/screening/ – dedupe + threshold + audit    │
        │  • services/outreach/  – Email (nodemailer)            │
        │  • services/tracking/  – 48h alert scheduler           │
        │  • services/usage/     – per-user daily-limit gate     │
        │  • services/admin/     – settings, stats, paginate     │
        │  • controllers/        – HTTP layer (thin)              │
        │  • routes/             – Express routers                │
        └────────┬──────────────────────┬─────────────────────────┘
                 │                      │
        ┌────────▼─────────┐  ┌─────────▼──────────┐  ┌──────────────┐
        │  Postgres 16     │  │  Gemini 2.5-flash  │  │  Apollo.io   │
        │  (Cloud SQL in   │  │  (Google AI)       │  │  (5 scoped   │
        │   prod, Docker   │  │                    │  │   API keys)  │
        │   in dev)        │  │                    │  │              │
        └──────────────────┘  └────────────────────┘  └──────────────┘
                                                              │
                                                              ▼
                                                       ┌─────────────┐
                                                       │  SMTP       │
                                                       │  (any host) │
                                                       └─────────────┘
```

## 2. Recruiter workflow (the happy path)

| Step | Phase | Service call | Cost |
|---|---|---|---|
| 1. Recruiter pastes a JD → "Create Campaign" | 1 | `geminiService.analyzeJobSpec` → extracts title, alt titles, keywords, requirements | 1 Gemini token-block |
| 2. Click "Source candidates" | 2 | `apolloSourcingService.searchRaw` → 25 first-name-only hits + Apollo ids | 0 credits |
| 2b. Auto-chain each id through Match | 4 | `apolloService.enrichById` ×25 (parallel) → full name + verified email + LinkedIn URL | 25 Apollo credits |
| 3. Phase 3 screening | 3 | `screenProfiles()` deduplicates + scores + threshold-splits | local |
| 4. Recruiter opens row → "Send outreach" | 5 | `geminiService.generateOutreachMessage` → subject + body → `emailService.sendEmail` via SMTP | 1 Gemini call + 1 SMTP send |
| 5. Background scheduler | 5 | `trackingService.startAlertScheduler` polls hourly → flags candidates >48h with no reply | local |
| 6. Recruiter clicks "Mark replied" on a row | 5 | `candidateRepository.update` → status REPLIED → alert flips green | local |

Throughout, the **daily-usage gate** (admin-configurable) and the **Apollo credit budget** keep spend bounded.

## 3. Data model (Prisma)

```prisma
User ──┬──< Campaign ──< Candidate
       │
       └──< UsageDaily

AppSetting (singleton key-value: daily_free_limit, …)
ActivityLog ──> Campaign  (audit trail)
```

Key invariants enforced at the DB layer:

- `Campaign.userId` is on every row → strict tenant isolation
- `UNIQUE (Candidate.campaignId, Candidate.name)` → no duplicate people per campaign
- `User.isBlocked` checked in `authenticate` middleware → block takes effect on the next API call
- `UsageDaily(userId, date)` is the primary key → idempotent increment per day

## 4. External integrations & their failure modes

| Service | What we use | Fallback when it fails |
|---|---|---|
| **Gemini 2.5-flash** | Phase 1 (JD analysis), Phase 5 (outreach drafting) | On 429/error: returns deterministic fixture analysis + template message. UI banner: "Simulation mode". |
| **Apollo Search** (`mixed_people/api_search`) | Phase 2 sourcing — returns ids on Basic | On 403: fails loud with 502. NO mock-people fallback (deliberate; recruiter cannot mistake fake for real). |
| **Apollo Match** (`people/match` by id or linkedin_url) | Phase 4 enrichment | On empty result: persists what came back (email may be blank); flag `phoneEnriched=false`. |
| **SMTP (nodemailer)** | Phase 5 outreach send | If `SMTP_HOST` not set: logs `[Email simulated]`, records outreach, marks `outreachChannel=EMAIL` but `simulated=true`. |
| **Postgres** | Everything | If unreachable: Prisma throws; auth middleware returns 500; user sees a generic error. |

## 5. Apollo Basic — what works, what doesn't

The integration is built around the constraints of Apollo Basic ($49/mo):

| Apollo endpoint | Works on Basic? | What it returns | Notes |
|---|---|---|---|
| `mixed_people/api_search` | ✅ | `id`, `first_name`, `last_name_obfuscated`, `title`, `organization.name` (last_name + linkedin_url **redacted**) | Free; no credits used |
| `people/match` (by linkedin_url) | ✅ | Full name + verified email + city + linkedin_url | 1 credit per match |
| `people/match` (by Apollo id) | ✅ | Same as above — **this is the unlock**: Search → Match-by-id pipelines real data | 1 credit per match |
| `people/match` with `reveal_phone_number: true` | ✅ async | Requires `webhook_url` parameter; phone delivered to your webhook later (not in response) | Not yet wired; needs public URL |
| `people/bulk_match` | ✅ | Same shape as match, batched up to 10 | Same credit cost; saves HTTP round-trips |
| `organizations/search` | ✅ | Full company records | 0 credits |
| `organizations/enrich` | ✅ | Full company records (`key_people` empty on Basic) | 0 credits |

## 6. Module boundaries (the layering rules)

1. **Controllers** only validate input + call services + map to HTTP responses. No business logic.
2. **Services** own a single integration or domain (Apollo, Gemini, screening, usage, tracking, settings). Services may compose other services.
3. **Repositories** wrap Prisma. Every query takes `userId` so tenant isolation is impossible to forget.
4. **Middleware** is cross-cutting only: auth, CORS, logging, error mapping. Never branches on business rules.
5. **Frontend** never holds any backend secrets. Only `VITE_API_BASE_URL` is exposed (empty = same-origin).

## 7. Front-end layout

```
Header (sticky)            User chip · Usage chip · Admin button · Logout
       │
Left nav (vertical tabs)   Campaigns list  /  Admin sections
       │
Main content               SectionCard stack:
                             • Campaign header (Add from LinkedIn / Source /
                               Edit Spec / Delete / Export)
                             • Spec card · Stats card · Screening summary
                             • Apollo Search progress + Load more
                             • Candidate table (Approved Queue / Below / All)
                               with expandable rows showing contact details
                               and Enrich / Send Outreach / Mark Replied
                             • Smart Alerts panel · Channel mix card
```

Toast notifications top-right for all async events. Modals always center.

## 8. Environment variables (production)

All loaded from Secret Manager except boolean/numeric tuning knobs which are set on the Cloud Run service.

| Var | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Secret Manager | Cloud SQL Unix-socket URL: `postgresql://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE` |
| `JWT_SECRET` | Secret Manager | 48-byte random (set by setup script) |
| `JWT_EXPIRES_IN` | env var | `7d` |
| `GEMINI_API_KEY` | Secret Manager | Google AI Studio key |
| `APOLLO_API_KEY` | Secret Manager | scoped to `people/match` |
| `APOLLO_PEOPLE_SEARCH_KEY` | Secret Manager | scoped to `mixed_people/api_search` |
| `APOLLO_BULK_MATCH_KEY` | Secret Manager | scoped to `people/bulk_match` |
| `APOLLO_ORG_SEARCH_KEY` | Secret Manager | scoped to `organizations/search` |
| `APOLLO_ORG_ENRICH_KEY` | Secret Manager | scoped to `organizations/enrich` |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Secret Manager (or unset for simulation) | Outreach delivery |
| `CORS_ORIGIN` | Secret Manager | Comma-separated allow-list; should include the Cloud Run URL |
| `ALERT_THRESHOLD_HOURS` | env var | `48` |
| `NODE_ENV` | env var | `production` |
| `PORT` | injected by Cloud Run | `8080` |

## 9. CI/CD lifecycle

```
git push origin main
   │
   ├── (manual) ./scripts/gcp-deploy.sh PROJECT
   │       └── gcloud builds submit --config cloudbuild.yaml
   │             ├── docker build → image
   │             ├── docker push → Artifact Registry
   │             └── gcloud run deploy → Cloud Run service
   │                   └── On cold-start: `prisma migrate deploy` then `node dist/server.cjs`
   │
   └── (future) GitHub Actions on push to main → same gcloud builds submit
```

## 10. Operational runbook

| Symptom | First diagnostic | Fix |
|---|---|---|
| Sourcing returns 0 | Check Apollo dashboard credit balance + check log for 403 | Refresh API keys / upgrade plan |
| Phone fields all empty | Expected — phone reveal needs a webhook URL (not wired) | See SPEC §5 row 4 |
| Outreach "simulated" toast | Check `SMTP_*` secrets present in Secret Manager | `gcloud secrets versions add SMTP_HOST --data-file=- < ...` |
| Admin sees 403 on `/api/admin/*` | User role is not ADMIN | `npx tsx backend/scripts/setAdmin.ts <email>` (on a host with DB access) |
| Migrations didn't run on deploy | Check Cloud Run logs for "prisma migrate deploy" | Manual: `gcloud sql connect ... ; psql -f migration.sql` or run from a local connector |
| Daily usage cap hit | Admin Settings tab → `daily_free_limit` | Increase value; takes effect immediately |
| Candidate duplicates appearing | Should be impossible (DB unique constraint) | If they appear, check that constraint exists: `\d "Candidate"` shows `Candidate_campaignId_name_key` |

## 11. Security model

- Secrets never appear in frontend bundle or git history (root-`.env` is gitignored; Secret Manager in prod)
- JWT carries `userId + email + role`; freshness is checked DB-side on every protected request (so block/role-change is instant)
- Bcrypt 12-round password hashing
- CORS is allow-list, not `*`; Bearer tokens travel in `Authorization` header (not cookies → no CSRF surface)
- DB queries are all parameterised via Prisma — no SQL injection vectors
- Each Candidate row carries the owning `userId` indirectly via `campaignId.userId`; every repo method enforces it
