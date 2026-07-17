# 17 — Technical Debt

> The honest ledger of known problems, from the Phase 0 audit. Each item: **what · where · impact · fix (ticket).** Prioritized. This is *the* reference for "is this a known issue?" before you spend time debugging.
>
> Severity: 🔴 correctness/security · 🟠 maintainability/duplication · 🟡 dead weight/cleanup · 🔵 modeled-but-unbuilt (roadmap, not debt per se).

---

## 🔴 Correctness & Security

**✅ RESOLVED in Phase 0 (hardening pass — see [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md) ADR-011..014, verified by build + 56/56 tests):**

| # | Problem | Where | Ticket | Status |
|---|---|---|---|---|
| 1 | ~~Unguarded `POST /v1/auth/sync`~~ — now guarded; `clerkId` from verified JWT, not body | `auth.controller.ts` | WV-101 | ✅ Fixed |
| 2 | ~~`duplicateTrip` skips access control~~ — now runs `getAccessibleTrip` first | `trips.service.ts` | WV-102 | ✅ Fixed |
| 3 | ~~DB errors masked as 409~~ — now checks Prisma `P2002` specifically; others propagate | `trips.likeTrip`, `comments.like`, `social.follow` | WV-103 | ✅ Fixed |
| 4 | ~~Env validation is a no-op~~ — now runs `class-validator`; required vars fail fast at boot | `config/env.validation.ts` | WV-104 | ✅ Fixed |
| 7 | ~~Untyped story update body (`dto: any`)~~ — now typed `UpdateStoryDto` + validated | `stories.controller.ts` | WV-108 | ✅ Fixed |

**⚠️ Still open:**

| # | Problem | Where | Impact | Fix |
|---|---|---|---|---|
| 5 | ~~**No Clerk webhook sync**~~ — `POST /v1/webhooks/clerk` (svix-verified) now mirrors `user.created/updated/deleted` | `webhooks/webhooks.controller.ts` | — | ✅ Fixed (WV-201; see `21_PRODUCT_REVIEW.md` Phase 2) |
| 6 | **S3 objects leak** — *media delete now cleans its object (best-effort)*; trip/account **cascade** deletes still orphan objects | `media.service.ts` (fixed) · `trips/users` cascade (open) | Storage cost on bulk deletes | WV-107 (remaining: cascade cleanup job) |
| 8 | **`@CurrentUser()` returns null if guard forgotten** — no failure, just silent `undefined` userId | `current-user.decorator.ts` | Latent auth footgun on new routes | Convention: always pair with `@UseGuards`; consider guarding globally |
| 9 | ~~**Denormalized counters can drift**~~ — counter updates now run in the same `$transaction` as their row mutations (trips/comments/media/likes) | `Trip.*Count` fields | Residual risk only if a *new* mutation forgets the pattern | ✅ Fixed (Phase 1 review pass; see `21_PRODUCT_REVIEW.md`) |

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
| 16 | ~~**`postprocessing` is a transitive import**~~ — now a direct dependency | `apps/web/package.json` | ✅ Fixed (WV-111) |
| 17 | ~~**Redis config duplicated / `RedisModule` dead**~~ — dead module deleted; `ioredis` now genuinely used by `RedisThrottlerStorage` (rate limits shared across instances when `REDIS_HOST` is set) | `common/throttler/redis-throttler.storage.ts` | ✅ Fixed |
| 18 | **Configured-but-inert Nest modules** — `EventEmitter`, `Schedule` registered, no consumers. *(`Throttler` is now enforced — WV-901 ✅ resolved in Phase 0.)* | `app.module.ts` | Use or remove `EventEmitter`/`Schedule` |
| 19 | **`Comment.parentId` is a plain string, not a FK** — integrity only in app code | `schema.prisma` | Convert to self-relation (future migration) |
| 20 | **Empty `AppService`** | `app.service.ts` | Remove or use |

---

## 🟡 Dead Weight & Cleanup

**✅ RESOLVED in Phase 0 cleanup:**
- **#21 Dead `MapViewer` component** — removed (`components/map/` folder deleted), freeing `mapbox-gl`/`@types/mapbox-gl`.
- **#22 Legacy `wander-demo.html`** — removed; `QUICKSTART.md` given a deprecation banner.
- **#23 Unused deps** — 15 removed (FE: `gsap`, `zustand`, `@mapbox/mapbox-gl-draw`, `mapbox-gl`; BE: `@nestjs/jwt`, `passport*`, `@nestjs/mapped-types`, `joi`, `zod`, `ms`, `@nestjs/axios`, `mapbox-gl`). The Phase 2/3 review pass then removed the remaining dead scaffolding (`@stripe/*`, `stripe`, `sharp`, websocket pkgs, `lenis`) — `svix` stayed and is now used by the Clerk webhook controller.
- **#27 `@types/three`** — moved to `devDependencies`.

**⚠️ Still open:**

| # | Problem | Where | Fix |
|---|---|---|---|
| 24 | **Unused `lib/utils.ts` exports** — `formatFileSize`, `generateTripSlug`, `easeOutCubic/InOutCubic`, `lerp`, `clamp`, `mapRange` | `lib/utils.ts` | Low priority; keep (tested) or prune |
| 25 | **Dead API endpoint** — `GET /v1/auth/me` stub | `auth.controller.ts` | Remove |
| 26 | **Unreachable AI enum values** — 5 `AIJobType`s with no endpoint/processor case | `ai/`, `schema.prisma` | Implement (WV-801) or trim |

---

## 🟡 Stale docs / broken links

| # | Problem | Where | Fix |
|---|---|---|---|
| 28 | **`QUICKSTART.md` partially stale** — a deprecation banner + corrections were added in Phase 0 pointing to the numbered docs; the body still has some outdated setup steps | `QUICKSTART.md` | Finish aligning the body with the numbered docs |
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

## Debt scoring (updated end of Phase 0)
- **Correctness/security:** was 9 items → **5 resolved in Phase 0** (WV-101/102/103/104/108); **4 remain** (#5 webhook sync, #6 S3 leak, #8 guard footgun, #9 counter drift), none blocking.
- **Maintainability/duplication:** 11 items — mostly mechanical, low-risk; throttling (#18) now enforced. Frontend API-client consolidation (#10, WV-105) is the main remaining one.
- **Cleanup:** the safe removals (#21/#22/#23/#27) are **done**; a few low-priority prune candidates remain (#24/#25/#26).

Overall the debt is **moderate, well-contained, and now materially reduced**: the risky correctness/security items were fixed in Phase 0; what remains is either duplication (easy, ticketed) or intentional roadmap scaffolding. See the updated Technical Debt Score in [`PHASE_0_COMPLETION_REPORT.md`](./PHASE_0_COMPLETION_REPORT.md).


### Designated future additions
- **Toasts:** a single token-styled `ToastProvider` now lives in `components/ui/toaster.tsx` (mounted in the root layout, reduced-motion aware). Use `useToast()` for all transient feedback — don't add a second notification idiom.
