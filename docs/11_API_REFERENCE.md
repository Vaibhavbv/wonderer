# 11 — API Reference

> Every endpoint in `apps/api`, grounded in the Phase 0 audit. **Base path `/v1`** (URI versioning). Local dev: `http://localhost:3001`. Live interactive docs (Swagger): **`/v1/docs`**.
>
> **Auth column:** 🔒 = requires `ClerkAuthGuard` (Bearer JWT) · 🌐 = public. **Status:** ✅ real · ⚠️ partial/stub.
> **All responses** are wrapped: success `{ success:true, data, meta, error:null }`; error `{ success:false, data:null, meta:null, error:{ code, message, details } }`.

---

## Conventions
- **Auth:** `Authorization: Bearer <clerk-jwt>`. `request.user.id` is the **DB cuid**, not the Clerk id.
- **Pagination (list endpoints):** query `cursor`, `per_page`, `sort`; response `meta` carries `total` / `nextCursor` (and `unreadCount` for notifications).
- **Validation:** DTO + `class-validator`, enforced by global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`). Every mutation body is now typed (the former `stories` PUT `any` was fixed — WV-108).
- **Rate limiting:** enforced globally via `ThrottlerGuard` ('short' 100/min, 'long' 1000/hr); `/health` + `/ready` exempted (WV-901, ADR-013).
- **Error codes** are `snake_case`.

---

## Health — `AppController` (no version prefix)
| Method | Path | Auth | Purpose | Status |
|---|---|---|---|---|
| GET | `/health` | 🌐 | Liveness: status/timestamp/service/version | ✅ |
| GET | `/ready` | 🌐 | Readiness probe | ✅ |

---

## Auth — `/v1/auth`  ⚠️ (thin; mostly superseded by the guard)
| Method | Path | Auth | Purpose | Status |
|---|---|---|---|---|
| POST | `/v1/auth/sync` | 🔒 | Upsert the **authenticated** user's profile fields. Body `SyncUserDto {email, displayName?, username?, avatarUrl?}`. `clerkId` is taken from the verified JWT, **not** the body. | ✅ (guarded — WV-101 resolved, ADR-011) |
| GET | `/v1/auth/me` | 🔒 | Stub — returns `{message:'Use /v1/users/me'}` | ⚠️ dead (removal candidate, tech-debt #25) |

> Real user provisioning happens automatically inside `ClerkAuthGuard`. Prefer `PATCH /v1/users/me` for profile edits. Both `auth/*` routes are now guarded.

---

## Users — `/v1/users`  🔒
| Method | Path | Purpose | Input | Output |
|---|---|---|---|---|
| GET | `/v1/users/me` | Current user profile | — | user (selected fields) |
| PATCH | `/v1/users/me` | Update own profile | `UpdateProfileDto` (displayName, username, bio, location, website, timezone, language, unitSystem, emailNotifications, avatarUrl — all optional; username is URL-safe-validated) | updated user (**409** if username taken) |
| GET | `/v1/users/me/stats` | Aggregate stats | — | `{tripsCount, mediaCount, followersCount, followingCount, totalViews}` |
| GET | `/v1/users/me/subscription` | Subscription view (read-only) | — | `{subscriptionTier, subscriptionStatus, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd}` |
| DELETE | `/v1/users/me` | GDPR delete (cascades) | — | 200 |

All ✅. Note: subscription fields are **read-only** — nothing writes them (payments not built).

---

## Trips — `/v1/trips`  🔒
| Method | Path | Purpose | Input | Output | Status |
|---|---|---|---|---|---|
| GET | `/v1/trips` | List own trips | `TripListQueryDto {status?, privacy?, search?}` + pagination | trips[] + meta | ✅ |
| POST | `/v1/trips` | Create (multi-destination) | `CreateTripDto {title, description?, startDate?, endDate?, privacy?, locations?: LocationDto[], tags?, theme?, coverPhotoId?}` | trip | ✅ (enforces `tripQuota`; auto-slug; per-location theme via `inferTheme`) |
| GET | `/v1/trips/:id` | Full trip (locations, coverPhoto, media, collaborators, `isLiked`) | — | trip | ✅ (403 if private & not owner) |
| PATCH | `/v1/trips/:id` | Update | `UpdateTripDto` | trip | ✅ (owner or non-VIEWER collaborator) |
| DELETE | `/v1/trips/:id` | Delete | — | 204 | ✅ (owner only) |
| POST | `/v1/trips/:id/duplicate` | Clone as new PRIVATE trip | — | trip | ✅ access-checked (`getAccessibleTrip`) — WV-102 resolved |
| GET | `/v1/trips/:id/stats` | Trip stats | — | counts (photos/videos/storyBlocks/views/likes/comments, locationsCount, totalMediaSize) | ✅ (owner only) |
| POST | `/v1/trips/:id/like` | Like | — | 201 | ✅ (409 if already liked; notifies owner) |
| DELETE | `/v1/trips/:id/like` | Unlike | — | 200 | ✅ |
| POST | `/v1/trips/:id/locations` | Add a stop after creation | `CreateLocationDto {name, latitude, longitude, country?, city?, notes?}` — lat/lng **required** & range-validated | location | ✅ (owner/non-VIEWER via `getEditableTrip`; order = max+1; theme via `inferTheme`) |
| PATCH | `/v1/trips/:id/locations/:locationId` | Update a stop | `UpdateLocationDto` (all fields optional) | location | ✅ (404 if location not on this trip; theme recomputed when name/country change) |
| DELETE | `/v1/trips/:id/locations/:locationId` | Remove a stop | — | 204 | ✅ (remaining `order` re-compacted; media keeps existing via `onDelete: SetNull`) |
| PUT | `/v1/trips/:id/locations/order` | Reorder all stops | `ReorderLocationsDto {locationIds[]}` — must contain every location exactly once (400 otherwise) | locations[] | ✅ |

**Mutation guard:** all location routes (and `PATCH /v1/trips/:id`) use `getEditableTrip` — owner or non-VIEWER collaborator. `getAccessibleTrip` remains the *read* check only.

---

## Stories — `/v1/trips/:tripId/story`  🔒
| Method | Path | Purpose | Input | Output | Status |
|---|---|---|---|---|---|
| GET | `/v1/trips/:tripId/story` | Get (lazily creates default) | — | story | ✅ |
| PUT | `/v1/trips/:tripId/story` | Full replace | `UpdateStoryDto {template?, theme?, blocks}` (✅ typed — WV-108) | story | ✅ (owner/non-VIEWER collaborator) |

---

## Media — `/v1/media`  🔒
| Method | Path | Purpose | Input | Output | Status |
|---|---|---|---|---|---|
| POST | `/v1/media/presigned-url` | Mint S3 presign + create `Media` row | `PresignedUrlDto {filename, contentType, fileSize, tripId}` | `{uploadUrl, media}` | ✅ (15-min TTL; enforces `storageQuotaBytes`) |
| POST | `/v1/media/batch-presigned-urls` | Batch (max 50) | `PresignedUrlDto[]` | array | ✅ |
| GET | `/v1/media/trip/:tripId` | List trip media (scoped to `{tripId,userId}`) | pagination | media[] + meta | ✅ |
| GET | `/v1/media/:id` | Metadata | — | media | ✅ (owner) |
| PATCH | `/v1/media/:id` | Update | `UpdateMediaDto {caption?, tags?, locationName?, latitude?, longitude?, locationId?}` | media | ✅ (validates `locationId` in same trip) |
| DELETE | `/v1/media/:id` | Delete | — | 204 | ⚠️ **leaks S3 object** (DB row only — WV-107) |
| POST | `/v1/media/:id/process` | Trigger processing | — | `{queued:true}` | ⚠️ **no-op stub** |

**Upload flow:** presign → browser `PUT`s bytes directly to S3 → `PATCH` to attach metadata.

---

## AI — `/v1/ai`  🔒
| Method | Path | Purpose | Input | Output | Status |
|---|---|---|---|---|---|
| POST | `/v1/ai/generate-story` | Queue story generation | `GenerateStoryDto {tripId, tone?, length?, language?, focusAreas?, userPrompt?}` | `AIJob` | ✅ (BullMQ→OpenAI `gpt-4o`; checks `aiCreditsQuota`) |
| POST | `/v1/ai/generate-title` | Queue title generation | `GenerateTitleDto {destinations[], dates?, theme?}` | `AIJob` | ✅ (`gpt-4o-mini`) |
| POST | `/v1/ai/enhance-photo` | Queue photo enhancement | `EnhancePhotoDto {mediaId, enhancementType?}` | `AIJob` | ⚠️ **placeholder** — processor returns fake success |
| GET | `/v1/ai/jobs/:id` | Job status/result | — | `AIJob` | ✅ (owner) |

Poll `GET /v1/ai/jobs/:id` for async results. Enum job types `GENERATE_CAPTIONS/AUTO_LAYOUT/TRANSLATE/VOICE_NARRATE/RECONSTRUCT_ROUTE` have **no endpoint** (WV-801).

---

## Maps — `/v1/maps`  🔒
| Method | Path | Purpose | Output | Status |
|---|---|---|---|---|
| GET | `/v1/maps/trips/:tripId/route` | Route legs (haversine dist/duration) + bbox | route | ✅ (rough estimates, no external routing) |
| GET | `/v1/maps/trips/:tripId/heatmap` | Media lat/lng points | points | ✅ |
| GET | `/v1/maps/geocode/forward?q=` | Forward geocode | `{results:[]}` | ⚠️ **stub — always empty** (WV-301) |
| GET | `/v1/maps/geocode/reverse?lat=&lng=` | Reverse geocode | `{results:[]}` | ⚠️ **stub — always empty** |
| GET | `/v1/maps/styles` | Map styles | hardcoded array | ⚠️ static |

---

## Social — public reads (`SocialController`)  🌐
| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/v1/discover` | Recent public+published trips (paginated) | ✅ |
| GET | `/v1/profiles/:username` | Public profile + stats | ✅ |
| GET | `/v1/profiles/:username/trips` | User's public published trips | ✅ |
| GET | `/v1/profiles/:username/followers` | Followers list | ✅ |
| GET | `/v1/profiles/:username/following` | Following list | ✅ |

## Social — feed & follow (`FeedController`)  🔒
| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/v1/feed` | Trips from followed users (published/public/unlisted) | ✅ |
| GET | `/v1/profiles/:username/relationship` | `{isFollowing, isSelf}` | ✅ |
| POST | `/v1/profiles/:username/follow` | Follow | ✅ (409 if already; 400 if self) |
| DELETE | `/v1/profiles/:username/follow` | Unfollow | ✅ |

> `social` deliberately splits public vs guarded routes into two controller classes in one file — a documented pattern (public reads must not require auth).

---

## Comments  🔒
| Method | Path | Purpose | Input | Status |
|---|---|---|---|---|
| POST | `/v1/trips/:tripId/comments` | Add comment/reply | `CreateCommentDto {content, parentId?}` | ✅ (validates parent in same trip; notifies owner) |
| GET | `/v1/trips/:tripId/comments` | Top-level comments + 1-level replies + `isLiked` | pagination | ✅ |
| DELETE | `/v1/comments/:id` | Delete | — | ✅ (author or trip owner; cascades replies + count) |
| POST | `/v1/comments/:id/like` | Like | — | ✅ (409 if already; notifies author) |
| DELETE | `/v1/comments/:id/like` | Unlike | — | ✅ |

---

## Notifications — `/v1/notifications`  🔒
| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/v1/notifications` | Paginated + `unreadCount` in meta | ✅ |
| PATCH | `/v1/notifications/read-all` | Mark all read | ✅ |
| PATCH | `/v1/notifications/:id/read` | Mark one read (owner) | ✅ |

---

## Not implemented (no controllers exist)
`payments`, `webhooks`, `analytics`, `exports` are **empty `@Module({})`** — no endpoints. See [`07_ROADMAP.md`](./07_ROADMAP.md) Phases 5/6/9 and backlog WV-201/501/601/903.

---

## Future improvements (API-wide)
- Consolidate hand-rolled pagination into one helper (WV-106).
- Add the missing typed wrappers on the frontend for follow/relationship (WV-105).
- Version bump strategy for breaking changes (currently only `v1`) — see [`14_GIT_WORKFLOW.md`](./14_GIT_WORKFLOW.md) versioning.
- Per-route throttle profiles (stricter on `POST /v1/ai/*`, looser on public reads) — global throttling is now enforced (WV-901); per-route tuning is a Phase 9 refinement (WV-903).
- Consider consistent 404-vs-403 semantics for private resources (avoid leaking existence).
