# 07 — Roadmap

> Phased plan from foundation to a mature product. Each phase lists **milestones, dependencies, deliverables, and completion criteria.** Live status lives in [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md); concrete tickets in [`08_ENGINEERING_BACKLOG.md`](./08_ENGINEERING_BACKLOG.md). Sequencing follows the "locked build priority" in [`MASTERPLAN.md`](./MASTERPLAN.md).

**Guiding principle:** the schema already models most of the product. The work is *wiring + the editorial experience on top*, plus hardening — **not** a rewrite. Prioritize the viral loop (profile map → recap export) because it is the growth engine.

---

## Phase 0 — Repository Foundation & AI-Readiness  ← CURRENT

**Goal:** Make the repo self-documenting and clean so AI-assisted development is fast and safe. No features.

- **Milestones:** full backend + frontend audit; complete `/docs` set (01–20); safe cleanup of dead code & unused deps; audit report + health scores.
- **Dependencies:** none.
- **Deliverables:** this documentation set; a cleanup PR; Phase 0 audit report with scores.
- **Completion criteria:** all 20 docs exist and are accurate; build + lint + tests pass after cleanup; no functionality changed; scores recorded.

---

## Phase 1 — Stabilization & Debt Paydown

**Goal:** Fix the correctness/security gaps and duplication surfaced in Phase 0 so later features build on solid ground.

- **Milestones:**
  - ✅ ~~Secure/remove `POST /v1/auth/sync`; add ownership check to `duplicateTrip`; fix error-masking `catch` blocks.~~ *(Pulled forward — done in Phase 0 hardening: WV-101/102/103.)*
  - ✅ ~~Make `env.validation.ts` actually validate; fail fast on missing required vars.~~ *(Done in Phase 0: WV-104.)*
  - ✅ ~~Type the `stories` `PUT` DTO.~~ *(Done in Phase 0: WV-108. Rate limiting also enforced: WV-901.)*
  - Consolidate the frontend API layer into one client (kill the 4× `unwrap`/`API_URL` duplication + the ad-hoc `follow-button` fetch) — WV-105.
  - Extract shared backend pagination + sort-map utilities — WV-106.
  - Implement real S3 deletion on media delete — WV-107.
  - Decide the fate of empty stub modules & dead schema (remove or ticket) — WV-109, see [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).
- **Dependencies:** Phase 0.
- **Deliverables:** hardened API; unified frontend client; green test suite with added coverage for the fixed paths.
- **Completion criteria:** all [`17_TECH_DEBT.md`](./17_TECH_DEBT.md) "correctness/security" items resolved or explicitly deferred with a decision entry; no behavior regressions.

---

## Phase 2 — Identity Layer Polish (Profiles + Follow Graph + Feed)

**Goal:** Make the social identity layer excellent (it's functional today; make it *screenshot-worthy* and complete).

- **Milestones:** editorial profile redesign to brand; profile stats/passport scaffolding (data model for countries/km); complete follow/feed edge cases; Clerk webhook sync so profile edits/deletes propagate.
- **Dependencies:** Phase 1 (auth hardening, unified client).
- **Deliverables:** polished `/profiles/[username]`, robust feed, working Clerk→DB sync via `WebhooksModule`.
- **Completion criteria:** profile passes the "screenshot test"; feed correct for follow/unfollow/privacy; webhook-driven sync verified.

---

## Phase 3 — The Signature Profile Map (growing route + replay + passport)

**Goal:** The show-off screen — one continuous route line that grows trip-by-trip in date order, "Replay" that flies a user's whole travel life, and a live **Travel Passport** (countries/continents/cities/km + stamps).

- **Milestones:** aggregate a user's trips into a single ordered route; replay animation reusing the journey engine; passport stat computation + UI; real per-location geocoding to get accurate coordinates (replace `lat:0,lng:0` at trip creation and the stubbed geocoder).
- **Dependencies:** Phase 2; real geocoding (backend geocode endpoints currently stubbed).
- **Deliverables:** life-map on the profile, replay, passport.
- **Completion criteria:** a user with multiple trips sees an accurate connected route + passport; replay is smooth and reduced-motion-safe.

---

## Phase 4 — The Viral Loop (reshare + Save to Bucket List)

**Goal:** Turn viewing into acquisition. Likes/comments exist; add reshare cards and the signature **Save to Bucket List** (one tap drops any place from someone's trip onto your own future-map).

- **Milestones:** bucket-list data model + endpoints; one-tap save UX on any place; reshare cards with OG images; future-map surface on the profile.
- **Dependencies:** Phase 3 (map + passport surfaces).
- **Deliverables:** save-to-bucket-list, reshare cards, future-map.
- **Completion criteria:** the loop works end-to-end (watch → save → appears on your future-map); shareable cards render correctly off-platform.

---

## Phase 5 — The Hook: Auto-Generated Trip Recap Export

**Goal:** The growth engine. Auto-generated cinematic **Trip Recap** — route animates, best photos cut to music, ends on updated passport — exported as a **watermarked vertical video** built for Instagram/TikTok. Plus year-end **"Year in Travel"** wrapped.

- **Milestones:** implement `ExportsModule` (currently empty); server-side/edge video render pipeline (the `Export`/`ExportFormat` models already exist); music + watermark; vertical format; share flow.
- **Dependencies:** Phases 3–4 (route, passport, photos); async job infra (BullMQ exists).
- **Deliverables:** working MP4 recap export + "Year in Travel."
- **Completion criteria:** a trip produces a shareable, watermarked vertical video; exports tracked in the `Export` table with status.

---

## Phase 6 — Monetization (Freemium + Stripe)

**Goal:** Turn on revenue. Free = full social app. Pro = premium map themes, editorial profile layouts, watermark-free high-res recap exports.

- **Milestones:** implement `PaymentsModule` + `WebhooksModule` (both empty today) with Stripe checkout, billing portal, subscription webhooks writing `subscriptionTier/Status`, `Invoice`; gate Pro features by tier; wire pricing CTAs to real checkout.
- **Dependencies:** Phase 5 (recap export is the marquee Pro perk); Stripe deps already present.
- **Deliverables:** working subscriptions, entitlement gating, invoices.
- **Completion criteria:** a user can subscribe, get Pro entitlements, manage/cancel billing; webhooks keep state correct.

---

## Phase 7 — Content Depth: Moments, Stories, Rich Story Builder

**Goal:** Deepen the content model. **Moments** (photo/video + location + caption, live or later) auto-clustering into Trips; ephemeral **Stories** ("in Lisbon right now"); a richer story builder toward the PRD's block editor.

- **Milestones:** Moment model + capture flow; ephemeral Stories; expand the `stories` blocks model + editor UI; auto-layout (one of the unreachable AI job types).
- **Dependencies:** Phases 3–5.
- **Deliverables:** Moments, Stories, improved story builder.
- **Completion criteria:** users can post Moments that cluster into Trips; Stories expire correctly.

---

## Phase 8 — AI Depth

**Goal:** Deliver the AI features that are currently enum-only. Story/title gen already works; add captions, translation, voice narration, photo enhancement, route reconstruction.

- **Milestones:** implement processor cases + endpoints for the unreachable `AIJobType`s; real photo enhancement (replace placeholder); cost tracking (`AIJob.costUsd`); credit accounting polish.
- **Dependencies:** Phase 7 (content to operate on); OpenAI/optional Anthropic.
- **Deliverables:** the full AI toolbox from the PRD.
- **Completion criteria:** each AI job type produces real output within quota, with cost recorded.

---

## Phase 9 — Scale, Performance & Observability

**Goal:** Prepare for the PRD's scale targets (100k MAU, 1M photos/day peak).

- **Milestones:** apply `ThrottlerGuard` (configured, unused); separate BullMQ worker deployment; media processing (thumbnails/variants via `sharp` — present, unused); CDN + map tile caching (`MapTileCache` model exists, unused); analytics implementation (`AnalyticsModule` + `UserActivity`, both unused); logging/metrics/tracing; DB indexing review.
- **Dependencies:** feature set stable (Phases 1–8).
- **Deliverables:** rate limiting live, async workers, image variants, analytics, observability.
- **Completion criteria:** load targets met in staging; dashboards + alerts exist.

---

## Phase 10 — Ecosystem & Platform

**Goal:** The PRD's long-tail: imports (Google/Apple Photos, Instagram, Strava), public API access, embeddable widgets, collaboration, community challenges (`Challenge`/`ChallengeEntry` models exist), tourism-board partnerships, "book this trip" affiliate links.

- **Milestones:** import pipelines; public API + keys; embeds; real-time collaboration (websocket deps present, unused); challenges; partnership/affiliate surfaces.
- **Dependencies:** mature core + monetization.
- **Deliverables:** integrations + platform features.
- **Completion criteria:** at least one import source, public API, and challenges live.

---

## Cross-cutting (every phase)

- Keep the `/docs` set current (especially [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md), [`20_CHANGELOG.md`](./20_CHANGELOG.md), [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md)).
- Protect the brand + motion feel ([`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md)).
- No new debt without a ticket; pay down opportunistically.
- Every feature ships with tests + a doc update.

## Dependency graph (compact)

```
P0 ─▶ P1 ─▶ P2 ─▶ P3 ─▶ P4 ─▶ P5 ─▶ P6
                    │           └─▶ P7 ─▶ P8
                    └────────────────────────▶ P9 ─▶ P10
```
