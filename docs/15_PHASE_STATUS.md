# 15 — Phase Status  📍 LIVE STATUS — CHECK THIS FIRST

> **This is the first file an AI assistant should read each session** (right after [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md)). It is the single source of truth for *where the project is right now*. **Keep it updated** — when you finish work, edit this file before you finish your turn.

---

**Last updated:** 2026-07-02
**Current phase:** **Phase 0 — Repository Foundation & AI-Readiness**
**Release line:** V2 (`v2` branch exists on origin)
**Working branch for this effort:** `phase-0/repo-foundation`

---

## Current Phase — Phase 0

**Objective:** Make the repository self-documenting and clean so AI assistants can work with minimal re-explanation. **No features, no redesign, no new Three.js, no new animations.**

Full plan: [`07_ROADMAP.md`](./07_ROADMAP.md).

---

## Completed Work ✅

- **Full architecture audit** — backend (`apps/api`) and frontend (`apps/web`) audited in depth (modules, endpoints, schema, components, deps, dead code, security gaps).
- **Documentation set `/docs/00–20`** authored and grounded in the audit + [`MASTERPLAN.md`](./MASTERPLAN.md).
- **Safe cleanup done + verified** — removed dead code (`MapViewer`, `wander-demo.html`) and 15 unused deps (5 FE + 10 BE, plus type packages) without changing functionality. Verified: FE type-check ✓ / 40 tests ✓ / build ✓; BE build ✓ / 53 tests ✓. See [`20_CHANGELOG.md`](./20_CHANGELOG.md).
- **App confirmed running locally** — frontend dev server boots (Next.js on :3000). Backend compiles + unit tests pass; running it needs Postgres + Redis (via `infra/docker-compose.yml` or native installs).

---

## In Progress 🔄

- **Final Phase 0 audit report + health scores** (last remaining Phase 0 deliverable).

---

## Blocked ⛔

- **Backend not runnable in the current sandbox** — no Docker/Postgres/Redis installed locally. Not a code blocker; use `infra/docker-compose.yml` or install natively (see `QUICKSTART.md`, but note it's partially stale — trust [`02_ARCHITECTURE.md`](./02_ARCHITECTURE.md)/[`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md)).
- **Real external services not configured** (Clerk, S3, OpenAI, Stripe, Mapbox) — expected in Phase 0; needed to exercise full flows in later phases.

---

## Next Tasks ⏭️

**To finish Phase 0:**
1. Complete safe cleanup (dead files + unused deps); verify build/lint/tests still pass.
2. Publish the Phase 0 audit report with scores + Phase 1 recommendations.
3. Commit the documentation + cleanup on `phase-0/repo-foundation`; open PR into `main`/`v2`.

**Do NOT start Phase 1 until Phase 0 is signed off.**

**When Phase 1 begins** (see [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md)), the first tickets are the P0/P1 correctness & security fixes:
- WV-101 (secure/remove unguarded `auth/sync`)
- WV-102 (access check in `duplicateTrip`)
- WV-103 (stop masking DB errors as 409)
- WV-104 (make env validation real)
- WV-105 (consolidate frontend API client)

---

## Future Phases (summary)

| Phase | Theme | Status |
|---|---|---|
| **0** | Repo foundation & AI-readiness | 🔄 current |
| 1 | Stabilization & debt paydown | ⏭ next |
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
