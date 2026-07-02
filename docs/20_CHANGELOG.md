# 20 — Changelog

> Human-readable log of notable changes, milestones, and important commits. Format loosely follows [Keep a Changelog](https://keepachangelog.com/) + SemVer ([`14_GIT_WORKFLOW.md`](./14_GIT_WORKFLOW.md)). **Newest first.** Add an entry for every meaningful change; keep [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) in sync.

Categories: **Added · Changed · Fixed · Removed · Deprecated · Security · Docs.**

---

## [Unreleased] — Phase 0: Repository Foundation (V2 line)

### Final Verification & Doc Reconciliation (Phase 0, session 3 — 2026-07-03) — **PHASE 0 COMPLETE ✅**

Final verification pass across all Phase 0 deliverables:

- **Verified (all green):** backend `nest build` ✓ + 56/56 tests ✓; frontend `type-check` ✓ + 40/40 tests ✓ + production `build` ✓ (all routes). All 6 hardening fixes grep-confirmed in committed code. Cleanup completeness confirmed (dead files gone, no removed deps lingering). Folder structure matches [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) exactly. Working tree clean on `phase-0/repo-foundation`.
- **Fixed (the one blocking issue found — Docs):** internal documentation inconsistency. Eleven live reference docs (`02`, `03`, `04`, `05`, `07`, `08`, `09`, `10`, `11`, `13`, `17`) still described WV-101/102/103/104/108/901, the removed `MapViewer`/`wander-demo.html`, and the removed dependencies as *open issues*, contradicting the code and `15_PHASE_STATUS.md`. All reconciled with explicit "✅ resolved (Phase 0)" status markers; original problem descriptions preserved via strikethrough for context. `PHASE_0_AUDIT_REPORT.md` given a "superseded historical snapshot" banner. **No source code changed this session.** See ADR-015.
- **Added:** [`PHASE_0_COMPLETION_REPORT.md`](./PHASE_0_COMPLETION_REPORT.md) — the concise final report (accomplishments, current status, remaining debt, Phase 1 readiness).
- **Status:** Phase 0 marked **COMPLETE** in [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md). Phase 1 not started, awaiting explicit kickoff.

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

> The first cleanup pass was intentionally **non-functional**: no features, no redesign, no dead-schema removal (needs migrations — WV-109). See ADR-010. The correctness/security hardening originally deferred to "Phase 1" below was subsequently pulled forward into Phase 0 at the user's explicit direction — see the next section.

### Security & Correctness Hardening (Phase 0, session 2 — 2026-07-02)

Per explicit instruction, resolved the production-readiness issues already identified in [`PHASE_0_AUDIT_REPORT.md`](./PHASE_0_AUDIT_REPORT.md) and [`17_TECH_DEBT.md`](./17_TECH_DEBT.md). **No features, no UI changes, no redesign, no refactor of unrelated working code.**

#### Security
- **Fixed (WV-101):** `POST /v1/auth/sync` was unguarded and trusted a client-supplied `clerkId`, letting any caller overwrite any other user's `email`/`displayName`/`avatarUrl`. Now guarded by `ClerkAuthGuard`; `clerkId` is taken exclusively from the verified JWT via `@CurrentUser('clerkId')`. The `clerkId` field was removed from `SyncUserDto` (no caller ever sent it — confirmed by grep). See ADR-011.
- **Fixed (WV-102):** `TripsService.duplicateTrip` skipped access control, letting any authenticated user duplicate any other user's PRIVATE trip by id. Now calls the existing `getAccessibleTrip` check first, matching every other trip-scoped method in the service.

#### Error Handling
- **Fixed (WV-103):** `TripsService.likeTrip`, `CommentsService.like`, and `SocialService.follow` each had a broad `catch (e) { throw new ConflictException(...) }` that mislabeled *any* DB failure (e.g. a dropped connection) as "already liked/following." Each now checks `e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'` before converting to a 409; anything else now propagates as a real 500 instead of being hidden. See ADR-014 for why the 3 associated spec tests (which had encoded the old, incorrect behavior) were updated rather than left as-is.

#### Configuration
- **Fixed (WV-104):** `env.validation.ts`'s `validate()` declared a full `class-validator` schema but never actually ran it — a missing `DATABASE_URL` or `CLERK_SECRET_KEY` would not fail startup. Rewrote it around a flat `EnvironmentVariables` class (matching the env vars every `ConfigService.get()` call site actually reads) with real `plainToInstance` + `validateSync`. Required vars now throw a clear error at boot; every existing `.get(key, default)` fallback elsewhere is unaffected. See ADR-012. Directly smoke-tested against the compiled output (missing-required → throws with a clear message; valid config → passes with correct numeric coercion; unrelated keys pass through untouched).

#### API Input Validation
- **Fixed (WV-108):** `PUT /v1/trips/:tripId/story` accepted an untyped `dto: any` body, the only mutation endpoint in the codebase bypassing the global `ValidationPipe`'s whitelist. Added `stories.dto.ts` (`UpdateStoryDto`: `template?: string`, `theme?: Record<string, unknown>`, `blocks: unknown[]`) and typed both the controller and service. Required corresponding `Prisma.InputJsonValue` casts in `stories.service.ts` (matching the existing pattern in `trips.service.ts`) to satisfy Prisma's strict JSON input types.

#### Rate Limiting
- **Fixed (WV-901):** `ThrottlerModule` was configured (100 req/min, 1000 req/hr) but no guard was ever applied, so the limits had zero effect. `ThrottlerGuard` is now registered globally via `APP_GUARD` in `app.module.ts`. Added `@SkipThrottle()` to `AppController` so infra health/readiness polling (`/health`, `/ready`) is never throttled. See ADR-013.

#### Verification
- Backend: `nest build` ✓ · **56/56 tests ✓** (53 pre-existing + 3 new negative-case tests added for WV-103, see ADR-014).
- Frontend: 40/40 tests ✓ (untouched this session; re-run as a regression sanity check since none of these files were touched).
- No behavior changes beyond the specific fixes described above; no UI, feature, or redesign work performed, per explicit scope.

#### Explicitly out of scope this session (left for Phase 1 / a future pass)
- **WV-105** (consolidate the frontend `lib/*-api.ts` clients) — frontend/UI-adjacent code, deliberately not touched given the "do not touch the UI" instruction.
- **WV-109** (keep/remove decision for empty stub modules & dead Prisma schema) — requires a product decision and new migrations, not a mechanical fix.
- **WV-107** (S3 object deletion on media delete) — not named among the audit report's Phase-0-blocking recommendations; left for the general Phase 1 backlog.
- [`17_TECH_DEBT.md`](./17_TECH_DEBT.md), [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md), and [`PHASE_0_AUDIT_REPORT.md`](./PHASE_0_AUDIT_REPORT.md) were **not edited** this session (only `15_PHASE_STATUS.md`, `16_DECISIONS_LOG.md`, `20_CHANGELOG.md`, `00_SESSION_CONTEXT.md` were in scope) — they still describe WV-101/102/103/104/108/901 as open and should be refreshed to "resolved" in the next documentation pass.

### Re-audit: score comparison

Re-scored the same 5 dimensions from the original Phase 0 report, plus 2 new dimensions requested for this pass (Security, Code Quality — not separately scored before; baselines below are reconstructed from the original report's narrative for comparison purposes).

| Dimension | Before (this session) | After (this session) | Δ | Why |
|---|---|---|---|---|
| Repository Health | 78 | **85** | +7 | Two real security bugs and a no-op safety check closed; nothing else regressed. |
| Technical Debt (higher = less debt) | 72 | **80** | +8 | 5 of 9 items in the 🔴 Correctness & Security section of `17_TECH_DEBT.md` are now resolved (WV-101, 102, 103, 104, 108); rate limiting (🟠 #18) also resolved. |
| Scalability | 68 | **74** | +6 | Rate limiting is now actually enforced — previously the configured limits had zero effect, a real abuse-protection gap at scale. |
| Maintainability | 80 | **84** | +4 | The codebase's last remaining `any` (stories DTO) is gone; 3 duplicated broad-catch patterns replaced with a consistent, correct, shared pattern (check `P2002` specifically). |
| Production Readiness | 55 | **70** | +15 | The largest move — 4 of the 5 blockers named in the original report's Production Readiness paragraph are now fixed (unenforced rate limiting, unguarded `auth/sync`, `duplicateTrip` access, no-op env validation). Remaining gaps: S3 object leak on delete, no observability/metrics, empty billing/webhooks/exports modules, external services still unconfigured in this environment. |
| **Security** *(new)* | ~65 (reconstructed) | **82** | +17 | Both real authorization/authentication gaps in the codebase are closed (unguarded profile-overwrite endpoint, missing ownership check); abuse-rate protection now active; boot-time config validation prevents silently running with missing secrets. Remaining gaps are unbuilt features (no Clerk/Stripe webhook signature verification — because those modules don't exist yet), not defects in existing code. |
| **Code Quality** *(new)* | ~75 (reconstructed) | **85** | +10 | Zero `any` types remain in the backend's mutation surface; error-handling is now precise rather than overly broad in 3 places; test suite grew from 53→56 with the new cases directly covering the fixed behavior, not just the happy path. |
| **Overall (weighted)** | ~72 (B) | **~80 (B+)** | +8 | Foundation is now materially closer to production-ready; the remaining gap to "production ready" is observability, unbuilt payment/webhook/export features, and a few mechanical duplication items — none of which are defects, all of which are already tracked. |

**What concretely improved, in plain terms:** the two real security holes (anyone-can-overwrite-your-profile, anyone-can-duplicate-your-private-trip) are closed; a class of hidden-error bugs (real database failures reported as "already liked") is fixed everywhere it occurred; the app can no longer boot silently misconfigured; the last untyped request body is now validated; and the rate limits that were configured but never actually running are now protecting the API. Nothing about the product's behavior, UI, or features changed for a legitimate, well-formed request — only failure modes and edge cases got safer.

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
- **Phase 0 COMPLETE** — 2026-07-03 (docs + cleanup + audit report + security/correctness hardening + final verification & doc reconciliation). Awaiting human merge of `phase-0/repo-foundation` before Phase 1 opens.
- Phase 1 (stabilization) — _not started_.

See [`07_ROADMAP.md`](./07_ROADMAP.md) for the full milestone plan.
