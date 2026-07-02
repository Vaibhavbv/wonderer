# 03 — Codebase Guide

> A practical "where does X live and how do I touch it" guide. Pairs with [`09_FOLDER_STRUCTURE.md`](./09_FOLDER_STRUCTURE.md) (structure) and [`10_COMPONENT_REGISTRY.md`](./10_COMPONENT_REGISTRY.md) (per-component detail).

---

## Two apps, installed separately

```
apps/web   → Next.js frontend   (cd apps/web && npm install && npm run dev  → :3000)
apps/api   → NestJS backend     (cd apps/api && npm install && npm run start:dev → :3001)
```
No root workspace. Each has its own `package.json`, `node_modules`, lockfile, and tsconfig.

---

## FRONTEND (`apps/web`)

### Important folders
| Folder | What lives here | Notes |
|---|---|---|
| `app/` | App Router routes (each folder = a route; `page.tsx` = the page) | Server Components by default. |
| `components/ui/` | Design-system primitives (Button, Card, TiltCard, TextReveal, Magnetic, GlowSurface, CursorFX) | **Reusable — reuse before building new.** |
| `components/layout/` | Navbar, Footer, NotificationBell | |
| `components/three/` | React Three Fiber / WebGL (JourneyScene, Globe, ParticleBackground) | Heavy; `ssr:false`. Performance-critical. |
| `components/journey/` | The scroll-journey experience (JourneyExperience + siblings) | The signature feature. |
| `components/landing/` | Marketing sections (features, how-it-works, pricing, cta) | Static content in-file. |
| `components/dashboard/` | Dashboard widgets + CreateTripButton (the real upload flow) | |
| `components/trips/` | TripDetail, LikeButton, CommentThread | API-backed, optimistic. |
| `components/discover/` | DiscoverGallery, KineticShowcase | API-backed. |
| `components/profile/` | FollowButton, TripCard | |
| `components/providers/` | SmoothScroll (Lenis) | Effect-only, `null` render. |
| `lib/` | API clients, hooks, data, utils, types | See below. |
| `public/` | Static assets | Currently empty (the legacy `wander-demo.html` prototype was removed in Phase 0 cleanup). |

### Important components (start here)
- **`components/journey/journey-experience.tsx`** — orchestrator of the signature experience. Scroll state, active-destination tracking, dynamic WebGL import, reduced-motion fallback. High blast radius.
- **`components/three/journey-scene.tsx`** — ~700-line WebGL crown jewel (globe, route tube, banking vehicle, post-fx, `coarse` perf mode). *Do not casually refactor.*
- **`components/dashboard/create-trip-button.tsx`** — the full, real create-trip + S3-upload flow. The reference example for "how a write flow works" end-to-end.
- **`components/ui/button.tsx`** — the `cva`-based Button used everywhere. New buttons must use it.

### Shared utilities (`lib/utils.ts`)
- `cn(...)` — the class-merge helper (`clsx` + `tailwind-merge`). **Always use for conditional classNames.**
- `formatDate`, `formatRelativeDate` — date display.
- *Unused today* (kept, low-risk): `formatFileSize`, `generateTripSlug`, `easeOutCubic`, `easeInOutCubic`, `lerp`, `clamp`, `mapRange`. Covered by `utils.spec.ts`.

### Hooks (live in `lib/`, no `hooks/` folder yet)
- `lib/use-my-username.ts` → `useMyUsername()` — resolves the signed-in user's username (via `getMe`).
- `lib/use-notifications.ts` → `useNotifications()` — notifications list, unread count, optimistic mark-read.

> **Convention going forward:** new hooks may go in `lib/` next to these, or a `lib/hooks/` folder — see [`04_CODING_STANDARDS.md`](./04_CODING_STANDARDS.md). Be consistent with whatever the surrounding code already does.

### Services / API clients (`lib/`)
- `lib/api.ts` — `ApiError`, `unwrap<T>()`, `getMe`, discover/profile reads. **The canonical API pattern.**
- `lib/trip-api.ts`, `lib/comments-api.ts`, `lib/notifications-api.ts` — typed per-endpoint wrappers.
- `lib/journey-data.ts` — static demo destinations + `Destination`/`Vehicle` types + `getDestination(id)`.
- `lib/trip-to-journey.ts` — maps a real `TripRecord` → `Destination[]` for the journey.

### State management & context providers
- **None beyond Clerk.** No Zustand store, no custom context. All state is local or server-fetched. If you need cross-tree state, prefer server data + URL state first; introduce a store only with a decision recorded in [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md).

### Reusable modules (reuse, don't rebuild)
- Everything in `components/ui/`.
- `TripCard` (`components/profile/trip-card.tsx`) — presentational, used by both profiles and discover.
- `cn`, the `unwrap`/`ApiError` pattern, `TextReveal`, `TiltCard`, `Magnetic`.

---

## BACKEND (`apps/api`)

### Important folders
| Folder | What lives here |
|---|---|
| `src/<feature>/` | One folder per domain (auth, users, trips, media, stories, ai, maps, social, comments, notifications). Each has `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`. |
| `src/common/` | Cross-cutting: guards, decorators, filters, interceptors, utils. **Touch with care.** |
| `src/config/` | `env.validation.ts` (`EnvironmentVariables` class; `validate()` runs real `class-validator` at boot — WV-104). |
| `src/prisma/` | Global `PrismaService`. |
| `src/redis/` | `RedisModule` (currently unused — see debt). |
| `prisma/` | `schema.prisma`, `migrations/`, `seed.ts`. |
| `test/` | e2e test config. |

### Important files (start here)
- **`src/main.ts`** — global bootstrap (versioning, pipes, interceptors, filters, Swagger).
- **`src/app.module.ts`** — module registration + global infra config.
- **`src/common/guards/clerk-auth.guard.ts`** — the auth chokepoint. Every protected route depends on it.
- **`src/common/interceptors/transform.interceptor.ts`** + **`filters/http-exception.filter.ts`** — the response envelope. The frontend contract depends on these.
- **`prisma/schema.prisma`** — the data model (source of truth; but see "modeled vs built" caveat).
- **`src/trips/trips.service.ts`** — the reference domain service (CRUD + access control + pagination patterns).

### Shared utilities / patterns (backend)
- `@CurrentUser()` / `@CurrentUser('id')` decorator — get the authenticated DB user.
- `@Pagination()` decorator — parse cursor/per_page/sort.
- `slug.ts` (unique slug generation), `theme-inference.ts` (deterministic destination theme).
- The DTO-per-endpoint + `class-validator` pattern — **follow it for every new mutation.**

### Services (the real logic lives in `*.service.ts`)
Controllers are thin (routing + guards + Swagger); business logic + Prisma access live in services. When adding behavior, put it in the service, expose it via the controller, validate input with a DTO.

---

## What should NEVER be modified casually

Changing any of these has wide blast radius. Read the linked context and record a decision in [`16_DECISIONS_LOG.md`](./16_DECISIONS_LOG.md) before touching.

| Item | Why it's dangerous |
|---|---|
| **Response envelope** (`transform.interceptor.ts` / `http-exception.filter.ts`) | Every frontend `unwrap()` call depends on `{success,data,meta,error}`. Break it → the whole app breaks silently. |
| **`ClerkAuthGuard`** | The single auth chokepoint. A bug here is an auth bypass or a total lockout. |
| **`prisma/schema.prisma` + migrations** | Migrations are committed history. Never edit an applied migration; always add a new one. Removing a "dead" model still requires a migration and certainty it's unused. |
| **`components/three/journey-scene.tsx`** | ~700 lines of tuned WebGL + shaders + perf modes. Small changes cause frame drops or visual regressions. This is the product's signature. |
| **`app/layout.tsx` providers** | Removing/reordering ClerkProvider/SmoothScroll/CursorFX affects every page. |
| **`components/ui/*`** | Shared primitives — a change ripples to every screen. |
| **`main.ts` global pipes/versioning** | Changes route prefixes and validation for the entire API. |
| **Denormalized counters on `Trip`** | Any new mutation touching media/likes/comments must keep counters in sync, or stats drift. |

When in doubt: prefer additive changes, keep the public contract stable, and write a decision log entry.
