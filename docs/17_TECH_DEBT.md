# 17 — Technical Debt

> The honest ledger of known problems, from the Phase 0 audit. Each item: **what · where · impact · fix (ticket).** Prioritized. This is *the* reference for "is this a known issue?" before you spend time debugging.
>
> Severity: 🔴 correctness/security · 🟠 maintainability/duplication · 🟡 dead weight/cleanup · 🔵 modeled-but-unbuilt (roadmap, not debt per se).

---

## 🔴 Correctness & Security (fix in Phase 1)

| # | Problem | Where | Impact | Fix |
|---|---|---|---|---|
| 1 | **Unguarded `POST /v1/auth/sync`** — anyone can overwrite any user's profile by supplying a `clerkId` | `auth.controller.ts` / `auth.service.ts` | Account data tampering | WV-101 |
| 2 | **`duplicateTrip` skips access control** — any user can duplicate any trip (incl. PRIVATE) by id | `trips.service.ts` | Privacy leak | WV-102 |
| 3 | **DB errors masked as 409** — broad `catch` blocks assume unique-violation | `trips.likeTrip`, `comments.like`, `social.follow` | Real failures reported as conflicts; hidden 500s | WV-103 |
| 4 | **Env validation is a no-op** — `validate()` never runs `class-validator`; required vars not enforced at boot | `config/env.validation.ts` | App boots with missing `DATABASE_URL`/`CLERK_SECRET_KEY`, fails lazily | WV-104 |
| 5 | **No Clerk webhook sync** — Clerk-side profile/email/delete changes never reach the DB; guard's upsert never refreshes existing users | `webhooks/` (empty) + `clerk-auth.guard.ts` | Stale user data | WV-201 |
| 6 | **S3 objects leak on media delete** — DB row deleted, object orphaned | `media.service.ts` (~line 172 TODO) | Storage cost + quota drift | WV-107 |
| 7 | **Untyped story update body** (`dto: any`) bypasses validation | `stories.controller.ts` | Unvalidated writes | WV-108 |
| 8 | **`@CurrentUser()` returns null if guard forgotten** — no failure, just silent `undefined` userId | `current-user.decorator.ts` | Latent auth footgun on new routes | Convention: always pair with `@UseGuards`; consider guarding globally |
| 9 | **Denormalized counters can drift** — maintained only in app code | `Trip.*Count` fields | Wrong stats if a mutation forgets to update | Discipline + a reconciliation job later |

---

## 🟠 Maintainability & Duplication (Phase 1 opportunistic)

| # | Problem | Where | Fix |
|---|---|---|---|
| 10 | **Frontend API helpers copy-pasted** — `API_URL`+`unwrap`+`authHeaders` in 4 files, plus raw `fetch` in `follow-button.tsx` | `lib/api.ts`, `lib/trip-api.ts`, `lib/comments-api.ts`, `lib/notifications-api.ts`, `components/profile/follow-button.tsx` | WV-105 |
| 11 | **Backend pagination duplicated** — hand-rolled `take/skip/cursor` in 5 services; sort-maps duplicated | trips/media/comments/notifications/social services | WV-106 |
| 12 | **Two navbars** share nav links + auth logic | `layout/navbar.tsx`, `journey/journey-nav.tsx` | Extract shared nav config/hook |
| 13 | **Cover/media-URL resolution duplicated** | `trip-detail.tsx`, `trip-grid.tsx`, `trip-to-journey.ts` | Extract a `resolveMediaUrl` util |
| 14 | **`toVector3` duplicated** (lat/lng→sphere) | `three/globe.tsx`, `three/journey-scene.tsx` | Extract to a shared three util |
| 15 | **Date formatting overlap** | `lib/utils.ts` vs `trip-card.tsx` local `formatRange` | Consolidate into `utils` |
| 16 | **`postprocessing` is a transitive import** (not a direct dep) | `three/journey-scene.tsx` | WV-111 |
| 17 | **Redis config duplicated / `RedisModule` dead** — BullMQ configures Redis directly in `app.module`; `REDIS_CLIENT` has no consumers; `trips.module` imports `RedisModule` pointlessly | `app.module.ts`, `redis/`, `trips.module.ts` | Unify Redis config; remove dead module/import |
| 18 | **Configured-but-inert Nest modules** — `EventEmitter`, `Schedule`, `Throttler` registered, no consumers (throttling not enforced!) | `app.module.ts` | Use or remove; enforce throttling (WV-901) |
| 19 | **`Comment.parentId` is a plain string, not a FK** — integrity only in app code | `schema.prisma` | Convert to self-relation (future migration) |
| 20 | **Empty `AppService`** | `app.service.ts` | Remove or use |

---

## 🟡 Dead Weight & Cleanup (Phase 0 target)

| # | Problem | Where | Fix |
|---|---|---|---|
| 21 | **Dead component `MapViewer`** — imported nowhere; also missing `"use client"` | `components/map/map-viewer.tsx` | Remove (frees `mapbox-gl`/`@types/mapbox-gl`) |
| 22 | **Legacy prototype `wander-demo.html`** — 607-line vanilla prototype superseded by the real journey; referenced by stale QUICKSTART path | `public/wander-demo.html` | Remove or move to `docs/prototypes/` |
| 23 | **Unused deps** — FE: `gsap`, `zustand`, `@stripe/*`, `@mapbox/mapbox-gl-draw`, `mapbox-gl`. BE: `@nestjs/jwt`, `passport*`, `@nestjs/mapped-types`, `joi`, `zod`, `ms`, `@nestjs/axios`, `mapbox-gl`, (planned: `stripe`/`svix`/`sharp`) | both `package.json` | WV-110 (see [`13_DEPENDENCY_GUIDE.md`](./13_DEPENDENCY_GUIDE.md)) |
| 24 | **Unused `lib/utils.ts` exports** — `formatFileSize`, `generateTripSlug`, `easeOutCubic/InOutCubic`, `lerp`, `clamp`, `mapRange` | `lib/utils.ts` | Low priority; keep (tested) or prune |
| 25 | **Dead API endpoints** — `GET /v1/auth/me` stub | `auth.controller.ts` | Remove |
| 26 | **Unreachable AI enum values** — 5 `AIJobType`s with no endpoint/processor case | `ai/`, `schema.prisma` | Implement (WV-801) or trim |
| 27 | **`@types/three` in `dependencies`** (should be devDeps) | `apps/web/package.json` | Move |

---

## 🟡 Stale docs / broken links

| # | Problem | Where | Fix |
|---|---|---|---|
| 28 | **`QUICKSTART.md` stale** — references nonexistent `components/story/WanderView`, claims GSAP+Mapbox power the app, has wrong absolute paths (`Documents/Personal/Kimi/...` vs `wonderer/`) | `QUICKSTART.md` | Update to match the numbered docs |
| 29 | **~10 dead footer/nav links** — `/features`, `/templates`, `/integrations`, `/blog`, `/help`, `/api`, `/changelog`, `/careers`, `/privacy`, `/terms` (only `/about`,`/pricing` exist); social icons → `#` | `components/layout/footer.tsx` | Build pages or remove links |
| 30 | **Non-functional UI stubs** — TripDetail Edit/Share buttons (no handlers); `/destinations/[id]` "coming soon" copy | `trip-detail.tsx`, `app/destinations/[id]/page.tsx` | Implement in relevant phase |

---

## 🔵 Modeled-but-Unbuilt (roadmap, not "debt" — don't build on these)

Empty modules: `payments`, `webhooks`, `analytics`, `exports`.
Placeholders: Mapbox geocoding (`[]`), AI photo-enhance (fake), media `/process` (no-op), map styles (static).
Dead schema: `Session`, `Invoice`, `Export`, `UserActivity`, `MapTileCache`, `Challenge`, `ChallengeEntry`.
Never-populated fields: `AIJob.costUsd`, `Media.variants`.

These map to roadmap phases (see [`07_ROADMAP.md`](./07_ROADMAP.md)); WV-109 decides keep-vs-remove for the truly speculative ones.

---

## Debt scoring (Phase 0 baseline)
- **Correctness/security:** 9 items — the priority for Phase 1.
- **Maintainability/duplication:** 11 items — mostly mechanical, low-risk.
- **Cleanup:** ~7 items — Phase 0 removes the safe ones.

Overall the debt is **moderate and well-contained**: the risky items are few, specific, and cheap to fix; most "debt" is either duplication (easy) or intentional scaffolding (roadmap). See the Technical Debt Score in the Phase 0 audit report.
