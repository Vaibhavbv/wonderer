# 21 — Production Review & Phased Roadmap (2026-07)

> A full-stack, production-grade review of Wanderverse — every route, module, and contract — with the goal of making the product stable, coherent, and polished. Each finding: **what · where (`file:line`) · why it matters.** Items already tracked in [`17_TECH_DEBT.md`](./17_TECH_DEBT.md) are marked **(known: #n)** rather than re-reported as new.
>
> Severity: 🔴 critical (broken flow / security) · 🟠 high · 🟡 medium · 🔵 low/polish.
>
> Method: three parallel code audits (backend, frontend, cross-cutting contract/infra/tests), with every critical claim re-verified by direct source read. No code was changed.

---

## Executive summary

**What's genuinely solid.** The CRUD/social core is coherent: correct cursor pagination everywhere, disciplined DB-cuid vs Clerk-id separation, ownership checks on media/notifications/stories/comment/trip-edit paths, `P2002 → 409` race handling for likes/follows, public-profile selects that use explicit allowlists (no email/Stripe leakage), env validation at boot, and a real CI pipeline running lint/typecheck/migrations/build/tests against live Postgres + Redis. On the frontend, the signature journey scene (`components/three/journey-scene.tsx`) is production-grade WebGL — correctly `ssr:false`-isolated, perf-tiered for coarse pointers, ref-driven per-frame updates — and the `unwrap`/`ApiError` API layer is applied consistently with good empty-vs-error state discipline. The `/docs` set is honest; "MODELED ≠ BUILT" checks out exactly as documented.

**What blocks production.** Three classes of problem:

1. **The dashboard's trip list is broken by inspection.** `GET /v1/trips` rejects the exact query params the frontend always sends (§B-1). No controller test or e2e covers it, so CI can't see it.
2. **Two authorization holes (IDOR).** Any authenticated user can run AI story generation against any private trip and read the result (§B-2), and can attach media rows to any other user's trip while inflating its counters (§B-3).
3. **The core product loop is closed.** "Public" trips cannot be viewed by a signed-out visitor, shared links dead-end at sign-in, profile trip cards aren't clickable, and Discover never links to a trip (§F-1..F-4). For an "Instagram for your travel life," the share → view → sign-up loop does not exist. Meanwhile the pricing page sells paid tiers with no checkout, for features whose backend modules are empty stubs (§F-5).

**Verdict:** the foundation is better than most projects at this stage — but it is not production-ready until Phase 1 below is done. Phase 1 is small, surgical, and high-leverage: roughly a dozen fixes, each pinned to a file and line.

---

## A. Verified critical bugs (fix before anything else)

### B-1 🔴 `GET /v1/trips` 400s on the frontend's own query params
- **Where:** `apps/api/src/trips/trips.dto.ts:226-241` + `apps/api/src/trips/trips.controller.ts:23-29` + `apps/web/lib/trip-api.ts:89`
- **What:** `listTrips` binds `@Query() query: TripListQueryDto` *and* `@Pagination()`. The DTO whitelists only `status`/`privacy`/`search`, but the global pipe (`main.ts:49-54`) runs `whitelist + forbidNonWhitelisted`. The frontend always calls `/v1/trips?per_page=50&sort=created_at:desc` → `BadRequestException`. Swagger even documents `sort`/`cursor`/`per_page` via `@ApiQuery` — the validator rejects what the API advertises. This is the only endpoint combining a validated `@Query()` DTO with the `@Pagination()` decorator; all other lists use `@Pagination()` alone and are unaffected.
- **Why invisible:** zero controller-level tests; the e2e suite never calls `/v1/trips` with a token.
- **Fix:** add `per_page`/`sort`/`cursor` as `@IsOptional()` fields to `TripListQueryDto` (they're consumed by the decorator, but must pass the whitelist), plus a controller test pinning the regression.

### B-2 🔴 IDOR — AI generation reads any user's private trip
- **Where:** `apps/api/src/ai/ai.service.ts:16-53` + `apps/api/src/ai/ai.processor.ts:90-93`
- **What:** `queueJob` accepts `input.tripId` with no ownership/access check; the processor `findUnique`s the trip with locations + media and returns the generated narrative (built from the victim's location names, notes, dates) in the job `result`, readable via `getJobStatus` (which only checks *job* ownership). The same class of hole exists for `ENHANCE_PHOTO`'s `mediaId` (currently masked only because enhance is a stub).
- **Fix:** validate trip/media access in `queueJob` before enqueuing — reuse the `getAccessibleTrip` pattern from `trips.service.ts`.

### B-3 🔴 IDOR — presigned upload trusts `dto.tripId` (cross-tenant writes + counter corruption)
- **Where:** `apps/api/src/media/media.service.ts:28-78`
- **What:** any authenticated user can request an upload URL against **another user's trip** — creating a `Media` row on the victim's trip and incrementing its `photosCount`/`videosCount` (lines 72-78). Data-integrity attack plus pollution of victim trips.
- **Fix:** assert the caller can edit `dto.tripId` (the `getEditableTrip` check) before creating the row.

### B-4 🔴 The public sharing loop does not exist
- **Where:** `apps/web/app/trips/[id]/page.tsx:10-11`, `apps/web/lib/trip-api.ts:140`, `components/trips/share-button.tsx:26`
- **What:** the trip page hard-redirects signed-out users to `/`, and `getTrip()` always sends a bearer token — so there is **no route anywhere** that renders a PUBLIC trip to an anonymous visitor. `ShareButton` copies `window.location.href`, which dead-ends every recipient at sign-in. The `PUBLIC`/`UNLISTED` privacy tiers are meaningless from the outside.
- **Fix:** optional-auth read on `GET /v1/trips/:id` for PUBLIC/UNLISTED trips + remove the frontend redirect for public trips (render signed-out with a sign-up CTA).

### B-5 🔴 Primary nav links to a route that doesn't exist
- **Where:** `apps/web/components/layout/app-sidebar.tsx:21` — `{ label: "Journey", href: "/journey" }`. There is no `app/journey/` (verified). A persistent sidebar item on `/dashboard` and every trip page 404s.

### B-6 🔴 Profile trips are dead-ends; Discover never reaches a trip
- **Where:** `apps/web/app/profiles/[username]/page.tsx:106` renders `<TripCard>` with no `<Link>` wrapper (feed and discover wrap it externally; the profile page forgot). `components/discover/discover-gallery.tsx:119-124` — the expanded overlay's only CTA is "View profile"; there is no path from browsing Discover to actually watching a journey. Combined with B-4, the discover → experience funnel is fully closed.

### B-7 🔴 UNLISTED privacy + duplicate cloning
- **Where:** `apps/api/src/trips/trips.service.ts:129-131, 179-222, 248-250`
- **What:** `getAccessibleTrip` allows anything not `PRIVATE`, and `duplicateTrip` uses that read-guard — so any authenticated user can **clone another user's UNLISTED trip wholesale** into their own account. Meanwhile collaborators (VIEWER/EDITOR) get 403 on *reading* a PRIVATE trip even though `getEditableTrip` grants them *write* — the read/write guards disagree.
- **Fix:** duplicate should require ownership (or explicit collaboration); `getAccessibleTrip` should grant collaborators read.

### B-8 🟠 Docker image cannot build; healthcheck hits a nonexistent path
- **Where:** `apps/api/docker/Dockerfile` — `npm ci --only=production` (line 8) omits the devDependencies (`@nestjs/cli`, `prisma`) that lines 14/17 require, so the build fails; `HEALTHCHECK` targets `/health` but URI versioning makes the real path `/v1/health`. `render.yaml` gets both right — the two deploy paths disagree and the Docker one can't succeed.

---

## B. Backend findings (apps/api)

### Security & correctness
| # | Sev | Finding | Where |
|---|---|---|---|
| S-1 | 🟠 | **Storage quota unenforceable** — `storageUsedBytes` is read for the quota check but never written anywhere in the codebase; it is permanently `0`. | `media.service.ts:32-35` |
| S-2 | 🟠 | **S3 objects never deleted** on media/trip/account deletion — DB cascades, bucket orphans forever. Account deletion (GDPR) leaves all media in S3 and doesn't cancel Stripe. **(known: #6/WV-107)** | `media.service.ts:172`, `users.service.ts:112-116` |
| S-3 | 🟠 | **Counter drift** — `likesCount`/`commentsCount`/`photosCount`/`tripCount` are mutated in a second, non-transactional `update` after the row change (likes, unlikes, comments, media, create/delete/duplicate trip). Crashes or races drift the counters. Only `reorderLocations`/`removeLocation` use `$transaction`. **(known: #9, but the fix — wrap in transactions — is cheap and should not wait for a "reconciliation job later")** | `trips.service.ts:390-424`, `comments.service.ts:40-181`, `media.service.ts:58-78` |
| S-4 | 🟠 | **Counters counted at presign time, not upload completion** — abandoned uploads permanently inflate `photosCount`/`videosCount`; `processingStatus: 'uploading'` is never flipped (no confirm endpoint). | `media.service.ts:68-78` |
| S-5 | 🟠 | **`Pagination` decorator bypasses the ValidationPipe** — `per_page=abc` → `NaN` → `Math.min(NaN,100)` = `NaN` handed to Prisma; `sort` is free-form and only sanitized in some services. | `common/decorators/pagination.decorator.ts:7` |
| S-6 | 🟠 | **Throttler is in-memory** — per-process limits are defeated by >1 instance; the unauthenticated `/discover` + `/profiles/*` endpoints are the most abuse-prone. Redis is already a dependency. | `app.module.ts:42-50` |
| S-7 | 🟠 | **Clerk guard weaknesses** — `verifyToken` called with `issuer: null`, no audience/authorizedParties; users upserted from an unvalidated `email` claim (collision → raw P2002 surfacing as 401); placeholder-email fallback. | `common/guards/clerk-auth.guard.ts:32-55` |
| S-8 | 🟡 | **Prompt injection surface** — `userPrompt`, trip titles, and location names are concatenated raw into the GPT-4o prompt. Low blast radius today (output is a story), but unbounded free-text injection. | `ai.processor.ts:96-130` |
| S-9 | 🟡 | **`batch-presigned-urls` takes a raw top-level array** — element decorators don't run without `ParseArrayPipe`; only guard is a `>50` length check. | `media.controller.ts:22-29` |
| S-10 | 🟡 | **Unbounded JSON payloads** — trip `theme` and story `blocks` are `Record<string, any>` with no shape/size cap (DoS via giant payload). | `trips.dto.ts`, `stories` DTOs |
| S-11 | 🔵 | **CORS `origin: true` + `credentials: true`** when `CORS_ORIGINS='*'` (the default) — fine for dev, dangerous default for prod. | `main.ts:25-40` |
| S-12 | 🔵 | **Fake health probes** — `/v1/health` and `/v1/ready` return static values without pinging Postgres/Redis; a hung DB still reports ready. | `app.controller.ts` |

### AI pipeline
| # | Sev | Finding | Where |
|---|---|---|---|
| AI-1 | 🟡 | **Credits charged on enqueue, never refunded on failure**; `tokensUsed`/`costUsd` columns never persisted; `estimatedDuration: '15s'` and `confidence: 0.92` are hardcoded fabrications. | `ai.service.ts:43-52`, `ai.processor.ts` |
| AI-2 | 🟡 | **Wrong failure state machine** — the processor writes terminal `FAILED` + `completedAt` in its catch, then rethrows so BullMQ retries (`attempts: 3`): a job that succeeds on retry #2 spent time flagged FAILED. No "will retry" vs "gave up" distinction; `CANCELLED` never used. | `ai.processor.ts:76-87`, `app.module.ts:57-60` |
| AI-3 | 🔵 | 5 of 7 `AIJobType` enum values throw "Unsupported" — schema promises far more than exists. **(known: #26)** | `ai.processor.ts` |

### Stubs & dead surface (confirming MODELED ≠ BUILT)
- Empty `@Module({})`: `payments`, `webhooks`, `analytics`, `exports`. `svix`/`stripe` are installed and `CLERK_WEBHOOK_SECRET`/`STRIPE_WEBHOOK_SECRET` configured, but **no controller consumes them** — subscription state can never change, and Clerk-side user changes/deletions never reach the DB. **(known: #5/WV-201 for Clerk; the Stripe half means the pricing page is selling something unbuildable today — see F-5)**
- Fake services: geocoding returns `[]` (`maps.service.ts:101-119`); `/media/:id/process` no-op; AI photo enhance returns `{enhanced:true}`; route `durationMinutes = distance * 12` labeled `'transit'`.
- Zero-reference schema models: `Session`, `Invoice`, `Export`, `Challenge`, `ChallengeEntry`, `MapTileCache`, `UserActivity` — tables migrations will create but nothing reads or writes.

---

## C. Frontend findings (apps/web)

### Broken/incomplete flows
| # | Sev | Finding | Where |
|---|---|---|---|
| F-1..4 | 🔴 | Public sharing loop closed; `/journey` 404; inert profile cards; Discover dead-end — see §A B-4..B-6. | — |
| F-5 | 🔴 | **Pricing page sells vaporware** — Pro $9/Creator $19 CTAs open the Clerk sign-in modal (no Stripe checkout exists anywhere in the app), and listed features (premium map themes, watermark-free exports, sell itineraries, analytics, custom domain) map to empty backend stubs. Trust-destroying if shipped. | `components/landing/pricing-section.tsx:118-126` |
| F-6 | 🟡 | **Landing features section advertises unbuilt product** — bucket list, travel passport/stamps, auto-generated recap videos, "Moments" — none exist. | `components/landing/features-section.tsx:7-38` |
| F-7 | 🟡 | **Create-trip: duplicate-submission + orphaned trips** — trip is created *before* photo uploads; an upload failure leaves the dialog open with the trip already created, so retrying creates a second trip. `submitting` never resets on success. | `components/dashboard/create-trip-button.tsx:91-127` |
| F-8 | 🟡 | **Comment submit/reply/delete fail silently** — `try/finally` with no `catch`; no toast system exists anywhere in the app, so most mutation failures are invisible (share-copy failure also swallowed). | `components/trips/comment-thread.tsx:68-104`, `share-button.tsx:29` |
| F-9 | 🔵 | Optimistic like state not reverted when `getToken()` returns null. | `components/trips/like-button.tsx:44-60` |
| F-10 | 🔵 | Locations with blank coords default to `(0,0)` and render pins in the Gulf of Guinea in Wander; only `length === 0` is guarded. | `create-trip-button.tsx:99-100`, `app/trips/[id]/wander/page.tsx:26` |
| F-11 | 🔵 | `beforeunload` guard is a no-op (never sets `e.returnValue`). | `components/journal/journal-editor.tsx:65-67` |
| F-12 | 🔵 | Notification badge never live-updates (fetch on mount/open only). | `lib/use-notifications.ts` |

### Performance
| # | Sev | Finding | Where |
|---|---|---|---|
| P-1 | 🟡 | **Zero `next/image` usage** — every image is a raw `<img>` with no srcset/optimization; `next.config.ts` `remotePatterns` are configured and unused. User photo grids ship full-res. | `trip-detail.tsx:144`, `trip-editor.tsx:483`, everywhere |
| P-2 | 🔵 | N× `/users/me` round-trips per page — `useMe`, `CommentThread`, and server pages each independently resolve the viewer; no shared context. | `lib/use-me.ts`, `comment-thread.tsx:45` |
| P-3 | 🔵 | `TripDetail`/`StatsCards`/`TripGrid` are fully client components for entrance animations alone — the read-only trip page ships as client bundle when only Like/Share/Comments need it. | `components/trips/trip-detail.tsx` |
| P-4 | 🔵 | Unthrottled `scroll` handlers calling `setState` per frame (navbar, ScrollCue) — heavy with Lenis on mobile. | `navbar.tsx:19-22`, `journey-experience.tsx:202-205` |
| P-5 | 🔵 | Minor GC pressure: `new THREE.Color/Vector3` inside `useFrame` hot paths. | `journey-scene.tsx:197,337,441` |
| P-6 | 🔵 | `postprocessing` imported as a *transitive* dep of `@react-three/postprocessing` — fragile build. **(known: WV-111 adjacent)** | `journey-scene.tsx:7` |

### Accessibility & brand
| # | Sev | Finding | Where |
|---|---|---|---|
| A-1 | 🟡 | **Reduced-motion fallback still animates forever** — the 2D fallback renders `ParticleField`, whose infinite CSS `@keyframes fall` never checks `prefers-reduced-motion`. Defeats the fallback's purpose; violates the hard brand constraint in CLAUDE.md. | `journey-experience.tsx:97-102`, `components/journey/particle-field.tsx:44-54` |
| A-2 | 🟡 | **Second and third accents in active use** despite the single-coral rule — stats cards use amber (`accent-*`) and blue-gray (`secondary-*`) side by side; `primary→secondary` gradients in trip-detail/trip-grid/kinetic-showcase. | `stats-cards.tsx:16-17`, `trip-detail.tsx:29`, `trip-grid.tsx:110` |
| A-3 | 🔵 | Raw `bg-white/20 text-white` tag chips (token violation — should use the alpha-primary idiom). | `trip-detail.tsx:38` |
| A-4 | 🔵 | Navbar mobile toggle missing `aria-label`/`aria-expanded` (sidebar toggle does it right); `AiAssistPanel` dialog has no focus trap/initial focus/Escape; NotificationBell not keyboard-navigable; inconsistent avatar alt text. | `navbar.tsx:95-100`, `ai-assist-panel.tsx:122` |

### Dead code & structure
- Never mounted: `SmoothScroll` (→ `lenis` dep effectively unused), `CursorFX`, `destinations-globe.tsx` + `three/globe.tsx` + `three/particle-background.tsx` (~200 lines of dead R3F).
- `trip-editor.tsx` (689 lines, ~20 `useState`s, six independent forms) needs splitting into section components with a shared `withToken` helper.
- Gated pages (`dashboard`, `trips/[id]/*`, `settings/profile`) call `auth()` without the `CLERK_SECRET_KEY` env-guard that `app/page.tsx` and `middleware.ts` apply — boots without the key throw at request time on those routes.
- Segment `loading.tsx` exists only for `/dashboard`; `/discover`, `/profiles/[username]`, `/trips/[id]` block on server fetch with the generic root spinner. Only a root error boundary — a WebGL crash in `/wander` blows away the whole page.

---

## D. Contract, config, infra, tests

### Contract drift
- **`createTrip`/`updateTrip` return partial `TripRecord`** — the frontend type declares `media`/`coverPhoto`/`isLiked`; the service includes only `locations` (+`coverPhoto` on update). Masked by the `unwrap<T>` cast.
- **Built-but-unconsumed endpoints:** `auth/sync`, `auth/me` **(known: #25)**, `users/me/subscription`, `DELETE /users/me`, `trips/:id/duplicate`, `trips/:id/stats`, `media` batch-presign / trip-list / process, `ai/enhance-photo`, and the **entire Maps controller**. `15_PHASE_STATUS.md` claims duplicate "works end-to-end," but no frontend wrapper calls it.
- **`11_API_REFERENCE.md` drift:** presign response shape; health paths are really `/v1/health`/`/v1/ready` (URI versioning applies to `AppController`); AI generate returns `{jobId,status,estimatedDuration}`, not an `AIJob`.

### Config
- **No `apps/web/.env.example`** (the app reads `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`) — new devs have no template.
- Dead vars: `NEXT_PUBLIC_MAPBOX_TOKEN` (plumbed in `next.config.ts:27`, used nowhere), `ANTHROPIC_API_KEY` (validated in `env.validation.ts:74`, no SDK, no consumer).
- Graceful degradation is genuinely good for OpenAI (lazy client), S3 (empty-string creds, fails at request time), and Clerk-frontend (ADR-017 guard) — but BullMQ enqueues error without Redis, so "boots without Redis" holds only until an AI job is queued.

### Infra
- `docker-compose.yml` provisions a **Meilisearch** service nothing references (no client dep, zero code refs).
- `DEPLOYMENT.md` is stale — still centers Mapbox as a core service and describes Redis as "sessions."
- CI: the API job is real (lint → tsc → prisma migrate → build → unit → e2e against live PG+Redis), but the e2e suite is 4 assertions and **no authenticated success path is ever tested** — consistent with the "backend never run e2e" note in `15_PHASE_STATUS.md`. The API `lint` script runs `eslint --fix` (auto-mutating in CI). Web lint is `continue-on-error` because `eslint-config-next` isn't installed.

### Dependency dead weight
- Backend: `ioredis` (only the dead `RedisModule` **(known: #17)**), `sharp`, `stripe`, `svix`, `@nestjs/websockets` + `platform-socket.io`. `@clerk/clerk-sdk-node@^4` is a deprecated SDK line paired with `@clerk/nextjs@^6` on the web.
- Frontend: `@stripe/react-stripe-js` + `@stripe/stripe-js` (zero usage). GSAP/Mapbox/Zustand removals are genuinely complete. ✓

### Test posture
- Backend: 5 service specs (users, social, trips, notifications, comments) + a thin e2e. **No specs** for the highest-risk code: `media.service`, `ai.service`/`ai.processor` (the IDOR areas), `stories`, `maps`, the auth guard, interceptor, or filter. **No controller tests anywhere** — which is exactly why B-1 is invisible.
- Frontend: 7 lib-client specs + `like-button.spec.tsx`; zero component tests for the editor, upload pipeline, or journey rendering.

---

## E. Phased roadmap

### Phase 1 — Critical fixes (make it stable & safe)
*Goal: no broken primary flow, no authorization holes. Every item is small and pinned.*

> **Status: ✅ implemented** (all 12 items below) in the follow-up change on this doc's branch — trips-list 400, both IDORs, privacy model, public trip view, dead navigation, transactional counters, pagination/batch validation, Dockerfile, Clerk guard hardening, pricing de-risk, and CORS defaults. Regression specs added for the DTO whitelist, AI access control, trip privacy, and duplicate ownership.

1. **Fix `GET /v1/trips` 400** — add `per_page`/`sort`/`cursor` as `@IsOptional()` fields to `TripListQueryDto`; add a controller test pinning it. (`trips.dto.ts:226`)
2. **Close the AI IDOR** — validate trip access in `AiService.queueJob` before enqueue, reusing `getAccessibleTrip`. (`ai.service.ts:16`)
3. **Close the media IDOR** — require edit-rights on `dto.tripId` in `getPresignedUrl` (the `getEditableTrip` check). (`media.service.ts:28`)
4. **Fix the privacy model** — `duplicateTrip` requires ownership; collaborators get read on PRIVATE trips (align `getAccessibleTrip` with `getEditableTrip`). (`trips.service.ts`)
5. **Open the public loop** — optional-auth `GET /trips/:id` for PUBLIC/UNLISTED; public trip page render for signed-out visitors with a sign-up CTA. (`app/trips/[id]/page.tsx`, `trip-api.ts`)
6. **Fix dead navigation** — remove/redirect the `/journey` sidebar link; wrap profile `TripCard`s in `Link`; add "View trip" / "Wander" CTA to the Discover overlay.
7. **Transactional counters** — wrap every denormalized counter update in `$transaction` with its row change (likes, comments, media, tripCount).
8. **Harden `Pagination` decorator** (NaN-proof `per_page`, sort allowlist) and validate `batch-presigned-urls` with `ParseArrayPipe`.
9. **Fix the Dockerfile** (`npm ci --include=dev`; healthcheck `/v1/health`) so the two deploy paths agree.
10. **Harden the Clerk guard** — pass `authorizedParties`/issuer to `verifyToken`; handle email `P2002` collisions gracefully.
11. **Stop selling vaporware** — mark paid tiers "coming soon" (or gate `/pricing`) and trim the features section to what exists. Cheapest possible fix; enormous trust payoff.
12. **Lock CORS defaults** for production (`CORS_ORIGINS` explicit, no `origin:true`+credentials).

### Phase 2 — UX & functionality (make it feel finished)
1. **Toast/feedback layer** — one lightweight provider; wire comment/share/create/like failures into it (today most failures are invisible).
2. **Create-trip flow** — create the trip only after uploads succeed (or make retry idempotent); reset `submitting`; close the dialog on success.
3. **Upload lifecycle** — add a confirm-upload endpoint that flips `processingStatus` and counts photos/videos on confirmation, not presign; start writing `storageUsedBytes` there so the quota becomes real.
4. **AI job lifecycle** — refund credits on terminal failure; only write `FAILED` when retries are exhausted; persist `tokensUsed`/`costUsd`.
5. **Clerk webhook controller** (svix verification) — user create/update/delete sync (WV-201). Stripe webhooks only when billing is actually being built.
6. **Reduced-motion compliance** — `ParticleField`/`RouteVehicle` honor `prefers-reduced-motion` (hard brand constraint).
7. **S3 deletion job** — BullMQ cleanup on media/trip/account delete (WV-107; also the GDPR gap).
8. **Route-level polish** — skeletons for `/discover`, `/profiles/[username]`, `/trips/[id]`; segment error boundary for `/wander`; missing-coordinates guard in the Wander view.
9. **Live-ish notifications** — poll interval or refetch-on-focus for the unread badge.

### Phase 3 — Performance & codebase (make it scale and stay maintainable)
1. **`next/image` adoption** across covers, avatars, grids (the config is already there).
2. **Shared viewer context** — one `/users/me` resolution per page.
3. **Server/client split** — `TripDetail`/`StatsCards`/`TripGrid` become server shells with client islands (Like/Share/Comments).
4. **rAF-throttle scroll handlers** (navbar, ScrollCue).
5. **Redis-backed throttler storage**; real `/health`/`/ready` probes (DB + Redis ping).
6. **Dead-code and dead-dep purge** — `destinations-globe`/`globe`/`particle-background`/`SmoothScroll`/`CursorFX`; drop `@stripe/*` (web), `ioredis`+`RedisModule`, `sharp`, `websockets` (or ticket each with a date); make the `postprocessing` import direct; remove Meilisearch from compose; delete dead env vars (`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`).
7. **Split `trip-editor.tsx`** into per-section components with a shared `withToken` helper.
8. **Schema pruning** — remove or explicitly ticket the seven zero-reference models so migrations stop creating dead tables.
9. **Test the risk** — specs for `media.service`, `ai.service`/`processor`, the Clerk guard; one authenticated e2e happy path; controller test layer. Fix `lint` to not `--fix` in CI; install `eslint-config-next` so web lint gates.
10. **Contract cleanup** — complete `TripRecord` returns from create/update; correct `11_API_REFERENCE.md` (health paths, presign shape, AI return); add `apps/web/.env.example`; migrate off `@clerk/clerk-sdk-node@^4`.

### Phase 4 — Premium polish (make it delightful)
1. **A11y pass** — focus trap + Escape for `AiAssistPanel`; `aria-expanded` on the navbar toggle; keyboard-navigable NotificationBell; consistent avatar alt text.
2. **Brand consolidation** — single coral accent (fix the amber/blue stats cards, `primary→secondary` gradients, `bg-white/20` chips) per the design system.
3. **Micro-interactions** — like/save feedback, `beforeunload` fix, empty-state illustrations.
4. **Journey scene GC pass** — hoist `new THREE.Color/Vector3` out of `useFrame`.
5. **Continuity** — view transitions discover → trip → wander; shared-element cover photo.
6. **Public-web presence** (unlocked by Phase 1 §5) — OG images for public trip pages, sitemap for profiles/discover.

---

## Appendix — verification notes

The five highest-stakes claims were re-verified by direct source read before this report was written: `trips.dto.ts:226-241` + `trips.controller.ts:23-29` + `main.ts:49-54` (B-1), `ai.service.ts:16-53` (B-2), `media.service.ts:28-78` (B-3), absence of `app/journey/` (B-5), and `trip-api.ts:89` (the query string the dashboard always sends). Line numbers reflect the repo at the time of review (branch `main` @ `0354c74`).
