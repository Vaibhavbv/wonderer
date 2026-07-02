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

*(Add ADR-011+ below as decisions are made.)*
