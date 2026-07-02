# 15 — Phase Status  📍 LIVE STATUS — CHECK THIS FIRST

> **This is the first file an AI assistant should read each session** (right after [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md)). It is the single source of truth for *where the project is right now*. **Keep it updated** — when you finish work, edit this file before you finish your turn.

---

**Last updated:** 2026-07-03
**Current phase:** **Phase 0 — Repository Foundation & AI-Readiness — ✅ COMPLETE (final verification passed)**
**Release line:** V2 (`v2` branch exists on origin)
**Working branch for this effort:** `phase-0/repo-foundation`
**Completion report:** [`PHASE_0_COMPLETION_REPORT.md`](./PHASE_0_COMPLETION_REPORT.md)

---

## Current Phase — Phase 0

**Objective:** Make the repository self-documenting and clean so AI assistants can work with minimal re-explanation. **No features, no redesign, no new Three.js, no new animations.**

Full plan: [`07_ROADMAP.md`](./07_ROADMAP.md).

---

## Completed Work ✅

- **Full architecture audit** — backend (`apps/api`) and frontend (`apps/web`) audited in depth (modules, endpoints, schema, components, deps, dead code, security gaps).
- **Documentation set `/docs/00–20`** authored and grounded in the audit + [`MASTERPLAN.md`](./MASTERPLAN.md).
- **Safe cleanup done + verified** — removed dead code (`MapViewer`, `wander-demo.html`) and 15 unused deps (5 FE + 10 BE, plus type packages) without changing functionality.
- **Final Phase 0 audit report + health scores** published: [`PHASE_0_AUDIT_REPORT.md`](./PHASE_0_AUDIT_REPORT.md).
- **Production-readiness hardening pass (this session)** — resolved the explicitly-identified backend correctness/security gaps, **no UI, no features, no redesign, no refactor of unrelated working code**:
  - **WV-101** — `POST /v1/auth/sync` is now guarded (`ClerkAuthGuard`); the `clerkId` it upserts is taken from the verified JWT (`@CurrentUser('clerkId')`), never from the request body, so a caller can no longer overwrite another user's profile. `clerkId` removed from `SyncUserDto` (dead/dangerous field).
  - **WV-102** — `TripsService.duplicateTrip` now calls the existing `getAccessibleTrip` check before cloning, so a private trip can no longer be duplicated by a non-owner.
  - **WV-103** — the three broad `catch { throw ConflictException }` blocks (`trips.likeTrip`, `comments.like`, `social.follow`) now check `Prisma.PrismaClientKnownRequestError` + `code === 'P2002'` specifically; any other DB error propagates instead of being misreported as a 409. Updated the 3 existing spec tests (which had been asserting the old, incorrect masking behavior with a generic `Error`) to use a real `P2002` error, and added 3 new tests proving non-conflict errors are no longer swallowed.
  - **WV-104** — `env.validation.ts` rewritten: `validate()` now actually runs `class-validator` (`plainToInstance` + `validateSync`) against a flat `EnvironmentVariables` class matching the real env vars in use. Missing required vars (`DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`) now throw a clear error at boot instead of failing lazily later. Smoke-tested directly against the compiled output.
  - **WV-108** — added `stories.dto.ts` (`UpdateStoryDto`: `template?`, `theme?`, `blocks`) and replaced the untyped `dto: any` on `PUT /v1/trips/:tripId/story` — the last `any` in the codebase's mutation surface is gone.
  - **WV-901** — `ThrottlerGuard` is now applied globally via `APP_GUARD` in `app.module.ts`, so the already-configured rate limits ('short' 100/min, 'long' 1000/hr) are actually enforced. Health/readiness probes (`AppController`) are exempted with `@SkipThrottle()` so infra monitoring isn't rate-limited.
  - **Verified:** backend `nest build` ✓, **56/56** backend tests ✓ (53 existing + 3 new), frontend 40/40 tests ✓ (unaffected, sanity-checked). No functionality changed beyond the fixes themselves.
- **App confirmed running locally** — frontend dev server boots (Next.js on :3000). Backend compiles + unit tests pass; running it needs Postgres + Redis (via `infra/docker-compose.yml` or native installs).
- **Final Phase 0 verification (session 3)** — full re-verification pass:
  - Backend `nest build` ✓ · 56/56 tests ✓. Frontend `type-check` ✓ · 40/40 tests ✓ · production `build` ✓ (all routes compile).
  - All 6 hardening fixes confirmed present in committed code (grep-verified: guard on `auth/sync`, `getAccessibleTrip` in `duplicateTrip`, `P2002` checks ×3, `plainToInstance`+`validateSync`, `UpdateStoryDto`, global `ThrottlerGuard` + `@SkipThrottle` on health).
  - Cleanup completeness confirmed: `MapViewer`/`components/map/`/`wander-demo.html` gone; zero removed deps lingering in either `package.json`.
  - Folder structure matches [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) exactly (18 backend modules, 10 frontend component groups).
  - **Fixed the one blocking issue found:** documentation internal inconsistency — `05_AI_CONTEXT`, `17_TECH_DEBT`, `11_API_REFERENCE`, `02_ARCHITECTURE`, `03_CODEBASE_GUIDE`, `04_CODING_STANDARDS`, `07_ROADMAP`, `08_ENGINEERING_BACKLOG`, `09_FOLDER_STRUCTURE`, `10_COMPONENT_REGISTRY`, `13_DEPENDENCY_GUIDE` still described WV-101/102/103/104/108/901 (and the removed dead code/deps) as *open*, contradicting the code and this file. All reconciled to resolved status; `PHASE_0_AUDIT_REPORT.md` marked as a superseded historical snapshot. No source code changed.
- **Phase 0 Completion Report** published: [`PHASE_0_COMPLETION_REPORT.md`](./PHASE_0_COMPLETION_REPORT.md).

---

## In Progress 🔄

None — **Phase 0 is COMPLETE and verified.** Awaiting explicit Phase 1 kickoff from the user.

---

## Blocked ⛔

- **Backend not runnable end-to-end in the current sandbox** — no Docker/Postgres/Redis installed locally. Not a code blocker; use `infra/docker-compose.yml` or install natively (see `QUICKSTART.md`, but note it's partially stale — trust [`02_ARCHITECTURE.md`](./02_ARCHITECTURE.md)/[`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md)).
- **Real external services not configured** (Clerk, S3, OpenAI, Stripe, Mapbox) — expected in Phase 0; needed to exercise full flows in later phases.

---

## Next Tasks ⏭️

**Phase 0 is COMPLETE — nothing remains in scope.** The only step left is outside the repo:
1. Human review/merge of `phase-0/repo-foundation` into `main`/`v2`.

**Do NOT start Phase 1 until the user explicitly says so.**

**When Phase 1 begins**, the opening tickets are (see [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md)):
- WV-105 (consolidate frontend API client)
- WV-106 (shared backend pagination/sort utilities)
- WV-107 (S3 object deletion on media delete)
- WV-109 (decide keep/remove for empty stub modules & dead schema — needs a product decision + migrations)
- WV-111 (promote `postprocessing` to a direct dependency)

---

## Future Phases (summary)

| Phase | Theme | Status |
|---|---|---|
| **0** | Repo foundation & AI-readiness | ✅ **complete** |
| 1 | Stabilization & debt paydown | ⏭ next (awaiting kickoff) |
| 2 | Identity layer polish (profiles/feed/webhook sync) | planned |
| 3 | Signature profile map (growing route + replay + passport) | planned |
| 4 | Viral loop (reshare + Save to Bucket List) | planned |
| 5 | The hook: Trip Recap video export | planned |
| 6 | Monetization (Stripe freemium) | planned |
| 7 | Content depth (Moments, Stories, story builder) | planned |
| 8 | AI depth (captions/translate/narrate/enhance) | planned |
| 9 | Scale, performance & observability | planned |
| 10 | Ecosystem & platform (imports, API, challenges) | planned |

Detail: [`07_ROADMAP.md`](./07_ROADMAP.md).

---

## Snapshot: what works vs. what's scaffolding (as of last update)

**Works end-to-end:** auth (Clerk), profiles, trip CRUD + duplicate + like, image upload (S3), dashboard, social graph (follow/feed/discover), comments, notifications, the Wander View (real + demo), AI story/title generation.

**Empty stubs / placeholders (DON'T assume these work):** payments, webhooks, analytics, exports (empty modules); Mapbox geocoding, AI photo-enhance, media `/process` (placeholders); dead schema (`Session`, `Invoice`, `Export`, `UserActivity`, `MapTileCache`, `Challenge`, `ChallengeEntry`).

Full detail: [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md) → "MODELED ≠ BUILT", and [`17_TECH_DEBT.md`](./17_TECH_DEBT.md).

---

### How to update this file
When you finish a unit of work: move items between **Completed / In Progress / Next**, bump **Last updated**, and add a line to [`20_CHANGELOG.md`](./20_CHANGELOG.md). If you changed scope or made an architectural call, also log it in [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).
