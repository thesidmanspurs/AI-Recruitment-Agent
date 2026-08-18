# TalentScanr (AI Recruitment Agent) — Current Project Status & Architecture Guide

**Last Updated:** August 19, 2026  
**Document Purpose:** Comprehensive project status, architectural overview, and workflow guide for AI agents and developers continuing work on this codebase across different machines.

---

## 1. Project Overview & Live Environments

**TalentScanr** is an enterprise-grade AI Recruitment Platform offering two flagship engines:
1. **Outbound Sourcing Engine (`/home`)**: Automated talent discovery across LinkedIn, GitHub, and Reddit, with AI candidate scoring, profile enrichment, email reveal, and Gemini-crafted outreach drafting.
2. **Inbound CV Batch Ranking Engine (`/ranking`)**: Bulk upload of applicant resumes (PDF/DOCX, up to 50 CVs per batch) evaluated and scored (0–10) with Gold/Silver/Bronze medal leaderboards against structured Job Descriptions using Google Gemini AI.

### Live Deployments:
- **Production URL**: [https://talentscanr.com](https://talentscanr.com) / [https://ai-recruitment-agent-hxuvu2n4za-uc.a.run.app](https://ai-recruitment-agent-hxuvu2n4za-uc.a.run.app)
- **UAT Service**: [https://ai-recruitment-agent-uat-hxuvu2n4za-uc.a.run.app](https://ai-recruitment-agent-uat-hxuvu2n4za-uc.a.run.app)
- **GCP Project ID**: `ai-recruitment-agent-496914`
- **Region**: `us-central1`
- **Database**: Cloud SQL PostgreSQL (`ai-recruitment-agent-496914:us-central1:agent-db`)
- **Repository**: `thesidmanspurs/AI-Recruitment-Agent` (branches: `main`, `uat`)

---

## 2. Tech Stack & Standards

- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS (light theme standard), Lucide Icons.
  - **Language & Locale Standard**: 100% **British English** (e.g. *personalised*, *analysed*, *tailored*, *centre*, *favourited*).
  - **Theme**: Clean minimalist SaaS light theme (`#ffffff` / `#f8fafc` surfaces, `#0a0a0a` typography, subtle glassmorphism borders).
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL.
- **AI & Integrations**: Google Gemini AI (`@google/genai`), Stripe (Checkout & Customer Portal), Apify (LinkedIn/Reddit/GitHub scraping), SendGrid (outreach emails), Hunter.io (email enrichment), PDF-parse / Mammoth (document parsing).

---

## 3. Subscription Plans & Access Model

The platform uses a unified multi-plan system with add-ons defined in `backend/config/subscriptionPlans.ts`:

| Plan / Tier | Price | Plan Type | Quotas & Features |
| :--- | :--- | :--- | :--- |
| **Sourcing Plan** | $149 / mo | `SOURCING` | Sourcing workspace (`/home`), 2,000 monthly credits. Ranking locked behind Paywall. |
| **Ranking Plan** | $99 / mo | `RANKING` | Unlimited CV ranking sessions, up to 50 CVs per batch. Sourcing locked behind Paywall. |
| **Pro Plan** | $229 / mo | `PRO` | Full access to BOTH Sourcing & Ranking workspaces, 2,000 credits/mo, up to 50 CVs/batch. |
| **Free Trial / Freemium** | $0 | `NONE` or `null` | Freemium sourcing (pay-per-reveal). Exactly **1 free Ranking trial session** with a maximum batch of **5 CVs**. |

### Add-on System:
- **CV Ranking Add-on** ($109/mo): Purchased by `SOURCING` users to unlock Ranking (`rankingAddonActive = true`).
- **AI Sourcing Add-on** ($159/mo): Purchased by `RANKING` users to unlock Sourcing (`sourcingAddonActive = true`).

### Feature Access Derivation (`deriveAccess` in `backend/config/subscriptionPlans.ts`):
- `hasSourceAccess`: True if `user.role === 'ADMIN'`, `planType` is `SOURCING` or `PRO`, `sourcingAddonActive === true`, or user is on freemium/no sub.
- `hasRankingAccess`: True if `user.role === 'ADMIN'`, `planType` is `RANKING` or `PRO`, or `rankingAddonActive === true`.
- **Important**: Any user with `planType === 'PRO'` or `planType === 'RANKING'` receives full access regardless of whether their Stripe `subscriptionStatus` is active or null (supports manual/admin grants).

---

## 4. Key Workflows & Business Logic

### A. Intent-Based Landing Page Routing (`/`)
1. **Unauthenticated Users**:
   - Clicking **"Source Candidates"** navigates to `/register?intent=sourcing`.
   - Clicking **"Rank Candidate CVs"** navigates to `/register?intent=ranking`.
2. **Registration & Google OAuth**:
   - Email/password register or Google OAuth callback passes `intent` through.
   - For new accounts: assigns `planType: 'RANKING'` for ranking intent and routes directly to `/ranking`; assigns `planType: 'SOURCING'` for sourcing intent and routes to `/home`.
3. **Existing Accounts**:
   - If an existing user has no plan assigned (`NONE`/null), logging in with an intent assigns them to that chosen plan.
   - If user already owns the matching plan, they enter directly.
   - If user owns a conflicting plan (e.g. owns `SOURCING` but clicked `RANKING`), they land on their designated workspace and the opposite workspace is guarded by the Paywall.

### B. Non-Dismissible Paywall (`FeaturePaywallModal.tsx`)
- When a user on one plan accesses the other feature without access:
  - On `/ranking` (for `SOURCING` users) or `/home` (for `RANKING` users), the paywall modal triggers **immediately on mount**.
  - `isForcedSwitch = true`: Dismissal via `(X)`, backdrop click, or `Escape` is disabled.
  - The modal provides two actions: **"Unlock Feature"** (opens Billing) or **"← Return to my Workspace"** (redirects back to their allowed mode).

### C. Trial Restrictions (1 Session / 5 CVs)
- Non-subscribed users can create exactly **1 free Ranking session** (`backend/middleware/requireRankingAccess.ts`). Attempting a 2nd session returns HTTP 403.
- In `backend/controllers/rankingController.ts`, batches exceeding **5 CVs** are rejected with HTTP 400 for trial users. Paid/Pro users can upload up to **50 CVs**.

### D. Paid Member Badges
- Displayed prominently in `WorkspaceSidebar.tsx` under the logo:
  - `✨ PRO MEMBER` (Gold / Amber)
  - `✨ SOURCING PLAN` (Amber)
  - `✨ RANKING PLAN` (Purple)

---

## 5. File & Directory Structure

```
├── backend/
│   ├── config/
│   │   ├── database.ts              # Prisma client initialization
│   │   ├── env.ts                   # Environment variables validation
│   │   └── subscriptionPlans.ts     # Source of truth for plans, pricing & deriveAccess()
│   ├── controllers/
│   │   ├── adminController.ts       # User management, analytics, manual credit grants
│   │   ├── authController.ts        # Register, login, logout, password reset
│   │   ├── googleAuthController.ts  # Google OAuth initiation & callback handling
│   │   ├── paymentsController.ts    # Stripe Checkout, balance, webhooks, portal
│   │   └── rankingController.ts     # CV parsing, batch ranking, session CRUD, 5-CV limit
│   ├── middleware/
│   │   ├── authenticate.ts          # JWT authentication from HttpOnly cookies
│   │   ├── requireRankingAccess.ts  # CV Ranking access guard & 1-session trial check
│   │   └── requireSourcingAccess.ts # Sourcing access guard
│   ├── routes/                      # Express route definitions
│   ├── services/
│   │   ├── auth/                    # authService.ts (Google sign-in, login, register)
│   │   ├── ranking/                 # rankingSessionService.ts, cvParserService.ts, geminiRankingService.ts
│   │   └── sourcing/                # candidateSourcingService.ts, enrichService.ts
│   └── prisma/schema.prisma         # Database models (User, Campaign, Candidate, RankingSession, RankedCandidate)
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # apiClient, authApi, rankingApi, paymentsApi, campaignApi
│   │   ├── components/
│   │   │   ├── layout/WorkspaceSidebar.tsx  # Sidebar, paid badges, mode switcher
│   │   │   ├── shared/FeaturePaywallModal.tsx # Non-dismissible paywall modal
│   │   │   └── ranking/             # CVUploadDropzone, RankedCandidateCard, etc.
│   │   ├── hooks/                   # useAuth, useCampaigns, useToast
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Sourcing workspace (/home)
│   │   │   ├── RankingPage.tsx      # CV Batch ranking workspace (/ranking)
│   │   │   ├── AuthPage.tsx         # Login, Register, Forgot Password with intent styling
│   │   │   ├── OnboardingPage.tsx   # Welcome goal selection screen (/welcome)
│   │   │   ├── BillingPage.tsx      # Stripe plans & add-ons manager (/billing)
│   │   │   └── marketing/           # LandingPage (/), PricingPage, FaqPage, PolicyPage
│   │   └── App.tsx                  # Root router, URL synchronization & intent management
│   └── index.html                   # HTML entry point with British English meta
```

---

## 6. How to Build, Test & Deploy

### Local Development:
```bash
# Backend (port 3000)
npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### TypeScript Validation:
```bash
# Check root & backend types
npx tsc --noEmit

# Check frontend types
cd frontend && npx tsc --noEmit
```

### Deployment to Google Cloud Run:
```powershell
# Deploy to Production (talentscanr.com)
powershell -ExecutionPolicy Bypass -File ./scripts/gcp-deploy.ps1 -ProjectId ai-recruitment-agent-496914

# Deploy to UAT
gcloud builds submit --config=cloudbuild.yaml --project=ai-recruitment-agent-496914 '--substitutions=_SERVICE=ai-recruitment-agent-uat,_CLOUDSQL_CONN=ai-recruitment-agent-496914:us-central1:agent-db,_IMAGE_TAG=uat-latest'
```

---

## 7. Current Status & Next Actions

- [x] Full British English localization and light theme UI completed across all pages.
- [x] CV Batch Ranking engine fully operational with Gemini 2.0 Flash scoring and DOCX/PDF parser.
- [x] 1-session trial and 5-CV batch limit enforced for non-paying users on both backend and frontend.
- [x] Non-dismissible Paywall modal with workspace return callback implemented.
- [x] Landing page (`/`) Hero action buttons routing seamlessly into Sourcing vs Ranking onboarding.
- [x] Multi-plan access derivation updated to recognize PRO and RANKING tiers without Stripe dependencies.
- [x] Production (`talentscanr.com`) and UAT deployed and synchronized.
