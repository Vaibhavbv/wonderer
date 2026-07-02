# Wanderverse — Phase 0 Audit Report

**Date:** 2026-07-02 · **Scope:** repository foundation & AI-readiness (no features) · **Branch:** `phase-0/repo-foundation`

This is the capstone deliverable for Phase 0. It summarizes the architecture audit, the cleanup performed, five health scores, and the recommendations to complete before Phase 1. Detail lives in the numbered `/docs` set — see [`00_README.md`](./00_README.md).

---

## 1. Architecture Audit

**What Wanderverse is:** a two-app monorepo — Next.js 15 frontend (`apps/web`) + NestJS 10 backend (`apps/api`) — for a travel-social product ("Instagram for your travel life"), with a signature WebGL scroll-journey experience. Auth via Clerk; data in PostgreSQL (Prisma); media in S3; async AI via BullMQ→OpenAI. Full detail: [`02_ARCHITECTURE.md`](./02_ARCHITECTURE.md).

**Strengths**
- **Clean, conventional structure.** NestJS domain-per-module; Next.js App Router with server-first data fetching. Easy to navigate.
- **Uniform API contract.** Global response envelope (`{success,data,meta,error}`) + validation pipe + URI versioning + Swagger. Predictable and self-documenting.
- **Stateless, delegated auth.** Clerk JWT verified per request; users auto-provisioned. Simple and scalable.
- **Genuinely impressive signature feature.** The R3F journey (`journey-scene.tsx`) is production-quality, with a `coarse` perf mode and a real reduced-motion fallback.
- **Real end-to-end flows.** Trip CRUD, S3 upload, social graph, comments, notifications, AI story/title generation all work top-to-bottom.
- **Tests exist** on the highest-risk logic (backend services, frontend optimistic UI + API wrappers): 53 backend + 40 frontend, all passing.

**Core finding — "Modeled ≠ Built."** The schema/enums/dependencies describe a *much* larger product than is implemented:
- **4 empty stub modules** registered as if functional: `payments`, `webhooks`, `analytics`, `exports`.
- **Placeholders returning fake/empty data:** Mapbox geocoding (`[]`), AI photo-enhance, media `/process`, static map styles.
- **~6 dead schema models:** `Session`, `Invoice`, `Export`, `UserActivity`, `MapTileCache`, `Challenge`/`ChallengeEntry`.
- **~15 unused dependencies** across the two apps.

**Correctness/security gaps (few but real):** unguarded `POST /v1/auth/sync` (profile tampering); `duplicateTrip` missing an access check; broad `catch` blocks masking DB errors as 409s; `env.validation.ts` `validate()` that never validates; no Clerk webhook sync. All catalogued with fixes in [`17_TECH_DEBT.md`](./17_TECH_DEBT.md).

**Maintainability drag (mechanical):** duplicated frontend API helpers (4×) + one ad-hoc `fetch`; hand-rolled pagination in 5 services; two near-identical navbars; duplicated `toVector3` and media-URL logic; a transitive `postprocessing` import; a dead `RedisModule` plus three configured-but-inert Nest modules (throttling not actually enforced).

**Verdict:** a **solid, well-organized foundation with a standout feature**, carrying moderate, well-contained debt — mostly intentional scaffolding and easy-to-fix duplication, with a short list of specific correctness fixes.

---

## 2. Cleanup Summary (Phase 0 — non-functional, verified)

**Dead code removed**
- `apps/web/components/map/map-viewer.tsx` (+ its empty `map/` folder) — imported nowhere; app uses R3F globes.
- `apps/web/public/wander-demo.html` — 607-line legacy vanilla prototype, superseded by the real journey.

**Unused dependencies removed**
- **Frontend (5):** `gsap`, `zustand`, `@mapbox/mapbox-gl-draw`, `mapbox-gl`, `@types/mapbox-gl`. Moved `@types/three` → `devDependencies`.
- **Backend (10 + 2 types):** `@nestjs/axios`, `@nestjs/jwt`, `@nestjs/mapped-types`, `@nestjs/passport`, `passport`, `passport-jwt`, `joi`, `zod`, `ms`, `mapbox-gl`, plus `@types/ms`, `@types/passport-jwt`.
- **Kept deliberately** (unused now, tied to planned phases): `@stripe/*` (FE), `stripe`/`svix`/`sharp` + websocket/schedule/throttler/event-emitter (BE). See [`13_DEPENDENCY_GUIDE.md`](./13_DEPENDENCY_GUIDE.md).

**Docs**
- Added the numbered `/docs/00–20` set (audited against the code).
- Added a deprecation banner to `QUICKSTART.md` correcting stale claims (GSAP/Mapbox/WanderView) and pointing to the new docs.

**Verification (all green):** FE `type-check` ✓ · FE 40 tests ✓ · FE production `build` ✓ · BE `nest build` ✓ · BE 53 tests ✓. **Zero functionality changed.**

**Deferred by design (ADR-010):** dead-schema removal (needs migrations — WV-109); security/correctness fixes (Phase 1 — WV-101..104); duplication consolidation (WV-105/106); `postprocessing` promotion (WV-111).

---

## 3–7. Scores

Scored 0–100 against a "ready to scale with AI-assisted development" bar. Scores reflect the **post-cleanup** state.

| # | Dimension | Score | Grade |
|---|---|---|---|
| 3 | **Repository Health** | **78 / 100** | B+ |
| 4 | **Technical Debt** (higher = less debt) | **72 / 100** | B |
| 5 | **Scalability** | **68 / 100** | B− |
| 6 | **Maintainability** | **80 / 100** | B+ |
| 7 | **Production Readiness** | **55 / 100** | C+ |

### 3. Repository Health — 78 (B+)
Clean structure, consistent conventions, tests on risky paths, and now **comprehensive documentation** and **no dead deps/files**. Held back by the modeled-vs-built gap and a handful of correctness gaps. *Was ~68 pre-Phase-0; docs + cleanup lifted it.*

### 4. Technical Debt — 72 (B)
Debt is **moderate and well-contained**: only ~9 correctness/security items (each small and specific), the rest is mechanical duplication or intentional roadmap scaffolding. Fully catalogued and ticketed ([`17_TECH_DEBT.md`](./17_TECH_DEBT.md), [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md)) — known debt is far better than hidden debt.

### 5. Scalability — 68 (B−)
Good bones: stateless auth, server-first fetching, cursor pagination, `select`-scoped queries, browser-direct S3 upload, async job queue, WebGL perf mode. Ceilings: in-process worker (competes with API), no image variants/CDN, `MapTileCache`/analytics unbuilt, **rate limiting configured but not enforced**, denormalized-counter drift risk. Architecture *can* scale; the operational pieces aren't wired yet (Phase 9).

### 6. Maintainability — 80 (B+)
The strongest dimension: predictable layout, uniform contracts, low comment-noise, strict TypeScript, tests where they matter, and now an AI-first doc set that makes onboarding near-instant. Main drags are duplication (easy, ticketed) and one `any` in the stories DTO.

### 7. Production Readiness — 55 (C+)
The gating dimension. Blockers: unenforced rate limiting; specific security gaps (unguarded `auth/sync`, `duplicateTrip` access); no-op env validation (fail-fast missing); no webhook sync; S3 object leak on delete; no observability/metrics; external services unconfigured; empty billing/exports. None are architectural — they're a concrete, short Phase-1 checklist. The signature UX and core flows are production-*quality*; the surrounding hardening is not production-*ready*.

**Overall (weighted): ~72/100 — B.** A strong foundation, safe for AI-assisted development, with a clear and finite path to production.

---

## 8. Recommendations before Phase 1

**Prerequisite (do first):**
1. Review & merge this Phase 0 branch (`phase-0/repo-foundation`) into `main`/`v2`.
2. Add the [`19_PROMPT_GUIDE.md`](./19_PROMPT_GUIDE.md) seed to a root `CLAUDE.md`/`.cursorrules` so every AI session auto-reads [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md) + [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md).
3. Stand up the backend locally (Docker `infra/docker-compose.yml`) and configure real Clerk/S3/OpenAI keys so full flows can be exercised.

**Phase 1 opening tickets (fix before building new features):**
| Priority | Ticket | Why |
|---|---|---|
| 🔴 P0 | **WV-101** secure/remove unguarded `auth/sync` | account-data tampering |
| 🔴 P0 | **WV-102** access check in `duplicateTrip` | private-data leak |
| 🟠 P1 | **WV-103** stop masking DB errors as 409 | hidden failures |
| 🟠 P1 | **WV-104** make env validation real (fail-fast) | silent misconfiguration |
| 🟠 P1 | **WV-105** consolidate the frontend API client | kills the worst duplication |
| 🟡 P2 | **WV-109** decide keep/remove for stub modules & dead schema | resolves modeled-vs-built drift |
| 🟡 P2 | **WV-901** enforce rate limiting | protects the API at scale |

**Guardrails going forward**
- Keep the docs current — especially [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md), [`20_CHANGELOG.md`](./20_CHANGELOG.md), [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).
- No new debt without a `WV-###` ticket. Reuse before writing (duplication is the top maintainability risk).
- Protect the contract (envelope + auth) and the brand/motion ([`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md)).
- Verify a capability is real before building on it (modeled ≠ built).

**Do NOT proceed into Phase 1 work in this pass — Phase 0 stops here.**
