# 16 — Architectural Decisions Log (ADR)

> A running log of significant decisions: **what** was decided, **why**, the **tradeoffs**, and **future considerations**. Add a new entry (don't rewrite history) whenever you make a call that a future maintainer would otherwise have to reverse-engineer. Newest at the bottom.
>
> **Format per entry:** ID · Date · Status (Accepted/Superseded/Proposed) · Context · Decision · Tradeoffs · Future considerations.

Entries **ADR-000..ADR-008** are *reconstructed* from the audited codebase (they record decisions already embedded in the code, so future AI sessions understand the "why"). **ADR-009+** are decisions made from Phase 0 onward.

---

### ADR-000 — Monorepo with two independently-deployed apps, no root workspace
- **Date:** pre-Phase-0 (reconstructed) · **Status:** Accepted
- **Context:** A Next.js frontend and NestJS backend that deploy to different targets.
- **Decision:** Keep both under `apps/` but install/build/deploy each independently; no root `package.json`/workspace.
- **Tradeoffs:** ➖ no shared code package (types/DTOs are duplicated conceptually across the API boundary); ➖ two installs. ➕ simple, decoupled deploys; ➕ no monorepo tooling overhead.
- **Future:** If type-drift across the boundary becomes painful, introduce `packages/shared` + a workspace (needs a new ADR).

### ADR-001 — Clerk for auth; stateless JWT verification per request
- **Status:** Accepted (see commits fixing the guard/middleware)
- **Context:** Need auth without building identity infra.
- **Decision:** Delegate identity to Clerk; `ClerkAuthGuard` verifies the JWT on every request; **auto-provision** the DB user on first authenticated call.
- **Tradeoffs:** ➖ no server session store (the `Session` model went unused); ➖ no reactive sync of Clerk-side changes (no webhook yet); ➕ simple, stateless, scalable.
- **Future:** Add Clerk webhook sync (WV-201); remove or repurpose the `Session` model (WV-109).

### ADR-002 — Uniform response envelope + global pipes
- **Status:** Accepted
- **Context:** Want a consistent client contract.
- **Decision:** Global `TransformInterceptor` (`{success,data,meta,error}`) + `HttpExceptionFilter` (snake_case codes) + `ValidationPipe` + URI versioning (`/v1`).
- **Tradeoffs:** ➖ every consumer must `unwrap`; ➖ changing it is a breaking change across the whole app. ➕ predictable, self-documenting API.
- **Future:** Keep stable. Breaking changes → new API version (`/v2`), not envelope mutation.

### ADR-003 — Prisma + PostgreSQL, ambitious schema modeled up front
- **Status:** Accepted (with debt)
- **Context:** The founding PRD described a large product.
- **Decision:** Model most of the product's data up front (20 models), building services incrementally.
- **Tradeoffs:** ➖ significant **modeled-but-unused** schema drift (dead models/enums); ➕ migrations don't block feature work; ➕ clear data roadmap.
- **Future:** Per-item keep/remove decision (WV-109); this ADR is *why* the drift exists — it was intentional scaffolding, not neglect.

### ADR-004 — R3F/Three.js globe as the geography renderer (not Mapbox in the browser)
- **Status:** Accepted
- **Context:** The signature experience is a cinematic 3D journey.
- **Decision:** Render geography with React Three Fiber globes; the Mapbox browser SDK + `MapViewer` are unused.
- **Tradeoffs:** ➖ Mapbox deps became dead weight; ➖ no real 2D map today; ➕ a distinctive, on-brand experience.
- **Future:** Real geocoding (server-side, Mapbox REST) for accurate coordinates (WV-301); remove the browser Mapbox SDK + dead `MapViewer` (WV-110).

### ADR-005 — Framer Motion (+ R3F + Lenis) as the motion stack; GSAP dropped
- **Status:** Accepted
- **Context:** Early docs mentioned GSAP.
- **Decision:** Standardize on Framer Motion + raw R3F/`requestAnimationFrame` + Lenis; GSAP is unused.
- **Tradeoffs:** ➖ `gsap` is dead weight until removed; ➕ one coherent motion system.
- **Future:** Remove `gsap` (WV-110). Don't reintroduce a second animation lib without an ADR.

### ADR-006 — Local component state only; no Zustand/global store
- **Status:** Accepted
- **Context:** `zustand` was added but never used.
- **Decision:** Rely on server-fetched data + local `useState`/`useRef`; no global client store.
- **Tradeoffs:** ➖ cross-tree state must be threaded via props/URL; ➕ less complexity, fewer footguns.
- **Future:** Introduce a store only with a specific need + a new ADR; otherwise remove `zustand` (WV-110).

### ADR-007 — Browser-direct S3 upload via presigned URLs
- **Status:** Accepted
- **Context:** Large media shouldn't proxy through the API.
- **Decision:** API mints presigned `PUT` URLs; the browser uploads bytes directly to S3; metadata attached via `PATCH`.
- **Tradeoffs:** ➖ deletion/variant generation lag behind (S3 delete is a TODO; `variants` unused); ➕ scalable uploads, less API load.
- **Future:** Implement S3 delete (WV-107) and image variants with `sharp` (WV-902).

### ADR-008 — In-process BullMQ worker for AI jobs
- **Status:** Accepted
- **Context:** AI generation is slow/async.
- **Decision:** Queue jobs on BullMQ (Redis) and run the `AiProcessor` worker **in the same Node process** as the API. BullMQ's Redis connection is configured directly in `app.module` (duplicating the unused `RedisModule`).
- **Tradeoffs:** ➖ worker and API scale together; ➖ Redis config duplication; ➕ single deployable, simple ops.
- **Future:** Split the worker for scale (WV-903); unify Redis config; fix/remove the dead `RedisModule`.

---

## Phase 0+ decisions

### ADR-009 — Adopt a numbered `/docs` set as the canonical, AI-first documentation
- **Date:** 2026-07-02 · **Status:** Accepted
- **Context:** AI assistants repeatedly needed the project re-explained; existing docs (`MASTERPLAN`, `PRD`, etc.) captured *product intent* but not *current code state*, and some were stale (`QUICKSTART`).
- **Decision:** Create `docs/01–20` as the operational source of truth, audited against the code. Preserve the ALL-CAPS strategic docs as source material. Precedence: **product intent → MASTERPLAN wins; current code state → numbered docs win.**
- **Tradeoffs:** ➖ docs must be actively maintained or they rot; ➕ dramatically lower per-session ramp cost for AI/human contributors.
- **Future:** Keep [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) + [`20_CHANGELOG.md`](./20_CHANGELOG.md) current every session. Consider automating changelog from Conventional Commits.

### ADR-010 — Phase 0 cleanup is strictly non-functional
- **Date:** 2026-07-02 · **Status:** Accepted
- **Context:** The brief requires cleaning without changing behavior.
- **Decision:** In Phase 0, only remove code/deps proven unused by grep across the whole app; **do not** touch dead *schema* (needs migrations + a keep/remove decision), do not fix behavior/security (that's Phase 1), do not redesign. Verify build/lint/tests after.
- **Tradeoffs:** ➖ known bugs/security gaps remain until Phase 1; ➕ zero regression risk; clear separation of "clean" vs "fix."
- **Future:** Security/correctness fixes are Phase 1 (WV-101..104); dead-schema removal is WV-109.

### ADR-011 — Harden `auth/sync` by deriving `clerkId` from the verified JWT, not deleting the endpoint
- **Date:** 2026-07-02 · **Status:** Accepted
- **Context:** `POST /v1/auth/sync` was unguarded and trusted a client-supplied `clerkId`, letting any caller overwrite any user's profile (WV-101, [`17_TECH_DEBT.md`](./17_TECH_DEBT.md) #1). Two fixes were possible: delete the endpoint (its job is already done by `ClerkAuthGuard`'s auto-provisioning upsert), or guard it and stop trusting the body.
- **Decision:** Guard it with `ClerkAuthGuard` and take `clerkId` exclusively from `@CurrentUser('clerkId')` (the verified JWT `sub` claim); removed the now-redundant `clerkId` field from `SyncUserDto`. Kept the endpoint rather than deleting it, since it still serves a distinct purpose the guard doesn't: pushing profile-field *updates* (email/displayName/avatarUrl) for an *existing* user, not just create-on-first-request.
- **Tradeoffs:** ➖ the `CurrentUser` interface gained a `clerkId?: string` field (previously undeclared, though the guard always set it — a pre-existing type/reality mismatch, now corrected). ➕ closes the tampering hole with a one-line change to the trust boundary rather than removing functionality; verified no frontend caller exists today (grepped `apps/web`), so this is a zero-risk behavioral change.
- **Future:** Once Clerk webhook sync is implemented (WV-201, Phase 2), re-evaluate whether this endpoint is still needed at all.

### ADR-012 — Flatten env validation instead of fixing the unused nested config classes
- **Date:** 2026-07-02 · **Status:** Accepted
- **Context:** `env.validation.ts`'s `validate()` never actually ran `class-validator` (WV-104); the file also declared a nested `EnvConfig`/`DatabaseConfig`/... class tree that was never instantiated or referenced anywhere else in the codebase (confirmed by grep), and would not have matched the actually-flat env object even if wired up.
- **Decision:** Replace the dead nested classes with one flat `EnvironmentVariables` class mirroring the real, flat env vars every `ConfigService.get('X')` call in the codebase already reads (verified by grepping every call site). Wire `plainToInstance` + `validateSync` for real. Required vars (`DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`) have no `@IsOptional()` and now fail fast at boot; everything else stays optional, preserving each call site's existing `.get(key, default)` fallback behavior.
- **Tradeoffs:** ➖ this is a full rewrite of the file's structure, not a small patch — but the nested structure was dead code providing false confidence, not "working code" to preserve. ➕ boot now fails immediately and legibly on real misconfiguration instead of surfacing as a confusing runtime error deep in Prisma or Clerk's SDK.
- **Future:** If the config surface grows large enough to want namespacing (`configService.get('database.url')`), reintroduce nesting deliberately with a custom `ConfigModule` load function that actually builds the nested shape from the flat env — don't resurrect the old dead classes as-is.

### ADR-013 — Apply `ThrottlerGuard` globally, exempt health checks
- **Date:** 2026-07-02 · **Status:** Accepted
- **Context:** `ThrottlerModule` was registered with real limits ('short' 100/min, 'long' 1000/hr) but no `ThrottlerGuard` was ever applied — the limits were pure configuration with no effect (WV-901).
- **Decision:** Provide `ThrottlerGuard` via `APP_GUARD` in `app.module.ts` so every route is covered by default; add `@SkipThrottle()` to `AppController` (`/health`, `/ready`) so infrastructure health/readiness polling is never throttled.
- **Tradeoffs:** ➖ a global guard is coarse — some endpoints may want bespoke limits later (e.g. stricter limits on `POST /v1/ai/*` given OpenAI cost, looser on public reads). ➕ closes an immediate, unambiguous abuse-protection gap with the least code; per-route overrides via `@Throttle()`/`@SkipThrottle()` remain available without further wiring.
- **Future:** Revisit per-route throttle profiles when real traffic patterns are known (Phase 9, WV-903).

### ADR-014 — Update the 3 spec tests that encoded the WV-103 bug, rather than leave them failing or skip them
- **Date:** 2026-07-02 · **Status:** Accepted
- **Context:** Fixing WV-103 (broad `catch` blocks masking any DB error as a 409) meant `trips.service.spec.ts`, `comments.service.spec.ts`, and `social.service.spec.ts` each had one existing test that mocked a *generic* `Error` and asserted it became a `ConflictException` — i.e., the tests were pinned to the exact bug being fixed, not to the intended behavior.
- **Decision:** Update each test's mock to reject with a real `Prisma.PrismaClientKnownRequestError` (`code: 'P2002'`) so the "already liked/following" case still correctly proves a 409 for a genuine unique-constraint violation; added one new test per file proving a *different* underlying error is no longer masked (propagates as-is). This was treated as part of completing WV-103, not as unrelated test refactoring — the tests were asserting incorrect behavior by construction.
- **Tradeoffs:** ➖ touches test files beyond the literal "fix identified issues" instruction's narrowest reading. ➕ leaving them as-is would mean either the fix breaks 3 passing tests (regressing coverage) or the tests silently keep validating the wrong contract — neither is acceptable for a correctness fix.
- **Future:** None — this is now the correct, permanent behavior to test against.

### ADR-015 — Treat stale documentation as the blocking issue in final Phase 0 verification; reconcile live docs, banner historical ones
- **Date:** 2026-07-03 · **Status:** Accepted
- **Context:** The final Phase 0 verification pass found code, build, tests, cleanup, and folder structure all green — but the documentation was internally inconsistent: the mandated first-read docs (`05_AI_CONTEXT.md`) and reference docs (`17_TECH_DEBT`, `11_API_REFERENCE`, `02_ARCHITECTURE`, `13_DEPENDENCY_GUIDE`, `08_ENGINEERING_BACKLOG`, etc.) still described the WV-101/102/103/104/108/901 fixes and the executed cleanup as *open problems*. Since this doc set exists precisely so AI sessions can trust it without re-auditing, docs asserting false security gaps as current truth is a **blocking** consistency defect, not cosmetic drift.
- **Decision:** Reconcile every *live reference* doc to the actual code state (strike-through + "✅ resolved (Phase 0, WV-###/ADR-###)" markers, preserving the original problem descriptions for context). Leave *historical/dated* documents (`20_CHANGELOG.md` entries, `00_SESSION_CONTEXT.md`, the score tables) unedited as records, and mark `PHASE_0_AUDIT_REPORT.md` with a "superseded historical snapshot" banner pointing to the new `PHASE_0_COMPLETION_REPORT.md` rather than rewriting its body.
- **Tradeoffs:** ➖ touched 11 docs in one pass (broad diff for a "verification" session) — but every edit is a status marker, zero source code changed. ➕ restores the core guarantee of the doc system (docs = truth); establishes the convention that fix-status is updated in *all* referencing docs at fix time, not deferred.
- **Future:** When resolving a ticket, update every doc that references it in the same change (the "update the docs you invalidate" rule in [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md)) — this session's reconciliation debt existed because session 2 was scoped to only 4 named files.

### ADR-016 — Trip locations CRUD lives in the trips module, guarded by an extracted `getEditableTrip`
- **Date:** 2026-07-10 · **Status:** Accepted
- **Context:** The flagship-journal upgrade needed post-create itinerary editing; no endpoint existed. `getAccessibleTrip` is a *read* check (it admits any user for non-PRIVATE trips) and must not gate writes; the owner-or-EDITOR check lived inline in `updateTrip` only.
- **Decision:** Model locations as a sub-resource of trips (`/v1/trips/:id/locations…`) inside the existing trips module rather than a new module — they share the trip's access model and service. Extract the mutation guard into a private `getEditableTrip(tripId, userId)` used by `updateTrip` and all four location methods. Order semantics: append-on-add, compact-on-delete, index-assign on reorder (exact id-set match required, 400 otherwise). Coordinates are **required** on the new add/update DTOs (unlike the create-time `LocationDto`) because their whole purpose is placing the globe pin. No schema change; `Trip` has no locations counter (stats count live), so none is maintained — do not "fix" this.
- **Tradeoffs:** ➖ trips module grows; ➕ no new module boilerplate for a sub-resource, one access model, and the read/write guard distinction is now explicit and reusable.

### ADR-017 — Homepage branches on auth in the server component, env-guarded
- **Date:** 2026-07-10 · **Status:** Accepted
- **Context:** The homepage played the same hardcoded demo journey for everyone. The personal experience needed a signed-in variant without breaking the "public site boots without Clerk" guarantee — `middleware.ts` only mounts `clerkMiddleware()` when `CLERK_SECRET_KEY` is set, and `auth()` throws when the middleware never ran.
- **Decision:** Keep one route. `app/page.tsx` returns `<MarketingHome/>` when `CLERK_SECRET_KEY` is unset or the visitor is signed out, `<PersonalHome/>` otherwise. No middleware rewrites, no separate route groups. The personal home's data fetches (`getMyProfile`/`getTrips`/`getFeed`) are individually `.catch`ed so one failing call degrades only its section. *(Post-merge with #18: MarketingHome composes the lightweight `landing/hero.tsx` + sections — the 3D journey stays paused on marketing surfaces and lives only at `/trips/[id]/wander`.)*
- **Tradeoffs:** ➖ `/` becomes a dynamic route (no static prerender) whenever Clerk is configured; ➕ single URL for both audiences, zero routing indirection, and the env guard preserves the no-Clerk boot path.

*(Add ADR-018+ below as decisions are made.)*
