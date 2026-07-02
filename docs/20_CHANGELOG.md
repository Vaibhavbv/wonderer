# 20 — Changelog

> Human-readable log of notable changes, milestones, and important commits. Format loosely follows [Keep a Changelog](https://keepachangelog.com/) + SemVer ([`14_GIT_WORKFLOW.md`](./14_GIT_WORKFLOW.md)). **Newest first.** Add an entry for every meaningful change; keep [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) in sync.

Categories: **Added · Changed · Fixed · Removed · Deprecated · Security · Docs.**

---

## [Unreleased] — Phase 0: Repository Foundation (V2 line)

### Docs
- **Added the numbered AI-readiness documentation set `docs/01–20`** — overview, architecture, codebase guide, coding standards, AI context, product bible, roadmap, engineering backlog, folder structure, component registry, API reference, database schema, dependency guide, git workflow, phase status, decisions log, tech debt, performance guide, prompt guide, changelog. Plus `docs/00_README.md` index. (ADR-009)
- Documentation is **audited against the code** — reflects the real "modeled vs built" gap, security gaps, and duplication surfaced in the Phase 0 audit.
- Preserved existing strategic docs (`MASTERPLAN`, `PRD`, `ARCHITECTURE`, `API_DESIGN`, `DESIGN_SYSTEM`, `MONETIZATION`, `ROADMAP`) as source material.

### Changed
- Established `phase-0/repo-foundation` working branch off `main` for the V2 foundation effort.

### Removed / Cleanup (Phase 0, non-functional only — verified: build + tests green on both apps)
- **Dead frontend code:** `apps/web/components/map/map-viewer.tsx` (imported nowhere; the app renders geography with R3F globes) + its now-empty `components/map/` folder; `apps/web/public/wander-demo.html` (607-line legacy vanilla prototype, superseded by the real journey).
- **Unused frontend dependencies:** `gsap`, `zustand`, `@mapbox/mapbox-gl-draw`, `mapbox-gl`, `@types/mapbox-gl` (5 removed). Moved `@types/three` from `dependencies` → `devDependencies`. *(Kept `@stripe/*` — unused now but planned for Phase 6 payments.)*
- **Unused backend dependencies:** `@nestjs/axios`, `@nestjs/jwt`, `@nestjs/mapped-types`, `@nestjs/passport`, `passport`, `passport-jwt`, `joi`, `zod`, `ms`, `mapbox-gl` (10 removed) + orphaned types `@types/ms`, `@types/passport-jwt`. *(Kept `stripe`/`svix`/`sharp` and the websocket/schedule/throttler/event-emitter packages — unused now but tied to planned phases; see WV-109.)*
- **Docs:** added a deprecation banner to `QUICKSTART.md` pointing to the numbered docs and correcting stale claims (GSAP/Mapbox/WanderView).
- **Verification:** frontend `type-check` ✓, 40 tests ✓, production `build` ✓; backend `nest build` ✓, 53 tests ✓. No functionality changed.
- **Not done in Phase 0 (deferred by design):** dead-schema removal (needs migrations — WV-109), security/correctness fixes (Phase 1 — WV-101..104), `postprocessing` promotion to a direct dep (WV-111), duplication consolidation (WV-105/106).

> Phase 0 is intentionally **non-functional**: no features, no redesign, no security fixes (those are Phase 1), no dead-schema removal (needs migrations — WV-109). See ADR-010.

---

## Baseline — pre-Phase-0 (reconstructed from `git log`)

The state the repository was in when Phase 0 began. Selected notable commits (newest first):

### Added / Changed (features already shipped)
- Cinematic 3D journey: globe fly-through, travel vehicle, smooth scroll `(#17)`
- Relevant nav links, centered route path, clickable destination cards `(#16)`
- Promote cinematic journey experience to homepage `(#15)`
- Theme-adaptive multi-destination trip creation `(#8)`
- Cinematic scroll-journey experience at `/journey` `(#7)`
- Reworked landing sections to the travel-social brand `(#6)`
- Redesigned hero to bright-editorial brand `(#5)`
- Discover/profile pages `(#2)`
- Identity/social layer: profiles, follow graph, feed, discover
- Locked product vision: Wanderverse as a travel-life social network (`MASTERPLAN.md`)

### Fixed
- Clerk auth guard rejecting all valid tokens `(#14)`
- CORS rejecting all cross-origin requests in production `(#13)`
- Render build failures / deploy workflow `(#12, #10, #9, #4, #3)`
- Malformed error codes `(#2)`
- Clerk middleware resilient when secret key absent
- Lazily instantiate OpenAI client so the API boots without a key

### Known state at baseline (see [`17_TECH_DEBT.md`](./17_TECH_DEBT.md))
- 4 empty stub modules (payments, webhooks, analytics, exports); several placeholder implementations; ~6 dead schema models; multiple unused dependencies; duplication in the frontend API layer and backend pagination; a handful of correctness/security gaps (unguarded `auth/sync`, `duplicateTrip` access, no-op env validation).

---

## How to add an entry
Under **[Unreleased]**, add a bullet under the right category with the change and any ticket id:
```
### Fixed
- Enforce access control in duplicateTrip so private trips can't be duplicated by others (WV-102).
```
On release, rename **[Unreleased]** to the version + date and start a fresh Unreleased section.

---

## Milestones
- **Phase 0 complete** — _pending_ (docs + cleanup + audit report).
- Phase 1 (stabilization) — _not started_.

See [`07_ROADMAP.md`](./07_ROADMAP.md) for the full milestone plan.
