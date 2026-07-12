# 05 — AI CONTEXT  ⭐ READ THIS FIRST

> **If you are an AI assistant (Claude, Opus, Fable, Cursor, Copilot, or any other), read this entire file before writing or editing a single line of code.** Then skim [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) for what's active right now. These two files exist so you don't have to re-derive the project every session.

---

## 30-second project summary

**Wanderverse = "Instagram for your travel life. Map your life."** A social network where your profile is a living map of everywhere you've been, and each trip becomes a cinematic, scroll-driven 3D-globe story. Wedge audience: **digital nomads / long-term travelers** — every screen must make them want to screenshot it.

Monorepo:
- `apps/web` — Next.js 15 (App Router) + React 19 + TS + Tailwind v4 + Clerk + React Three Fiber + Framer Motion.
- `apps/api` — NestJS 10 + Prisma 6 + PostgreSQL + Redis/BullMQ + Clerk + S3 + OpenAI.

Auth = Clerk (stateless JWT per request). Response envelope everywhere = `{ success, data, meta, error }`.

---

## Current phase

**Phase 0 (repository foundation: docs + cleanup + hardening) is ✅ COMPLETE.** Phase 1 (stabilization & debt paydown) is next but **has not been kicked off** — don't start it without explicit user instruction. Always confirm the live state in [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md); the phase plan is [`07_ROADMAP.md`](./07_ROADMAP.md).

---

## Goals (what "good" looks like here)

1. Preserve the **signature aesthetic**: modern **dark theme** (warm charcoal surfaces from the stone ramp — user-mandated, ADR-018), one coral accent `#FF5A4D`, serif headlines, full-bleed photos, generous whitespace, buttery motion. (See [`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md); the semantic tokens in `globals.css` are the single source of surface/text colors — never raw white/neutral utilities.)
2. Keep the **API contract stable** (the response envelope + auth model).
3. Reduce, don't grow, **duplication and dead code**.
4. Every change leaves the repo **more self-documenting**, not less.

---

## 🚫 What NOT to change (without an explicit request + a decision-log entry)

- **The response envelope** (`{success,data,meta,error}`) — the whole frontend `unwrap()` depends on it.
- **`ClerkAuthGuard`** and the auth model — it's the single auth chokepoint.
- **`prisma/schema.prisma` applied migrations** — never edit an existing migration; only add new ones.
- **`components/three/journey-scene.tsx`** — the ~700-line tuned WebGL signature. Don't casually refactor.
- **`components/ui/*`** and **`app/layout.tsx` providers** — global blast radius.
- **The brand:** don't introduce a second accent color, swap the serif/sans pairing, or flatten the motion. See [`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md).
- **URI versioning / global pipes** in `main.ts`.

Full danger list with rationale: [`03_CODEBASE_GUIDE.md`](./03_CODEBASE_GUIDE.md) → "What should NEVER be modified casually."

---

## ⚠️ The single most important thing to understand: MODELED ≠ BUILT

The database schema and enums describe a **much more ambitious product than what is actually implemented.** Do not assume a feature works just because there's a model, an enum value, or a dependency for it.

**Empty stub modules (literally `@Module({})`, zero code):** `payments`, `webhooks`, `analytics`, `exports`.

**Placeholder implementations (return fake/empty data):**
- Mapbox geocoding (`maps.service` forward/reverse) → always returns `[]`.
- AI photo enhancement (`ai.processor`) → returns fake success, calls no image API.
- `media` `/process` endpoint → no-op `{queued:true}`.
- `media` delete → deletes the DB row but **leaks the S3 object** (TODO).

**Dead schema (models never read/written):** `Session`, `Invoice`, `Export`, `UserActivity`, `MapTileCache`, `Challenge`, `ChallengeEntry`.

**Unreachable enum values:** `AIJobType.{GENERATE_CAPTIONS, AUTO_LAYOUT, TRANSLATE, VOICE_NARRATE, RECONSTRUCT_ROUTE}` (no endpoint, no processor case).

**Dependencies present but unused:** the clearly-dead ones were **removed in Phase 0 cleanup** (frontend: `gsap`, `zustand`, `@mapbox/mapbox-gl-draw`, `mapbox-gl`; backend: `@nestjs/jwt`, `passport*`, `joi`, `zod`, `ms`, `@nestjs/axios`, `@nestjs/mapped-types`, `mapbox-gl`). Deliberately **kept as planned-phase scaffolding**: frontend `@stripe/*`; backend `stripe`, `svix`, `sharp`, `@nestjs/websockets`. (Full list + rationale: [`13_DEPENDENCY_GUIDE.md`](./13_DEPENDENCY_GUIDE.md).)

➡️ **Before building on any capability, verify it's real** by reading the actual service/component, not the schema. If it's a stub, treat implementing it as net-new work and check the roadmap/backlog.

---

## Known security / correctness gaps

**✅ Resolved in Phase 0 (hardening pass — see [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md) ADR-011..014):**
- ~~`POST /v1/auth/sync` is unguarded~~ → now guarded by `ClerkAuthGuard`; `clerkId` comes from the verified JWT, not the body (WV-101).
- ~~`TripsService.duplicateTrip` skips the access check~~ → now runs `getAccessibleTrip` first (WV-102).
- ~~`catch` blocks mask real DB errors as 409s~~ → now check Prisma `P2002` specifically; other errors propagate (WV-103).
- ~~`env.validation.ts` doesn't actually validate~~ → now runs `class-validator`; missing required vars fail fast at boot (WV-104).

**⚠️ Still open (deliberately deferred — don't build on these yet):**
- **No Clerk webhook** → Clerk-side profile/email/delete changes never sync to the DB (WV-201, Phase 2).
- **`media` delete leaks the S3 object** (WV-107) — DB row removed, S3 object orphaned.

Full ledger with current status: [`17_TECH_DEBT.md`](./17_TECH_DEBT.md).

---

## Preferred coding style (the short version)

- **Match the surrounding code.** Full standards: [`04_CODING_STANDARDS.md`](./04_CODING_STANDARDS.md).
- Files: `kebab-case`. Components: `PascalCase`. Hooks: `use-*`.
- TypeScript strict, **no `any`**.
- Server Components by default; `"use client"` only when necessary; `ssr:false` for WebGL.
- Backend: thin controllers, logic in services, **every mutation gets a DTO + `class-validator`**.
- Use `cn()` for classNames; reuse `components/ui/*`; reuse the `unwrap`/`ApiError` API pattern.
- Respect `prefers-reduced-motion`.

---

## Architecture philosophy

- **Two decoupled apps, one REST contract.** Frontend never touches DB/Redis/S3 directly (except browser→S3 presigned PUT).
- **Stateless auth.** No server sessions; the JWT is the truth each request.
- **Server-first data fetching**, client-side only for interactivity/animation.
- **Data-source-agnostic experience layer:** the journey renders from a `Destination[]`, whether that's demo data or a real trip mapped via `trip-to-journey.ts`.
- **Envelope + global pipes** give a uniform API surface; keep it uniform.

---

## Important folders (cheat sheet)

| Need to… | Go to |
|---|---|
| Add/adjust a page | `apps/web/app/<segment>/page.tsx` |
| Reuse/add a UI primitive | `apps/web/components/ui/` |
| Touch the 3D journey | `apps/web/components/journey/` + `apps/web/components/three/` |
| Call the API from the frontend | `apps/web/lib/*-api.ts` (extend the pattern in `lib/api.ts`) |
| Add a backend endpoint | `apps/api/src/<feature>/` (module+controller+service+dto) |
| Change auth | `apps/api/src/common/guards/clerk-auth.guard.ts` (⚠) |
| Change the data model | `apps/api/prisma/schema.prisma` + **new** migration |

Full map: [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md).

---

## How features should be built (the standard loop)

1. **Read first.** Check [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md), this file, and the relevant registry/reference doc. Confirm the capability isn't already there (or a stub).
2. **Backend, if data is involved:**
   - Model change? Edit `schema.prisma`, run `npx prisma migrate dev --name <change>`, regenerate client.
   - Add DTO(s) with `class-validator`.
   - Add service method (Prisma access + access control + counter maintenance).
   - Expose via controller with `@UseGuards(ClerkAuthGuard)` (unless intentionally public) + Swagger decorators.
   - Add a service spec test.
   - Document the endpoint in [`11_API_REFERENCE.md`](./11_API_REFERENCE.md) and schema in [`12_DATABASE_SCHEMA.md`](./12_DATABASE_SCHEMA.md).
3. **Frontend:**
   - Add a typed wrapper in the right `lib/*-api.ts`.
   - Fetch in a Server Component where possible; use client components for interaction.
   - Reuse `components/ui/*`; keep the brand (coral, serif, air).
   - Add reduced-motion handling for any animation.
   - Register new components in [`10_COMPONENT_REGISTRY.md`](./10_COMPONENT_REGISTRY.md).
4. **Verify:** `type-check`/`build`, `lint`, `test`. Then actually run the flow (see the `/verify` and `/run` skills).
5. **Record:** update [`20_CHANGELOG.md`](./20_CHANGELOG.md) and [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md); log any architectural decision in [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).

---

## Rules for editing

- **Prefer additive, contract-preserving changes.** If you must change a shared contract, update both sides in the same change.
- **Reuse before you write.** This repo's biggest debt is duplication — don't add to it.
- **Never edit an applied Prisma migration.** Add a new one.
- **Don't delete "dead" code unless certain** it's unused (grep the whole app, both `src`/`app` and tests). When you do, note it in the changelog.
- **Keep counters consistent** when mutating trips/media/likes/comments.
- **Don't commit secrets.** `.env.local`/`.env` are gitignored; keep them so.
- **Update the docs you invalidate.** A change that makes a doc wrong isn't done until the doc is fixed.

---

## Common mistakes to avoid (specific to this repo)

1. **Assuming a schema/enum/dependency means a working feature.** It usually doesn't — see "MODELED ≠ BUILT."
2. **Using `request.user`'s id as a Clerk id** — it's the DB cuid. Use `@CurrentUser('id')` for ownership.
3. **Changing the response envelope** and breaking every `unwrap()` call.
4. **Adding a 5th copy** of `API_URL`/`unwrap`/`authHeaders` instead of consolidating (there are already 4 + one ad-hoc `fetch`).
5. **Importing `journey-scene` without `ssr:false`** → SSR crash.
6. **Introducing a new animation library** (GSAP was removed in Phase 0 cleanup) — use Framer Motion + R3F, which are the real stack.
7. **Adding a second brand accent color** or breaking the serif/sans system — violates the design law.
8. **Building on Mapbox** for maps — the app renders geography with R3F globes; Mapbox is effectively unused.
9. **Forgetting reduced-motion** paths on animated components.
10. **Trusting `QUICKSTART.md` verbatim** — it's partially stale (references a nonexistent `components/story/WanderView`, claims GSAP/Mapbox power the experience, and has wrong absolute paths). Trust these `/docs` numbered files.
11. **Leaving `@Module({})` stubs registered** as if they do something — check the module has real providers before wiring UI to it.
12. **Skipping the migration step** after a `schema.prisma` edit.

---

## Where to look when you're stuck

| Question | Doc |
|---|---|
| What is this product? | [`01_PROJECT_OVERVIEW.md`](./01_PROJECT_OVERVIEW.md) |
| How does it fit together? | [`02_ARCHITECTURE.md`](./02_ARCHITECTURE.md) |
| Where does X live? | [`03_CODEBASE_GUIDE.md`](./03_CODEBASE_GUIDE.md), [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) |
| How do I style/name it? | [`04_CODING_STANDARDS.md`](./04_CODING_STANDARDS.md) |
| How should it *feel*? | [`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md) |
| What component/API/table is this? | [`10`](./10_COMPONENT_REGISTRY.md) / [`11`](./11_API_REFERENCE.md) / [`12`](./12_DATABASE_SCHEMA.md) |
| Is this a known problem? | [`17_TECH_DEBT.md`](./17_TECH_DEBT.md) |
| What's the plan / what's next? | [`07_ROADMAP.md`](./07_ROADMAP.md), [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md), [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md) |
| How do I prompt effectively here? | [`19_PROMPT_GUIDE.md`](./19_PROMPT_GUIDE.md) |

**When you finish a task, leave a breadcrumb:** update the changelog and phase status so the next AI session starts where you left off.
