# 01 — Project Overview

> **New here? Read [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md) and [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) first.** This file explains *what* Wanderverse is; those two explain *how to work on it right now*.

---

## What Wanderverse Is

**Wanderverse is "Instagram for your travel life."**

Your profile is a living map of everywhere you've ever been. You follow friends and creators to watch their journeys unfold in a bright, editorial feed. Individual trips become **cinematic, scroll-driven stories** — a route line animating across a 3D globe, your best photos surfacing as you scroll, a small coral vehicle flying the path between destinations.

It is a **social network with a storytelling engine at its core**, not a photo-storage app. The competitive wedge is *narrative and aesthetics*, not gigabytes.

- **Tagline:** *"Map your life."*
- **One-liner:** Your profile is a living map of everywhere you've been; you follow people to watch their journeys unfold.
- **Signature experience:** The "Wander View" — a WebGL globe fly-through with a scroll-synced route and photos. Implemented today in `apps/web/components/journey/` + `apps/web/components/three/`.

---

## Product Vision

Transform raw travel experiences (scattered photos, half-remembered routes) into **immersive, interactive, shareable stories**, and connect those stories into a social graph where watching someone's journey makes you want to take your own.

The blend, stated in the founding PRD:
- The **spatial storytelling** of Google Earth
- The **curated aesthetics** of Pinterest
- The **creative freedom** of Canva
- The **motion-rich product storytelling** of Apple
- ...wrapped in a **freemium SaaS + social** model.

> The authoritative, most-recent statement of vision is [`MASTERPLAN.md`](./MASTERPLAN.md) ("Locked Product Vision & Build Brief"). The broader [`PRD.md`](./PRD.md) is the detailed feature superset. Where they differ, **MASTERPLAN wins** — it is the deliberate narrowing of the PRD's scope.

---

## Target Audience

**Wedge audience (build for these people first):** **Digital nomads and long-term travelers.** They travel most, share most, and produce the content everyone else comes to watch. *Every screen must make them look incredible.*

Broader personas (from the PRD):
- **The Curator Traveler (28–45)** — 3–6 trips/year, documents extensively, values aesthetics over storage, will pay for premium creative tools.
- **The Family Historian (35–55)** — preserves family trips, wants an organized shareable archive, values privacy.
- **The Travel Influencer (22–35)** — professional-grade content, embeddable/brandable stories, high volume, wants AI assistance.

---

## Mission

Give every traveler a beautiful, permanent, living record of their journeys — and a social surface where those journeys inspire the next trip. Make the act of remembering a trip feel as good as taking it.

---

## Long-Term Goal

Become the default place travelers keep and show their travel lives — the "travel identity layer" of the internet. Public, SEO'd profile pages become the canonical URL for "where has this person been," and the auto-generated **Trip Recap** export becomes the growth engine: every recap shared to Instagram/TikTok recruits the next user.

The viral loop:

```
watch a journey → save the place to your bucket list → go → post it → your followers save it
```

---

## Current Phase

**Phase 0 — Repository Foundation & AI-Readiness** (in progress).

The purpose of this phase is **not** to build features. It is to make the repository *self-documenting* so that AI assistants (Claude, Opus, Fable, Cursor, etc.) can understand and safely extend the project with minimal re-explanation. See [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) for live status and [`07_ROADMAP.md`](./07_ROADMAP.md) for the full phase plan.

**Explicit non-goals of Phase 0:** no new features, no UI redesign, no new Three.js work, no new animations.

---

## Current Features (what actually works today)

This list reflects the **audited state of the code**, not aspirations. See [`02_ARCHITECTURE.md`](./02_ARCHITECTURE.md) and [`11_API_REFERENCE.md`](./11_API_REFERENCE.md) for detail.

**Fully working, wired end-to-end (frontend ↔ backend ↔ DB):**
- **Authentication** via Clerk (JWT-per-request; users auto-provisioned in the DB on first authenticated call).
- **User profiles** — public profile pages (`/profiles/[username]`), stats, avatar, bio.
- **Trip CRUD** — create (multi-destination, with photo upload), read, update, delete, duplicate, like.
- **Image upload** — S3 presigned-URL flow with per-user storage quota.
- **Dashboard** — the signed-in user's trips + aggregate stats.
- **Social graph** — one-way follow/unfollow, home feed of followed users, public discover feed.
- **Comments** — threaded (one level), with likes and in-app notifications.
- **Notifications** — in-app, for likes / comments / follows.
- **The signature Wander View** — real trips render as a 3D globe scroll-journey at `/trips/[id]/wander`; the homepage runs the same experience on demo data.
- **AI story/title generation** — queued via BullMQ → OpenAI (requires an `OPENAI_API_KEY`).

**Modeled but NOT built (empty stubs / placeholders — do not assume these work):**
- **Payments / Stripe** — `PaymentsModule` is empty; pricing CTAs are Clerk sign-in modals, no checkout.
- **Webhooks** — `WebhooksModule` is empty; no Clerk or Stripe webhook handling.
- **Analytics** — `AnalyticsModule` is empty; the `UserActivity` table is never written.
- **Exports** — `ExportsModule` is empty; no PDF/MP4/JSON export (including the flagship Trip Recap video).
- **Real geocoding & maps** — Mapbox geocoding endpoints return empty arrays (placeholders); the frontend uses R3F globes, not Mapbox.
- **AI photo enhancement, captions, translation, narration, route reconstruction** — enum values exist; no working implementation.

> ⚠️ **This gap between "modeled" and "built" is the single most important thing an AI assistant must internalize before writing code.** The database schema describes an ambitious product; large parts of it are aspirational scaffolding. See [`17_TECH_DEBT.md`](./17_TECH_DEBT.md).

---

## Future Vision

In rough priority order (see [`07_ROADMAP.md`](./07_ROADMAP.md) for the phased plan):

1. **The signature profile map** — one continuous, connected route line that grows trip-by-trip in date order, with a "Replay" that flies your whole travel life, and a live **Travel Passport** (countries/continents/cities/km, stamp collection).
2. **The viral loop** — reshare cards + the signature **"Save to Bucket List"** (one tap drops any place from someone's trip onto your own future-map).
3. **The hook** — auto-generated cinematic **Trip Recap** exported as a watermarked vertical video, plus a year-end **"Year in Travel"** wrapped.
4. **Monetization** — freemium; Pro unlocks premium map themes, editorial profile layouts, and watermark-free high-res recap exports. Later: creator subscriptions, tourism-board partnerships, "book this exact trip" affiliate links.
5. **Ephemeral Stories** ("in Lisbon right now") alongside permanent Trips.

**Design law (non-negotiable):** light/editorial base, **one coral accent (`#FF5A4D`)**, serif headlines, full-bleed photography, generous whitespace. *If a screen doesn't make a nomad want to screenshot it, redo it.* See [`06_PRODUCT_BIBLE.md`](./06_PRODUCT_BIBLE.md).

---

## Repository At A Glance

| | |
|---|---|
| **Monorepo layout** | `apps/web` (Next.js frontend) + `apps/api` (NestJS backend) + `infra` (docker-compose, Terraform) + `docs` |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, Clerk, React Three Fiber/Three.js, Framer Motion, Lenis |
| **Backend** | NestJS 10, Prisma 6, PostgreSQL, Redis + BullMQ, Clerk SDK, AWS S3, OpenAI |
| **Auth** | Clerk (stateless JWT verified per request) |
| **Package manager** | npm (each app has its own `package.json`; no root workspace file) |
| **Node** | 20.x (backend pins `engines.node = 20.x`) |

See [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) for the complete tree.
