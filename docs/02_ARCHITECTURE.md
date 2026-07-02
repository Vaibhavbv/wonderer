# 02 — Architecture

> Companion docs: [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) (folder-by-folder), [`11_API_REFERENCE.md`](./11_API_REFERENCE.md) (endpoints), [`12_DATABASE_SCHEMA.md`](./12_DATABASE_SCHEMA.md) (tables). This file is the system-level map.

---

## 1. System Overview

Wanderverse is a **two-app monorepo**: a Next.js frontend and a NestJS backend, talking over a versioned REST API, sharing nothing but the API contract (no shared code package today).

```
┌─────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                    │
│  Next.js 15 App Router (React 19) — apps/web                            │
│  • Server Components fetch data with the user's Clerk token             │
│  • Client Components render the WebGL journey, forms, optimistic UI     │
└───────────────┬───────────────────────────────────┬───────────────────┘
                │ Clerk JWT (Bearer)                 │ direct PUT (presigned)
                ▼                                     ▼
┌───────────────────────────────────┐     ┌──────────────────────────────┐
│  NestJS API — apps/api  (:3001)    │     │        AWS S3 bucket          │
│  /v1/... REST, envelope responses  │     │   (photos/videos originals)   │
│  ClerkAuthGuard verifies JWT       │     └──────────────────────────────┘
│  Global ValidationPipe + filters   │
└───┬──────────┬──────────┬──────────┘
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────────────────┐        ┌──────────────────┐
│Postgres│ │ Redis  │ │ BullMQ queue        │───────▶│ OpenAI API        │
│(Prisma)│ │        │ │ "ai-generation"     │        │ (story/title gen) │
└────────┘ └────────┘ └────────────────────┘        └──────────────────┘
                          ▲
                          │ worker: AiProcessor
                          └── (same process, in-app worker)

External identity: Clerk (issues + verifies JWTs, hosts sign-in UI)
```

**Key architectural facts:**
- The frontend never talks to Postgres/Redis/S3 for reads — it always goes through the API, **except** photo bytes, which the browser `PUT`s directly to S3 using a presigned URL the API mints.
- Auth is **stateless**: every API request carries a Clerk JWT in `Authorization: Bearer`. There is no server session store (the `Session` table exists but is unused).
- Background work (AI generation) runs via **BullMQ in the same Node process** as the API (no separate worker deployment today).

---

## 2. Monorepo / Folder Structure (top level)

```
wonderer/
├── apps/
│   ├── api/            NestJS backend (see §5)
│   └── web/            Next.js frontend (see §4)
├── docs/               ← you are here (numbered docs + strategic docs)
├── infra/
│   ├── docker-compose.yml   Postgres + Redis (+ API) for local dev
│   └── terraform/           AWS infra (README only in repo)
├── .github/            CI workflows
├── render.yaml         Render.com deploy config
├── DEPLOYMENT.md       deploy guide
└── QUICKSTART.md       local setup guide (⚠ partially stale — see 17_TECH_DEBT)
```

There is **no root `package.json` / workspace file**. Each app is installed and run independently (`cd apps/web && npm install`, `cd apps/api && npm install`). See [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) for the full expanded tree with rationale.

---

## 3. Data Flow

### 3.1 Read flow (e.g. viewing a trip)
1. User hits `/trips/[id]` (a **Server Component**).
2. The page calls Clerk `auth()` → `getToken()` server-side.
3. It calls a typed function in `lib/trip-api.ts` with `Authorization: Bearer <token>`.
4. The API's `ClerkAuthGuard` verifies the JWT, resolves/creates the DB `User`, attaches `request.user`.
5. The controller → service reads Postgres via Prisma, applies access control (owner/privacy), returns data.
6. The global `TransformInterceptor` wraps it as `{ success, data, meta, error }`.
7. `lib/api.ts`'s `unwrap()` strips the envelope (or throws `ApiError`) and returns typed data to the page.

### 3.2 Write flow with media (creating a trip)
1. `CreateTripButton` (client) `POST /v1/trips` → creates the trip + locations.
2. For each photo: `POST /v1/media/presigned-url` → API returns an S3 presigned `PUT` URL + a `Media` row (`processingStatus: 'uploading'`).
3. Browser `PUT`s the file **directly to S3**.
4. `PATCH /v1/media/:id` attaches caption/location; one media is set as the trip cover.
5. Redirect to `/trips/{id}/wander`.

### 3.3 Async AI flow
1. `POST /v1/ai/generate-story` checks the user's AI credit quota, writes an `AIJob` row (`QUEUED`), enqueues a BullMQ job.
2. `AiProcessor` (in-process worker) picks it up → calls OpenAI → updates the `AIJob` with result/status.
3. Client polls `GET /v1/ai/jobs/:id` for status/result.

### 3.4 Response envelope (every endpoint)
Success: `{ "success": true, "data": <payload>, "meta": <pagination|null>, "error": null }`
Error: `{ "success": false, "data": null, "meta": null, "error": { "code": "snake_case_code", "message": "...", "details": ... } }`
Produced by `TransformInterceptor` + `HttpExceptionFilter` (in `apps/api/src/common/`). The frontend's `unwrap()` depends on this shape — **do not change the envelope without updating `apps/web/lib/api.ts`.**

---

## 4. Frontend Architecture (`apps/web`)

**Stack:** Next.js 15 App Router · React 19 · TypeScript (strict) · Tailwind v4 (CSS-first config) · Clerk · React Three Fiber + Three.js · Framer Motion · Lenis (smooth scroll).

### 4.1 Rendering model
- **Server Components by default.** Pages that fetch data (`dashboard`, `trips/[id]`, `profiles/[username]`, `discover`, `wander`) are async Server Components that fetch server-side with the Clerk token.
- **Client Components** (marked `"use client"`) handle interactivity: the WebGL journey, forms, optimistic likes/comments, notifications.
- The heavy WebGL scene (`components/three/journey-scene.tsx`) is **dynamically imported with `ssr: false`** from `journey-experience.tsx` so it never runs on the server.

### 4.2 Layout & global providers
`app/layout.tsx` wraps the app in:
- `ClerkProvider` (auth context)
- `SmoothScroll` (Lenis inertia scroll — client effect, `null` render)
- `CursorFX` (custom cursor — client effect, `null` render)
- Fonts: Inter (`--font-inter`) + Playfair Display (`--font-playfair`)

There is **no Zustand store and no custom React context** beyond Clerk. All state is local (`useState`/`useRef`) or server-fetched. (`zustand` is a dependency but unused — see [`13_DEPENDENCY_GUIDE.md`](./13_DEPENDENCY_GUIDE.md).)

### 4.3 API integration layer (`lib/`)
- `lib/api.ts` — `ApiError`, `getMe`, discover/profile calls; the canonical `API_URL` + `unwrap` pattern.
- `lib/trip-api.ts`, `lib/comments-api.ts`, `lib/notifications-api.ts` — typed per-endpoint wrappers.
- **Known debt:** `API_URL` + `unwrap` + `authHeaders` are **copy-pasted across these four files**, and `components/profile/follow-button.tsx` does raw `fetch`. Consolidating into one client is a Phase 1 cleanup ticket (see [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md)).
- **Caching:** public reads use `next: { revalidate: 30 }`; authenticated reads use `cache: "no-store"`.

### 4.4 The signature journey (component relationships)
```
JourneyExperience (journey/journey-experience.tsx) ── orchestrator, scroll state
 ├── dynamic import → JourneyScene (three/journey-scene.tsx)  [WebGL, ssr:false]
 │     └── uses EffectComposer post-fx (Bloom/Vignette/Noise/ChromaticAberration)
 ├── DestinationCard (journey/destination-card.tsx)
 ├── JourneyNav (journey/journey-nav.tsx)
 └── [reduced-motion fallback] ParticleField + RouteVehicle (2D)

DestinationsGlobe (journey/destinations-globe.tsx) → Globe (three/globe.tsx)  [/destinations]
```
Data source is abstracted: `JourneyExperience` takes `Destination[]`. The homepage feeds it static demo data (`lib/journey-data.ts`); `/trips/[id]/wander` feeds it real trip data mapped through `lib/trip-to-journey.ts`.

See [`10_COMPONENT_REGISTRY.md`](./10_COMPONENT_REGISTRY.md) for every component.

---

## 5. Backend Architecture (`apps/api`)

**Stack:** NestJS 10 · Prisma 6 · PostgreSQL · Redis + BullMQ · Clerk SDK (`@clerk/clerk-sdk-node`) · AWS S3 SDK · OpenAI SDK.

### 5.1 Bootstrap (`src/main.ts`)
Global setup applied to every request:
- **URI versioning**, default `v1` → all routes are effectively `/v1/...`.
- Global **`ValidationPipe`** (`whitelist` + `forbidNonWhitelisted` + implicit conversion) — strips/blocks unknown DTO fields.
- Global **`TransformInterceptor`** (success envelope) + **`HttpExceptionFilter`** (error envelope).
- **Swagger** at `/v1/docs`.
- `helmet`, `compression`, `cookie-parser`, CORS.

### 5.2 Root module (`src/app.module.ts`)
Registers global infra + all feature modules:
- `ConfigModule` (global, loads `.env.local`/`.env`, runs `validate` — now performs **real `class-validator` validation**; missing required vars fail fast at boot (WV-104, ADR-012)).
- `ThrottlerModule` — **enforced** via a global `ThrottlerGuard` (WV-901, ADR-013). `EventEmitterModule`, `ScheduleModule` — registered but still without consumers (no `@OnEvent`/`@Cron`). `BullModule` *is* used, but its connection is configured here directly from `process.env`, duplicating `RedisModule` (see tech-debt #17).
- Feature modules (see below).

### 5.3 Module map

| Module | Status | Responsibility |
|---|---|---|
| `prisma` | ✅ | Global `PrismaService` (extends `PrismaClient`), lifecycle connect/disconnect. |
| `redis` | ⚠️ dead | Provides an `ioredis` client (`REDIS_CLIENT`) with **zero consumers**. |
| `auth` | ✅ thin | `POST /v1/auth/sync` (now guarded — WV-101), `GET /v1/auth/me` (stub). Mostly superseded by the guard's auto-provisioning. |
| `users` | ✅ | Profile CRUD, stats, subscription view (read-only), GDPR delete. |
| `trips` | ✅ | Core domain: CRUD, list/search/paginate, duplicate, stats, like. |
| `media` | ⚠️ partial | S3 presign, quota, CRUD. **TODO:** S3 delete not implemented; `/process` is a no-op. |
| `stories` | ✅ | Per-trip story JSON blob (get/replace). `updateStory` takes a typed `UpdateStoryDto` (WV-108). |
| `ai` | ⚠️ partial | Story/title gen via BullMQ→OpenAI. Photo-enhance is a placeholder; 4 job types unreachable. |
| `maps` | ⚠️ stub-heavy | Route/heatmap are real (haversine). Geocoding returns `[]` (placeholder). Styles hardcoded. |
| `social` | ✅ | Public discover/profiles + guarded feed/follow. Two controllers in one file (public vs guarded). |
| `comments` | ✅ | Threaded comments + likes + notifications. |
| `notifications` | ✅ | In-app notifications (list/unread/mark-read). No push/email. |
| `payments` | ❌ empty | `@Module({})`. No Stripe integration at all. |
| `webhooks` | ❌ empty | `@Module({})`. No Clerk/Stripe webhook handling. |
| `analytics` | ❌ empty | `@Module({})`. `UserActivity` never written. |
| `exports` | ❌ empty | `@Module({})`. No PDF/MP4/JSON export. |
| `common` | ✅ | Cross-cutting: guards, decorators, filters, interceptors, utils. |
| `config` | ✅ | `EnvironmentVariables` class; `validate()` enforces required vars at boot (WV-104). |

Legend: ✅ built · ⚠️ partial/has debt · ❌ empty stub.

### 5.4 Cross-cutting concerns (`src/common/`)
- `guards/clerk-auth.guard.ts` — verifies Clerk JWT, auto-provisions the DB user, sets `request.user = { id, clerkId, email }`.
- `decorators/current-user.decorator.ts` — `@CurrentUser()` / `@CurrentUser('id')` reads `request.user`.
- `decorators/pagination.decorator.ts` — parses `cursor` / `per_page` / `sort` query params.
- `filters/http-exception.filter.ts` — error envelope + snake_case error codes.
- `interceptors/transform.interceptor.ts` — success envelope.
- `utils/slug.ts`, `utils/theme-inference.ts` (deterministic destination "atmosphere" theming used at trip creation).

---

## 6. Authentication Flow

Auth is **fully delegated to Clerk**; the API is a stateless JWT verifier.

```
1. User signs in via Clerk (hosted UI / <SignInButton>) in the browser.
2. Frontend obtains a Clerk JWT:
     - Server Components:  auth() → getToken()
     - Client Components:  useAuth().getToken()
3. Every API call sends:  Authorization: Bearer <jwt>
4. ClerkAuthGuard.canActivate():
     a. Extract Bearer token (401 if missing/malformed).
     b. verifyToken(token, { secretKey: CLERK_SECRET_KEY })  ← cryptographic verify
     c. clerkId = payload.sub ; email = payload.email (optional)
     d. prisma.user.upsert({ where:{clerkId}, update:{}, create:{clerkId,email} })
        ↑ AUTO-PROVISIONING: first authed request silently creates the DB user.
          update:{} is a no-op → existing users' email/profile are never refreshed here.
     e. request.user = { id: <db cuid>, clerkId, email }
5. Controllers read the user via @CurrentUser().
```

**Important nuances an AI assistant must know:**
- `request.user.id` is the **database cuid**, *not* the Clerk id. Use `@CurrentUser('id')` for ownership checks.
- There is **no webhook sync** (WebhooksModule is empty). Clerk-side profile edits/deletes do **not** propagate to the DB automatically.
- `POST /v1/auth/sync` is **now guarded** (WV-101, ADR-011); it derives `clerkId` from the verified JWT, so it can only sync the caller's own profile. Prefer the guard's provisioning + `PATCH /v1/users/me` for routine edits.
- Frontend `middleware.ts` only enables Clerk when `CLERK_SECRET_KEY` is present, so the public marketing site boots even without auth configured.

See the auth section of [`11_API_REFERENCE.md`](./11_API_REFERENCE.md) for guard-by-endpoint detail.

---

## 7. API Structure

- **Base:** `/v1` (URI versioning). Local dev: `http://localhost:3001`.
- **Auth:** most routes require `ClerkAuthGuard`; public routes are `GET /health`, `GET /ready`, the `auth/*` endpoints, and the `social` discover/profile reads.
- **Validation:** DTO classes + `class-validator`, enforced by the global `ValidationPipe`. Every mutation body is typed (WV-108 closed the last exception).
- **Pagination:** cursor-based, via the `@Pagination()` decorator + per-service hand-rolled `take/skip/cursor` (duplicated across services — see tech debt).
- **Docs:** Swagger/OpenAPI auto-generated at `/v1/docs`.

Full endpoint list: [`11_API_REFERENCE.md`](./11_API_REFERENCE.md).

---

## 8. Database Overview

- **Engine:** PostgreSQL, accessed exclusively through **Prisma** (`prisma/schema.prisma`).
- **~20 models**, of which ~13 are actively used and ~7 are **modeled-but-unused** dead schema (`Session`, `Invoice`, `Export`, `UserActivity`, `MapTileCache`, `Challenge`, `ChallengeEntry`).
- **3 migrations:** `init` (baseline), `trip_location_notes_and_media_location`, `add_comment_like`.
- **Denormalized counters** on `Trip` (`photosCount`, `likesCount`, `commentsCount`, etc.) are maintained in application code — a consistency risk to be aware of when writing new mutations.

Full model/relationship/index detail: [`12_DATABASE_SCHEMA.md`](./12_DATABASE_SCHEMA.md).

---

## 9. Component Relationships (frontend, high level)

```
app/layout.tsx  (ClerkProvider + SmoothScroll + CursorFX + fonts)
│
├── app/page.tsx ─────────────► JourneyExperience(demo data)
├── app/about ─┐
├── app/pricing┴► Navbar + landing/* sections + Footer
├── app/discover ──► KineticShowcase + DiscoverGallery   (real API)
├── app/destinations ──► DestinationsGlobe + destination grid  (demo data)
├── app/dashboard ──► StatsCards + TripGrid + CreateTripButton (real API)
├── app/profiles/[username] ──► FollowButton + TripCard grid   (real API)
├── app/trips/[id] ──► TripDetail (LikeButton + CommentThread) (real API)
└── app/trips/[id]/wander ──► JourneyExperience(real trip data) (real API)

Shared UI primitives: components/ui/* (Button, Card, TiltCard, TextReveal, Magnetic, GlowSurface, CursorFX)
Shared 3D: components/three/* (JourneyScene, Globe, ParticleBackground)
```

Component-by-component detail (purpose, props, reusability, refactor notes): [`10_COMPONENT_REGISTRY.md`](./10_COMPONENT_REGISTRY.md).
