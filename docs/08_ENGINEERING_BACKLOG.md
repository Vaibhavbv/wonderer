# 08 — Engineering Backlog

> Concrete, actionable tickets derived from the Phase 0 audit. Grouped by roadmap phase. **Implementation is intentionally left for future phases** — these are specs, not work orders to execute now.
>
> **Fields:** ID · Title · Description · Dependencies · Acceptance Criteria (AC) · Definition of Done (DoD) · Priority (P0 critical → P3 nice-to-have) · Complexity (S/M/L/XL).
> **Global DoD (applies to every ticket unless noted):** types pass, lint passes, tests added/passing, response contract preserved (or both sides updated), relevant `/docs` updated, [`20_CHANGELOG.md`](./20_CHANGELOG.md) entry added.

---

## Phase 1 — Stabilization & Debt Paydown

### WV-101 — Secure or remove `POST /v1/auth/sync`  ✅ DONE (Phase 0, ADR-011)
- **Description:** The endpoint is unguarded; anyone can overwrite any user's profile by supplying a `clerkId`. Either guard it (and scope updates to the authenticated user) or delete it (the `ClerkAuthGuard` already auto-provisions users).
- **Dependencies:** none.
- **AC:** No unauthenticated caller can mutate another user's `email`/`displayName`/`avatarUrl`. Existing sign-in/provisioning still works.
- **DoD:** + a test proving an unauthenticated/cross-user sync is rejected.
- **Priority:** P0 · **Complexity:** S
- **Resolution:** Guarded with `ClerkAuthGuard`; `clerkId` now derived from the verified JWT (`@CurrentUser('clerkId')`), removed from `SyncUserDto`. Confirmed no frontend caller exists.

### WV-102 — Add ownership/privacy check to `TripsService.duplicateTrip`  ✅ DONE (Phase 0)
- **Description:** `duplicateTrip` doesn't call the access check, so any authenticated user can duplicate any trip (including PRIVATE) by id. Add the same `getAccessibleTrip` gate used elsewhere.
- **Dependencies:** none.
- **AC:** Duplicating a trip the caller can't access returns 403/404; duplicating own/accessible trips still works.
- **DoD:** + regression test.
- **Priority:** P0 · **Complexity:** S
- **Resolution:** `duplicateTrip` now calls `getAccessibleTrip(tripId, userId)` before cloning.

### WV-103 — Stop masking DB errors as 409 conflicts  ✅ DONE (Phase 0, ADR-014)
- **Description:** `likeTrip`, `comments.like`, `social.follow` (and similar) `catch` all errors and throw `ConflictException`. Narrow to `e.code === 'P2002'`; rethrow everything else.
- **Dependencies:** none.
- **AC:** A genuine unique-violation → 409; any other DB error → 500 (not masked).
- **Priority:** P1 · **Complexity:** S
- **Resolution:** All 3 sites check `Prisma.PrismaClientKnownRequestError && code === 'P2002'`; 3 spec tests updated to real P2002 + 3 new tests prove non-conflict errors propagate.

### WV-104 — Make env validation actually validate  ✅ DONE (Phase 0, ADR-012)
- **Description:** `env.validation.ts` `validate()` never runs `class-validator`. Wire `plainToInstance` + `validateSync` (or replace with a single flat schema) so missing required vars (`DATABASE_URL`, `CLERK_SECRET_KEY`) fail fast at boot.
- **Dependencies:** none.
- **AC:** Booting without a required var throws a clear error at startup, not lazily at first use.
- **DoD:** + document required vs optional vars in [`13_DEPENDENCY_GUIDE.md`](./13_DEPENDENCY_GUIDE.md)/README.
- **Priority:** P1 · **Complexity:** S
- **Resolution:** Rewritten around a flat `EnvironmentVariables` class with real `plainToInstance` + `validateSync`; required vars fail fast at boot. Smoke-tested against compiled output.

### WV-105 — Consolidate the frontend API layer
- **Description:** `API_URL` + `unwrap` + `authHeaders` are copy-pasted across `lib/api.ts`, `lib/trip-api.ts`, `lib/comments-api.ts`, `lib/notifications-api.ts`, plus a raw `fetch` in `follow-button.tsx`. Create one `lib/api-client.ts` (base URL, envelope unwrap, auth header, `ApiError`); refactor all callers through it; add typed wrappers for the follow/relationship endpoints.
- **Dependencies:** none.
- **AC:** One source of truth for base URL + envelope handling; `follow-button` uses the shared client; existing `lib/*-api.spec.ts` still pass.
- **Priority:** P1 · **Complexity:** M

### WV-106 — Extract shared backend pagination + sort utilities
- **Description:** Cursor pagination (`take/skip/cursor`, `hasMore`, `nextCursor`) and sort-field allowlist maps are hand-rolled in `trips`, `media`, `comments`, `notifications`, `social`. Extract a shared helper in `common/`.
- **Dependencies:** none.
- **AC:** All list endpoints use the shared helper; pagination behavior unchanged; covered by tests.
- **Priority:** P2 · **Complexity:** M

### WV-107 — Implement real S3 deletion on media delete
- **Description:** `media.service` deletes the DB row but leaks the S3 object (TODO at ~line 172). Delete the object (and any variants) on media delete.
- **Dependencies:** none.
- **AC:** Deleting media removes the S3 object; trip counters still decrement correctly; failure to delete S3 doesn't corrupt DB state.
- **Priority:** P2 · **Complexity:** S

### WV-108 — Type the `stories` update DTO  ✅ DONE (Phase 0)
- **Description:** `StoriesController.updateStory` takes `@Body() dto: any`, bypassing the global `ValidationPipe`. Define an `UpdateStoryDto` (blocks/template/theme) with `class-validator`.
- **Dependencies:** none.
- **AC:** Invalid story payloads are rejected; valid ones work as before.
- **Priority:** P2 · **Complexity:** S
- **Resolution:** Added `stories.dto.ts` (`UpdateStoryDto`); controller + service typed; Prisma JSON casts applied.

### WV-109 — Decide fate of empty stub modules & dead schema
- **Description:** `payments`, `webhooks`, `analytics`, `exports` are `@Module({})`; `Session`, `Invoice`, `Export`, `UserActivity`, `MapTileCache`, `Challenge`, `ChallengeEntry` are unused. Decide per item: keep-as-scaffold (documented) or remove. Record in [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).
- **Dependencies:** none (but informs Phases 5/6/9/10).
- **AC:** Each stub/model is explicitly "keep (planned in Phase X)" or removed via migration.
- **Priority:** P2 · **Complexity:** M

### WV-110 — Remove dead dependencies  ✅ DONE (Phase 0 cleanup)
- **Description:** Remove confirmed-unused deps (see [`13_DEPENDENCY_GUIDE.md`](./13_DEPENDENCY_GUIDE.md)): frontend `gsap`, `zustand`, `@stripe/*`, `@mapbox/mapbox-gl-draw` (and `mapbox-gl`/`@types/mapbox-gl` if `MapViewer` is removed); backend `@nestjs/jwt`, `passport*`, `joi`, `zod`, `ms`, `mapbox-gl`, and others only after confirming non-use. Keep deps tied to *planned* phases only with a note.
- **Dependencies:** WV-109 (some deps map to stub modules); coordinate with cleanup already done in Phase 0.
- **AC:** `npm install` + build + tests pass; bundle shrinks; no runtime import errors.
- **Priority:** P2 · **Complexity:** M
- **Resolution:** 15 unused deps removed (`@stripe/*` deliberately kept for Phase 6). `@types/three` moved to devDeps. Build + all tests green.

### WV-111 — Promote `postprocessing` to a direct dependency
- **Description:** `journey-scene.tsx` imports from `postprocessing`, which is only a transitive dep of `@react-three/postprocessing`. Add it explicitly to `apps/web/package.json`.
- **Dependencies:** none.
- **AC:** `postprocessing` is a declared dependency at the resolved version; scene still builds/renders.
- **Priority:** P2 · **Complexity:** S

---

## Phase 2 — Identity Layer

### WV-201 — Implement Clerk webhook sync (`WebhooksModule`)
- **Description:** Build the empty `WebhooksModule`: verify `svix` signatures with `CLERK_WEBHOOK_SECRET`, handle `user.updated`/`user.deleted` to sync/remove the DB `User`.
- **Dependencies:** WV-101.
- **AC:** Clerk-side profile edits/deletes reflect in the DB; invalid signatures rejected.
- **Priority:** P1 · **Complexity:** M

### WV-202 — Editorial profile redesign
- **Description:** Bring `/profiles/[username]` fully to brand (serif, coral, full-bleed, air) per [`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md). No new data required.
- **Dependencies:** none.
- **AC:** Passes the "screenshot test"; reduced-motion safe; reuses `components/ui/*`.
- **Priority:** P2 · **Complexity:** M

---

## Phase 3 — Signature Profile Map

### WV-301 — Real per-location geocoding
- **Description:** Trip creation sends `lat:0,lng:0`; the backend geocode endpoints are stubs. Implement Mapbox (or alternative) forward geocoding server-side; geocode locations on create/update; backfill.
- **Dependencies:** WV-104.
- **AC:** New/edited locations get real coordinates; globe/route render accurately.
- **Priority:** P1 · **Complexity:** L

### WV-302 — Aggregate life-map route + Replay
- **Description:** Compute one connected, date-ordered route across all of a user's trips; add "Replay" reusing the journey engine.
- **Dependencies:** WV-301.
- **AC:** Multi-trip users see an accurate growing route; replay is smooth + reduced-motion safe.
- **Priority:** P1 · **Complexity:** XL

### WV-303 — Travel Passport
- **Description:** Compute countries/continents/cities/total-km + stamps; pin to top of profile.
- **Dependencies:** WV-301.
- **AC:** Stats are correct for a known dataset; UI on-brand.
- **Priority:** P2 · **Complexity:** L

---

## Phase 4 — Viral Loop

### WV-401 — Save to Bucket List
- **Description:** Data model + endpoints + one-tap UX to save any place from a trip to the viewer's future-map.
- **Dependencies:** WV-302/303.
- **AC:** Saving a place surfaces it on the saver's future-map; idempotent.
- **Priority:** P1 · **Complexity:** L

### WV-402 — Reshare cards + OG images
- **Description:** Shareable reshare cards with generated OG images for trips/profiles.
- **Dependencies:** none (benefits from WV-105).
- **AC:** Off-platform shares render correct preview images.
- **Priority:** P2 · **Complexity:** M

---

## Phase 5 — Trip Recap Export

### WV-501 — Implement `ExportsModule` + recap video pipeline
- **Description:** Build the empty `ExportsModule`; async render (BullMQ) of a watermarked vertical MP4 recap (route + photos + music + passport outro); track via the existing `Export` model.
- **Dependencies:** WV-302/303; async infra.
- **AC:** A trip produces a shareable watermarked vertical video; status tracked in `Export`.
- **Priority:** P1 · **Complexity:** XL

---

## Phase 6 — Monetization

### WV-601 — Implement `PaymentsModule` + Stripe checkout/portal/webhooks
- **Description:** Build the empty `PaymentsModule` + webhook handling: checkout, billing portal, subscription lifecycle writing `subscriptionTier/Status`, `Invoice`. Wire pricing CTAs to real checkout. Gate Pro features by tier.
- **Dependencies:** WV-201 (webhook infra), WV-501 (marquee Pro perk).
- **AC:** Subscribe → Pro entitlements → manage/cancel; webhooks keep state correct; free tier unaffected.
- **Priority:** P1 · **Complexity:** XL

---

## Phase 8 — AI Depth

### WV-801 — Implement unreachable AI job types
- **Description:** Add processor cases + endpoints for `GENERATE_CAPTIONS`, `AUTO_LAYOUT`, `TRANSLATE`, `VOICE_NARRATE`, `RECONSTRUCT_ROUTE`; replace the photo-enhance placeholder; populate `AIJob.costUsd`.
- **Dependencies:** content model (Phase 7).
- **AC:** Each job type returns real output within quota; cost recorded.
- **Priority:** P2 · **Complexity:** L

---

## Phase 9 — Scale & Observability

### WV-901 — Enforce rate limiting  ✅ DONE (Phase 0, ADR-013)
- **Description:** `ThrottlerModule` is configured but no `ThrottlerGuard` is applied. Apply it (global `APP_GUARD` or per-route).
- **Dependencies:** none.
- **AC:** Configured limits are enforced; abusive clients throttled.
- **Priority:** P2 · **Complexity:** S
- **Resolution:** `ThrottlerGuard` provided globally via `APP_GUARD`; `@SkipThrottle()` on health/readiness probes. Pulled forward into Phase 0 hardening. *(Per-route throttle profiles remain a Phase 9 refinement — WV-903.)*

### WV-902 — Media processing (thumbnails/variants)
- **Description:** Generate image variants/thumbnails on upload (using `sharp`, present but unused); populate `Media.variants`; serve responsive images.
- **Dependencies:** WV-107.
- **AC:** Uploaded images get variants; frontend uses them.
- **Priority:** P2 · **Complexity:** L

### WV-903 — Separate BullMQ worker + analytics + observability
- **Description:** Split the worker from the API process; implement `AnalyticsModule` writing `UserActivity`; add logging/metrics/tracing; review indexes.
- **Dependencies:** feature set stable.
- **AC:** Workers scale independently; activity logged; dashboards/alerts exist.
- **Priority:** P3 · **Complexity:** XL

---

## Backlog hygiene
- New debt discovered mid-flight → add a `WV-###` ticket here + a line in [`17_TECH_DEBT.md`](./17_TECH_DEBT.md).
- Keep IDs stable; don't renumber. Mark done tickets in [`20_CHANGELOG.md`](./20_CHANGELOG.md).
