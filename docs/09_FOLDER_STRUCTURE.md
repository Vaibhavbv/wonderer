# 09 — Folder Structure

> The complete tree with the *reason each folder exists* and *where new code belongs*. Pairs with [`03_CODEBASE_GUIDE.md`](./03_CODEBASE_GUIDE.md).

---

## Top level

```
wonderer/
├── apps/
│   ├── api/                  NestJS backend
│   └── web/                  Next.js frontend
├── docs/                     project documentation (this set + strategic docs)
├── infra/
│   ├── docker-compose.yml    local Postgres + Redis (+ API)
│   └── terraform/            AWS infra (README present)
├── .github/                  CI workflows
├── .vscode/                  editor settings
├── render.yaml               Render.com deploy config
├── DEPLOYMENT.md             deployment guide
├── QUICKSTART.md             local setup (⚠ partially stale — see 17_TECH_DEBT)
└── .gitignore
```

**Why a monorepo, no root workspace:** the two apps deploy separately (web → Vercel/Render, api → Render) and have independent dependency trees. Each is installed/built on its own. There is intentionally **no root `package.json`**; run commands inside each app.

**Where new top-level things go:** shared infra → `infra/`; docs → `docs/` (keep the numbered scheme); a future shared types package would go under `packages/` (doesn't exist yet — create it + a root workspace only with a decision-log entry).

---

## Backend — `apps/api/`

```
apps/api/
├── prisma/
│   ├── schema.prisma         data model (source of truth)
│   ├── migrations/           committed migration history — NEVER edit an applied one
│   └── seed.ts               dev seed
├── src/
│   ├── main.ts               bootstrap: versioning, global pipes/filters/interceptors, Swagger
│   ├── app.module.ts         root module: registers infra + all feature modules
│   ├── app.controller.ts     /health, /ready
│   ├── app.service.ts        (empty placeholder)
│   │
│   ├── common/               CROSS-CUTTING — used by all features, depends on none
│   │   ├── guards/           clerk-auth.guard.ts (the auth chokepoint)
│   │   ├── decorators/       current-user, pagination
│   │   ├── filters/          http-exception.filter.ts (error envelope)
│   │   ├── interceptors/     transform.interceptor.ts (success envelope)
│   │   └── utils/            slug.ts, theme-inference.ts
│   │
│   ├── config/               env.validation.ts (config classes; validate() is a no-op — debt)
│   ├── prisma/               PrismaModule/Service (global)
│   ├── redis/                RedisModule (⚠ currently unused)
│   │
│   ├── auth/                 sync + me (thin; mostly superseded by the guard)
│   ├── users/                profile CRUD, stats, subscription view, GDPR delete
│   ├── trips/                CORE domain — CRUD, list/search, duplicate, stats, like
│   ├── media/                S3 presign, quota, CRUD (⚠ delete/process TODOs)
│   ├── stories/              per-trip story blob (⚠ untyped PUT body)
│   ├── ai/                   BullMQ→OpenAI story/title gen + processor (⚠ partial)
│   ├── maps/                 route/heatmap (real) + geocoding/styles (⚠ stubbed)
│   ├── social/              discover/profiles (public) + feed/follow (guarded)
│   ├── comments/             threaded comments + likes + notifications
│   ├── notifications/        in-app notifications
│   ├── payments/             ❌ empty stub (@Module({}))
│   ├── webhooks/             ❌ empty stub
│   ├── analytics/            ❌ empty stub
│   └── exports/              ❌ empty stub
├── test/                     e2e config (jest-e2e.json, app.e2e-spec.ts)
├── docker/Dockerfile
├── .env.example              required/optional env vars
├── package.json              scripts: start:dev, build, test, db:*
└── tsconfig.json
```

**Convention — each feature module owns exactly these files:**
```
<feature>/
├── <feature>.module.ts       wires controller + service + imports
├── <feature>.controller.ts   thin: routing, guards, Swagger; NO business logic
├── <feature>.service.ts      business logic + Prisma access + access control
├── <feature>.dto.ts          request/response DTOs (class-validator)
└── <feature>.service.spec.ts (where present) unit tests
```

**Where new backend code goes:**
- New endpoint on an existing domain → that domain's controller + service (+ DTO).
- New domain → new `src/<feature>/` folder with the four files, registered in `app.module.ts`, documented in [`11_API_REFERENCE.md`](./11_API_REFERENCE.md).
- Cross-cutting helper → `src/common/` (never import feature modules from `common`).
- Data model change → `prisma/schema.prisma` + a **new** migration.

---

## Frontend — `apps/web/`

```
apps/web/
├── app/                      App Router — each folder is a route
│   ├── layout.tsx            root layout: ClerkProvider + SmoothScroll + CursorFX + fonts
│   ├── globals.css           Tailwind v4 @theme (design tokens) + base/utilities/bespoke CSS
│   ├── page.tsx              / — JourneyExperience on demo data
│   ├── about/                marketing
│   ├── pricing/              marketing (pricing tiers hardcoded)
│   ├── discover/             public feed (real API)
│   ├── destinations/         demo destination grid + globe
│   │   └── [id]/             demo destination detail (⚠ "coming soon" placeholder)
│   ├── dashboard/            signed-in trips + stats (real API, auth-gated)
│   ├── profiles/[username]/  public profile (real API)
│   └── trips/[id]/           trip detail (real API)
│       └── wander/           the signature journey on real trip data
│
├── components/               grouped BY DOMAIN, not by type
│   ├── ui/                   design-system primitives (REUSE THESE)
│   ├── layout/               navbar, footer, notification-bell
│   ├── three/                React Three Fiber / WebGL (heavy, ssr:false)
│   ├── journey/              the scroll-journey experience
│   ├── landing/              marketing sections
│   ├── dashboard/            dashboard widgets + create-trip flow
│   ├── trips/                trip detail, like, comments
│   ├── discover/             discover gallery, kinetic showcase
│   ├── profile/              follow button, trip card
│   ├── map/                  map-viewer.tsx (⚠ DEAD — imported nowhere)
│   └── providers/            smooth-scroll (Lenis)
│
├── lib/                      non-component shared code
│   ├── api.ts                canonical API client (ApiError, unwrap, getMe, discover/profile)
│   ├── trip-api.ts           trip endpoints (⚠ duplicates unwrap/API_URL)
│   ├── comments-api.ts       comment endpoints (⚠ dup)
│   ├── notifications-api.ts  notification endpoints (⚠ dup)
│   ├── journey-data.ts       static demo destinations + Destination/Vehicle types
│   ├── trip-to-journey.ts    real TripRecord → Destination[]
│   ├── use-my-username.ts    hook
│   ├── use-notifications.ts  hook
│   ├── utils.ts              cn(), date/format helpers, math helpers (some unused)
│   └── *.spec.ts             vitest tests
│
├── public/                   static assets (incl. wander-demo.html — ⚠ legacy prototype)
├── middleware.ts             Clerk middleware (enabled only if CLERK_SECRET_KEY present)
├── next.config.ts            image hosts, optimizePackageImports, env re-export
├── vitest.config.ts / vitest.setup.ts
├── postcss.config.mjs        @tailwindcss/postcss
├── .env.local               local env (gitignored)
├── package.json              scripts: dev, build, lint, type-check, test
└── tsconfig.json             strict; @/* alias → project root
```

**No `tailwind.config.js`:** Tailwind v4 is configured entirely in `app/globals.css` via `@theme { … }`. Change design tokens there.

**No `hooks/` folder:** custom hooks currently live in `lib/` as `use-*.ts`. Keep them there (or introduce `lib/hooks/` consistently with a decision-log note).

**No state store:** no Zustand/context beyond Clerk. Prefer server data + local state; add a store only deliberately.

**Where new frontend code goes:**
- New page → `app/<segment>/page.tsx` (Server Component by default).
- Reusable primitive → `components/ui/`.
- Domain component → `components/<domain>/` (create a new domain folder if it's a genuinely new area).
- New 3D/WebGL → `components/three/`.
- API call → extend the client in `lib/` (ideally the consolidated one from WV-105).
- Hook → `lib/use-*.ts`.
- Design token → `app/globals.css` `@theme`.

---

## Docs — `docs/`

```
docs/
├── 00_README.md              index of this doc set
├── 01_PROJECT_OVERVIEW.md … 20_CHANGELOG.md   the numbered AI-readiness set
│
└── (pre-existing strategic docs — preserved, still valid reference)
    ├── MASTERPLAN.md         ⭐ locked product vision (authoritative for product intent)
    ├── PRD.md                detailed product requirements (feature superset)
    ├── ARCHITECTURE.md       original architecture notes
    ├── API_DESIGN.md         original API spec
    ├── DESIGN_SYSTEM.md      design tokens & motion (source for 06_PRODUCT_BIBLE)
    ├── MONETIZATION.md       revenue strategy
    └── ROADMAP.md            original roadmap
```

**Numbered docs (01–20)** are the operational, kept-current set AI assistants read. **The ALL-CAPS strategic docs** are the founder's source material — preserved, referenced, but not the day-to-day operating docs. When the two disagree on *product intent*, MASTERPLAN wins; on *current code state*, the numbered docs win (they're audited against the code).
