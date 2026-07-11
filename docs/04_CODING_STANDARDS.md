# 04 — Coding Standards

> These standards are **descriptive first** (they document the conventions already in the code) and **prescriptive second** (a few improvements to adopt going forward, marked ➕). When they conflict with surrounding code, **match the surrounding code** and note the divergence.

---

## Golden rule

**Write code that reads like the code already around it.** Match existing naming, file layout, import order, comment density, and idioms in the file/folder you're editing. Consistency beats personal preference.

---

## Naming conventions

### Files
| Kind | Convention | Example |
|---|---|---|
| React components | `kebab-case.tsx` | `create-trip-button.tsx`, `journey-scene.tsx` |
| Hooks | `use-*.ts` (kebab) | `use-notifications.ts` |
| Frontend libs/clients | `kebab-case.ts` | `trip-api.ts`, `trip-to-journey.ts` |
| Tests | `*.spec.ts(x)` colocated | `like-button.spec.tsx`, `trips.service.spec.ts` |
| NestJS files | `feature.<type>.ts` | `trips.controller.ts`, `trips.service.ts`, `trips.dto.ts`, `trips.module.ts` |

### Symbols
- **Components:** `PascalCase` (`JourneyExperience`, `TripCard`).
- **Hooks:** `useCamelCase` (`useMyUsername`).
- **Functions/vars:** `camelCase`.
- **Types/interfaces/classes/enums:** `PascalCase` (`Destination`, `CreateTripDto`, `TripStatus`).
- **Constants:** `UPPER_SNAKE_CASE` for true module-level constants (`API_URL`, `SORT_FIELDS`); `camelCase` for local consts.
- **Prisma models:** `PascalCase` singular (`Trip`, `TripLocation`); DB table names `snake_case` plural via `@@map` (`trips`, `trip_locations`).
- **Enums (Prisma):** `PascalCase` type, `UPPER_SNAKE` values (`TripPrivacy.PUBLIC`).

### API / URLs
- Routes are **`/v1/kebab-or-plural`** (`/v1/trips`, `/v1/profiles/:username/follow`).
- Error codes are **`snake_case`** (produced by `HttpExceptionFilter`).
- Query params are **`snake_case`** (`per_page`, `cursor`, `sort`).
- Response envelope keys are **`camelCase`** inside `data`; JSON fields mirror Prisma field names (camelCase).

---

## Folder conventions

### Frontend
- **Routes** → `app/<segment>/page.tsx`. Dynamic segments `[param]`. Colocate route-only UI in the route folder if it's truly one-off; otherwise put it in `components/`.
- **Shared components** → `components/<domain>/`. Group by domain (`trips`, `journey`, `discover`), not by type. Design-system primitives go in `components/ui/`.
- **Non-component shared code** → `lib/` (API clients, hooks, data, utils, types).
- New WebGL/R3F → `components/three/`.

### Backend
- **One folder per domain** under `src/`. Each domain owns its `module`, `controller`, `service`, `dto`.
- Cross-cutting code → `src/common/` (never import feature modules from `common`).
- Never put business logic in a controller — it belongs in a service.

➕ **When adding a new backend feature module:** create the folder, the four files, register it in `app.module.ts`, and add its endpoints to [`11_API_REFERENCE.md`](./11_API_REFERENCE.md).

---

## TypeScript standards

- **Strict mode is on** (both apps). Do not weaken `tsconfig`.
- **No `any`.** The mutation surface is fully typed (the former `stories` `updateStory(dto: any)` offender was fixed in Phase 0 — WV-108). Type request bodies with DTO classes (backend) or explicit types (frontend).
- Prefer **`interface` for object shapes**, `type` for unions/utility types (loose convention; match the file).
- Export shared types from `lib/` (frontend) or the DTO/`.dto.ts` file (backend). Types used by both server & client components can live in the relevant `lib/*.ts`.
- Use Prisma's generated types on the backend rather than hand-redeclaring model shapes.
- Enums: use Prisma enums on the backend; mirror as string-literal unions or import where needed on the frontend.

---

## React conventions

- **Server Components by default.** Add `"use client"` **only** when you need state, effects, event handlers, browser APIs, or client-only libs (Framer Motion, R3F, Clerk client hooks).
- Keep client bundles lean: push data-fetching up into async Server Components; pass plain data down to client components as props.
- **Dynamically import heavy client-only trees** with `next/dynamic` `{ ssr: false }` (as `journey-experience.tsx` does for `journey-scene.tsx`).
- **Respect `prefers-reduced-motion`** — every animation-heavy component must have a reduced-motion path (the journey already does).
- Optimistic UI: follow `LikeButton` / `CommentThread` (optimistic update → revert on failure).
- Use the `cn()` helper for conditional classes. Never string-concatenate classNames.
- `forwardRef` for reusable primitives that wrap a DOM node (see `button.tsx`).

---

## Import order

Observed convention (keep it):
1. React / Next / framework imports
2. Third-party libraries
3. Absolute-alias imports — frontend `@/...`, backend `@/`, `@common/`, `@config/` (see `apps/api` jest `moduleNameMapper` / tsconfig paths)
4. Relative imports (`./`, `../`)
5. Type-only imports grouped with their source (or `import type` where it aids clarity)

Leave a blank line between groups. Frontend uses the `@/*` alias (root-relative); prefer it over long `../../..` chains.

---

## Comments

- **Explain *why*, not *what*.** The codebase is low on noise comments — keep it that way.
- Placeholder/unfinished behavior must be marked with `// TODO:` and a one-line reason, and mirrored into [`17_TECH_DEBT.md`](./17_TECH_DEBT.md).
- No commented-out code in commits. Delete it (git remembers).
- Public/shared functions and non-obvious DTO fields benefit from a short doc comment; Swagger `@ApiProperty` descriptions double as API docs on the backend.

---

## Formatting

- **Prettier + ESLint** on the backend (`npm run format`, `npm run lint`). Next.js ESLint on the frontend (`npm run lint`).
- Do not hand-fight the formatter; run it.
- 2-space indent, semicolons, single quotes on the backend (Prettier default in-repo); match file style on the frontend.
- Run `npm run type-check` (web) / `npm run build` (api) before considering a change done.

---

## Reusable component guidelines

- **Check `components/ui/` and the relevant domain folder before creating anything.** Duplication is the #1 debt in this repo (API helpers, `toVector3`, cover-URL logic, two navbars).
- A component is "reusable" when it takes data via props and has no route-specific coupling. Put those in `ui/` (primitives) or the shared domain folder.
- Keep props explicit and typed; avoid `...rest` spreads except on primitive DOM wrappers.
- If you find yourself copy-pasting a helper a second time, extract it to `lib/` (frontend) or `common/` (backend) instead.

---

## Performance guidelines

(See [`18_PERFORMANCE_GUIDE.md`](./18_PERFORMANCE_GUIDE.md) for depth.)

- **WebGL/R3F:** honor the existing `coarse` performance mode; avoid per-frame allocations; reuse geometries/materials; keep the scene mounted only where needed. Never import `journey-scene` without `ssr:false`.
- **Images:** prefer `next/image` for new work (note: existing demo pages use raw `<img>` — acceptable for placeholders, not for real user media at scale).
- **Data fetching:** public reads → `revalidate`; private reads → `no-store`. Don't over-fetch; select only needed fields (backend services already use Prisma `select`).
- **Bundle:** heavy libs (`three`, `framer-motion`, `@react-three/drei`) are in `optimizePackageImports` — keep new heavy deps out of shared client code.
- **Backend:** paginate all list endpoints; use indexed columns in `where`/`orderBy`; keep denormalized counters in sync rather than counting on read.

---

## Testing standards

- Colocate tests as `*.spec.ts(x)`.
- Frontend: **Vitest** + Testing Library (`npm run test`). Reference: `like-button.spec.tsx` (optimistic + revert cases), the `lib/*-api.spec.ts` files.
- Backend: **Jest** (`npm run test`). Reference: `comments.service.spec.ts`, `trips.service.spec.ts`.
- New business logic (services, optimistic components, API wrappers) should ship with tests. UI-only presentational components don't require them.

---

## Definition of "done" for a code change
1. Types pass (`type-check` / `build`).
2. Lint passes.
3. Tests pass (and new logic has tests).
4. Response contract unchanged (or frontend updated in the same change).
5. Relevant docs updated: [`10_COMPONENT_REGISTRY.md`](./10_COMPONENT_REGISTRY.md), [`11_API_REFERENCE.md`](./11_API_REFERENCE.md), [`20_CHANGELOG.md`](./20_CHANGELOG.md), and [`15_PHASE_STATUS.md`](./15_PHASE_STATUS.md) if scope changed.
