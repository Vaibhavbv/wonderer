# 13 — Dependency Guide

> Every dependency: why it exists, whether it should stay, and future replacements. Based on the Phase 0 usage audit (grepped against source). **Keep = actively used** · **Remove = unused, safe to drop** · **Keep (planned) = unused now but tied to a roadmap phase — drop only with a decision** · **Configured-inert = wired in `app.module` but no consumers.**

> ✅ **The Phase 0 cleanup has been executed** — every "Removed (Phase 0)" row below is done and verified (build + tests green). Verdicts reflect the current `package.json` state.

---

## Frontend — `apps/web` runtime deps

| Package | Verdict | Why |
|---|---|---|
| `next` | ✅ Keep | Framework (App Router). |
| `react` / `react-dom` | ✅ Keep | v19. |
| `@clerk/nextjs` | ✅ Keep | Auth, used broadly. |
| `@react-three/fiber` | ✅ Keep | All `components/three/*`. |
| `@react-three/drei` | ✅ Keep | OrbitControls, Stars, QuadraticBezierLine. |
| `@react-three/postprocessing` | ✅ Keep | Post-fx in `journey-scene`. |
| `three` | ✅ Keep | WebGL. |
| `framer-motion` | ✅ Keep | The animation library actually used. |
| `lenis` | ✅ Keep | Smooth scroll (`SmoothScroll`). |
| `lucide-react` | ✅ Keep | Icons. |
| `class-variance-authority` | ✅ Keep | `button.tsx` variants. |
| `clsx` + `tailwind-merge` | ✅ Keep | `cn()`. |
| `gsap` | ✅ Removed (Phase 0) | Had no imports anywhere — despite README claims, all animation is Framer Motion + R3F. |
| `zustand` | ✅ Removed (Phase 0) | Had no store, no imports. State is local/server. |
| `@stripe/react-stripe-js` | 🕓 Keep (planned) | Unused now; needed for Phase 6 payments. Remove if you'd rather re-add later. |
| `@stripe/stripe-js` | 🕓 Keep (planned) | Same. |
| `@mapbox/mapbox-gl-draw` | ✅ Removed (Phase 0) | Had no imports. |
| `mapbox-gl` | ✅ Removed (Phase 0) | Was only used by the dead `MapViewer` — both removed together in Phase 0 cleanup. The app uses R3F globes, not Mapbox (may return in Phase 3 for geocoding, but that's server-side REST, not this browser SDK). |
| `@types/three` | ✅ Moved to devDeps (Phase 0) | Types belong in `devDependencies`. |

**Transitive gap:** `journey-scene.tsx` imports `ChromaticAberrationEffect` from **`postprocessing`**, which is only a *transitive* dep of `@react-three/postprocessing`. **Promote it to a direct dependency** (WV-111) to avoid a fragile build.

**Dev deps** (Vitest, Testing Library, jsdom, `@vitejs/plugin-react`, postcss/autoprefixer, `@tailwindcss/postcss`, tailwindcss, typescript, `@types/*`): all used by the test/build toolchain — keep.

---

## Backend — `apps/api` runtime deps

| Package | Verdict | Why |
|---|---|---|
| `@nestjs/common` / `core` / `platform-express` / `config` | ✅ Keep | Framework. |
| `@prisma/client` (+ `prisma` dev) | ✅ Keep | ORM. |
| `@clerk/clerk-sdk-node` | ✅ Keep | `ClerkAuthGuard` token verify. |
| `@nestjs/bullmq` + `bullmq` | ✅ Keep | AI job queue + processor. |
| `ioredis` | ⚠️ Keep (used by BullMQ) | `RedisModule` itself is dead, but BullMQ needs a Redis connection. Keep the package; fix the module (WV). |
| `@aws-sdk/client-s3` + `s3-request-presigner` | ✅ Keep | Media presign. |
| `openai` | ✅ Keep | `AiProcessor`. |
| `@nestjs/swagger` | ✅ Keep | `/v1/docs` + DTO decorators. |
| `class-validator` + `class-transformer` | ✅ Keep | DTO validation. |
| `helmet`, `compression`, `cookie-parser`, `cors` | ✅ Keep | `main.ts` hardening. |
| `express` | ✅ Keep | Types in the exception filter; Nest platform. |
| `mime-types` | ✅ Keep | `media.service`. |
| `uuid` | ✅ Keep | `media.service`. |
| `reflect-metadata` / `rxjs` | ✅ Keep | Nest runtime. |
| `@nestjs/event-emitter` | ⚙️ Configured-inert | Registered; **no `@OnEvent`/emit** anywhere. Keep only if you'll use it soon; else remove. |
| `@nestjs/schedule` | ⚙️ Configured-inert | Registered; **no `@Cron`**. Candidate for cron jobs (quota resets, cache expiry) later. |
| `@nestjs/throttler` | ✅ Keep (enforced) | `ThrottlerGuard` applied globally via `APP_GUARD` — limits are live (WV-901, ADR-013). |
| `stripe` | 🕓 Keep (planned) | Payments (Phase 6). Unused now. |
| `svix` | 🕓 Keep (planned) | Clerk webhook signature verify (Phase 2, WV-201). Unused now. |
| `sharp` | 🕓 Keep (planned) | Image variants/thumbnails (Phase 9, WV-902). Unused now. |
| `mapbox-gl` | ✅ Removed (Phase 0) | A browser mapping lib with no place in a backend; was unused. Real geocoding would call Mapbox's REST API over HTTP, not this SDK. |
| `@nestjs/jwt` | ✅ Removed (Phase 0) | Auth is Clerk's `verifyToken`; was not used. |
| `@nestjs/passport` + `passport` + `passport-jwt` | ✅ Removed (Phase 0) | No Passport strategy; superseded by the custom guard. |
| `@nestjs/platform-socket.io` + `@nestjs/websockets` | 🕓 Keep (planned) or Remove | No gateways today; real-time collaboration is Phase 10. Decide in WV-109. |
| `@nestjs/mapped-types` | ✅ Removed (Phase 0) | Was not used (DTOs are hand-written). |
| `joi` | ✅ Removed (Phase 0) | Env validation uses class-validator (now actually wired — WV-104). |
| `zod` | ✅ Removed (Phase 0) | Was not used. |
| `ms` | ✅ Removed (Phase 0) | Was not used. |
| `dotenv` | ⚠️ Likely removable | `ConfigModule` loads env; not directly imported. Kept for now. |
| `@nestjs/axios` | ✅ Removed (Phase 0) | Was not imported. |

**Dev deps** (Nest CLI/schematics/testing, Jest + ts-jest, ESLint/Prettier, ts-node, tsconfig-paths, typescript, `@types/*`, supertest): used by scripts — keep.

---

## Cleanup status (WV-110 ✅ done in Phase 0)
1. ~~Safe immediate removals~~ — **done**: frontend `gsap`, `zustand`, `@mapbox/mapbox-gl-draw`; backend `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/mapped-types`, `joi`, `zod`, `ms`, `@nestjs/axios`, `mapbox-gl`.
2. ~~Remove-with-code~~ — **done**: frontend `mapbox-gl`/`@types/mapbox-gl` removed together with `MapViewer`.
3. **Reclassify:** `@types/three` → devDeps **done**. Still open: **promote `postprocessing`** → direct dep (WV-111).
4. **Decide (WV-109), still open:** `stripe`, `svix`, `sharp`, `@stripe/*`, websocket deps, and the inert `EventEmitter`/`Schedule` modules — keep as planned scaffolding *with a doc note*, or remove and re-add when the phase arrives.

**Rule of thumb:** removing an unused dep tied to a *documented planned phase* is fine — it's easy to re-add. Removing one you're *unsure* about is not — grep the whole app first and record the removal in [`20_CHANGELOG.md`](./20_CHANGELOG.md).
