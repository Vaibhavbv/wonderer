# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Wanderverse** — "Instagram for your travel life." A social platform where each trip becomes a cinematic, scroll-driven 3D-globe story. Monorepo with two decoupled apps talking over one REST contract:

- `apps/web` — Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 + Clerk + React Three Fiber + Framer Motion.
- `apps/api` — NestJS 10 + Prisma 6 + PostgreSQL + Redis/BullMQ + Clerk + S3 + OpenAI.

There is no shared workspace tooling at the root — each app has its own `package.json` and is developed independently from its own directory.

## Authoritative docs

`/docs/` is code-audited and current; the root `QUICKSTART.md`/`DEPLOYMENT.md` are partially stale. **Before non-trivial work, read `docs/05_AI_CONTEXT.md`** (the AI-oriented orientation) and `docs/15_PHASE_STATUS.md` (what's live right now). Other useful entries: `03_CODEBASE_GUIDE.md`, `04_CODING_STANDARDS.md`, `11_API_REFERENCE.md`, `12_DATABASE_SCHEMA.md`, `17_TECH_DEBT.md`.

## Commands

Run these from `apps/api` or `apps/web` respectively (not the repo root).

**Backend (`apps/api`)** — Jest, NestJS:
```bash
npm run start:dev              # watch-mode dev server → http://localhost:3001 (docs at /v1/docs)
npm run build                  # nest build
npm run lint                   # eslint --fix
npx tsc --noEmit -p .          # typecheck (CI gate)
npm test                       # unit tests (*.spec.ts, --passWithNoTests)
npx jest src/trips/trips.service.spec.ts   # run a single test file
npm run test:e2e               # e2e (test/jest-e2e.json)
npm run db:migrate             # prisma migrate dev
npm run db:migrate:prod        # prisma migrate deploy (production)
npm run db:generate            # regenerate Prisma client after schema edits
npm run db:seed                # ts-node prisma/seed.ts
npm run db:studio              # Prisma Studio GUI
```

**Frontend (`apps/web`)** — Vitest, Next:
```bash
npm run dev                    # dev server → http://localhost:3000
npm run build
npm run type-check             # tsc --noEmit (the real CI gate — see note below)
npm run test                   # vitest run
npm run test:watch
npx vitest run lib/utils.spec.ts           # run a single test file
```

Postgres + Redis (+ Meilisearch) for local dev come from `infra/docker-compose.yml` (`docker-compose up -d`).

Note: frontend `npm run lint` (`next lint`) is **advisory only** — `eslint-config-next` isn't installed, so CI runs it with `continue-on-error`. `type-check` is the enforced gate. Backend lint/typecheck/build/test all gate CI (`.github/workflows/ci.yml`).

## Architecture essentials

**One REST contract, uniform envelope.** Every API response is wrapped `{ success, data, meta, error }` by `common/interceptors/transform.interceptor.ts` (+ `http-exception.filter.ts`). The frontend's `unwrap<T>()` in `lib/api.ts` depends on this shape — do not change the envelope. Frontend API calls live in `apps/web/lib/*-api.ts`; extend the `unwrap`/`ApiError` pattern rather than adding a new `fetch` helper.

**Auth is stateless Clerk JWT, verified per request.** `common/guards/clerk-auth.guard.ts` is the single auth chokepoint: it verifies the bearer token and **upserts** the Clerk user into the DB on first authenticated request. Critically, `request.user.id` is the **DB `User.id` (cuid), not the Clerk id** — use `@CurrentUser('id')` for ownership checks. On the web side, `middleware.ts` only enables `clerkMiddleware()` when `CLERK_SECRET_KEY` is set (so the public site still boots without it).

**Backend module shape.** Each feature is a NestJS module under `apps/api/src/<feature>/` (module + controller + service + dto). Controllers are thin; logic lives in services; every mutation gets a DTO with `class-validator`. `main.ts` applies global `ValidationPipe` (whitelist + `forbidNonWhitelisted`), URI versioning (`defaultVersion: '1'` → routes are `/v1/...`), Swagger at `/v1/docs`, and a global `ThrottlerGuard`.

**Async/AI work goes through BullMQ + Redis.** AI generation is enqueued as an `AIJob` row and processed by `ai/ai.processor.ts` (OpenAI client is lazily constructed so a missing `OPENAI_API_KEY` doesn't crash boot).

**The signature 3D experience is data-source-agnostic.** The cinematic journey renders from a `Destination[]` (`apps/web/lib/journey-data.ts`), regardless of whether that's homepage demo data or a real trip mapped through `lib/trip-to-journey.ts`. The heavy WebGL lives in `components/journey/` + `components/three/` — `components/three/journey-scene.tsx` is a large hand-tuned file; import it with `ssr: false` or SSR crashes.

**Data model.** `apps/api/prisma/schema.prisma` (Postgres). Trips denormalize counters (`photosCount`, `likesCount`, etc.) — keep them consistent when mutating trips/media/likes/comments. Never edit an applied migration in `prisma/migrations/`; add a new one.

## Repo-specific gotchas

- **MODELED ≠ BUILT.** The schema/enums describe a far more ambitious product than what's implemented. Stub modules (`payments`, `webhooks`, `analytics`, `exports`) are literally `@Module({})`. Several services return placeholder data (Mapbox geocoding → `[]`, AI photo enhance → fake success, `media` `/process` → no-op). Several models are never read/written (`Session`, `Invoice`, `Export`, `Challenge`, etc.). **Verify a capability is real by reading its service/component before building on it** — don't trust the schema.
- **Geography is rendered with R3F globes, not Mapbox.** Mapbox is effectively unused in the browser despite lingering references. Don't build on it.
- **One animation stack: Framer Motion + React Three Fiber.** GSAP was removed; don't reintroduce another animation library.
- **Brand is a hard constraint:** single modern **dark theme** (semantic tokens in `globals.css` — never raw `bg-white`/`bg-neutral-*`), one coral accent (`#FF5A4D`), serif headlines + sans body, generous whitespace, and honored `prefers-reduced-motion`. Pale-tint fills use the alpha idiom (`bg-primary-500/15 text-primary-400`). Don't add a second accent or flatten motion.
- Path aliases: backend uses `@/`, `@common/`, `@config/`, `@prisma/prisma.service`, `@redis/` (see `package.json` jest `moduleNameMapper` + `tsconfig`). Frontend uses `@/*`.
- Naming: files `kebab-case`, components `PascalCase`, hooks `use-*`. TypeScript strict, no `any`. Server Components by default; `"use client"` only when needed.

## Workflow expectations (from docs/05_AI_CONTEXT.md)

Schema change → edit `schema.prisma`, `npx prisma migrate dev --name <change>`, regenerate client. Backend feature → DTO + service (access control + counter maintenance) + controller (`@UseGuards(ClerkAuthGuard)` unless intentionally public) + a service spec. Prefer additive, contract-preserving changes and reuse over new code (duplication is this repo's largest debt). When a change invalidates a `/docs` file, update it in the same change.
