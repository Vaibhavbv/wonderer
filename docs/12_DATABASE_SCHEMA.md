# 12 — Database Schema

> Source of truth: `apps/api/prisma/schema.prisma` (PostgreSQL via Prisma). This documents every model, relationship, index, and enum — and flags **modeled-but-unused** ("dead") schema. ⚠️ **Remember: a model existing does NOT mean the feature is built** (see [`05_AI_CONTEXT.md`](./05_AI_CONTEXT.md)).
>
> **Never edit an applied migration.** Change the model, then `npx prisma migrate dev --name <change>`.

Legend: ✅ actively used · 💤 **dead** (modeled, never read/written by any service).

---

## Model status at a glance

| Model | Table | Status | Notes |
|---|---|---|---|
| User | `users` | ✅ | Core identity + quotas + subscription fields |
| Session | `sessions` | 💤 | Auth is stateless (Clerk JWT); table unused |
| Trip | `trips` | ✅ | Core domain, denormalized counters |
| TripLocation | `trip_locations` | ✅ | Per-destination |
| TripCollaborator | `trip_collaborators` | ✅ | Sharing/roles |
| Media | `media` | ✅ | Photos/videos |
| Story | `stories` | ✅ | Per-trip JSON blocks |
| Comment | `comments` | ✅ | Threaded (parentId is a plain string, not a FK) |
| Like | `likes` | ✅ | Trip likes |
| CommentLike | `comment_likes` | ✅ | Comment likes (migration 3) |
| Follow | `follows` | ✅ | One-way follow graph |
| AIJob | `ai_jobs` | ✅ | AI generation jobs (`costUsd` never populated) |
| Notification | `notifications` | ✅ | In-app notifications |
| Invoice | `invoices` | 💤 | Payments not built |
| Export | `exports` | 💤 | Exports not built |
| Challenge | `challenges` | 💤 | Community challenges not built |
| ChallengeEntry | `challenge_entries` | 💤 | " |
| UserActivity | `user_activities` | 💤 | Analytics not built |
| MapTileCache | `map_tile_cache` | 💤 | Tile caching not built |

**~13 active / ~6 dead.** Cleaning up dead schema is ticket WV-109 (requires a migration + certainty).

---

## Enums
- **TripStatus:** `DRAFT`, `PUBLISHED`, `ARCHIVED`
- **TripPrivacy:** `PRIVATE`, `UNLISTED`, `PUBLIC`
- **CollaboratorRole:** `VIEWER`, `EDITOR`, `ADMIN`
- **MediaType:** `IMAGE`, `VIDEO`, `AUDIO`
- **AIJobType:** `GENERATE_STORY`, `GENERATE_TITLE`, `GENERATE_CAPTIONS`, `ENHANCE_PHOTO`, `AUTO_LAYOUT`, `TRANSLATE`, `VOICE_NARRATE`, `RECONSTRUCT_ROUTE` — *only STORY/TITLE/ENHANCE are wired; the rest are unreachable.*
- **AIJobStatus:** `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED` (`CANCELLED` never set)
- **ExportFormat:** `PDF`, `STATIC_WEB`, `MP4`, `JSON`

> `Media.processingStatus` and `Notification.type` are **plain strings, not enums** — a modeling inconsistency.

---

## Core models (detail)

### User (`users`) ✅
Identity, preferences, quotas, subscription.
- **Identity:** `id` (cuid), `clerkId` (unique), `email` (unique), `displayName`, `username` (unique), `avatarUrl`, `bio`, `location`, `website`.
- **Prefs:** `timezone` (UTC), `language` (en), `unitSystem` (metric), `emailNotifications` (true — *never actually checked*).
- **Subscription (read-only today):** `subscriptionTier` (free), `subscriptionStatus` (inactive), `stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodEnd`.
- **Quotas:** `storageUsedBytes`/`storageQuotaBytes` (BigInt, 1GB default), `aiCreditsUsed`/`aiCreditsQuota` (10), `tripCount`/`tripQuota` (3).
- **Relations:** trips, media, comments, likes, commentLikes, followers/followings (self-relation via `Follow`), collaborations, aiJobs, exports, notifications, activities, sessions.
- **Indexes:** `clerkId`, `username`, `subscriptionTier`.

### Trip (`trips`) ✅
The shareable hero unit.
- `title` (VarChar 200), `slug` (unique), `description`, `status` (TripStatus=DRAFT), `privacy` (TripPrivacy=PRIVATE), `startDate`/`endDate`, `coverPhotoId` (unique, 1:1 → Media via `TripCover`), `theme` (Json), `tags` (String[]).
- **Denormalized counters (maintained in app code — keep in sync!):** `photosCount`, `videosCount`, `storyBlocksCount`, `viewsCount`, `likesCount`, `commentsCount`.
- **Relations:** locations, media (`TripMedia`), story (1:1), collaborators, comments, likes, exports, aiJobs, challengeEntries.
- **Indexes:** `userId`, `slug`, `status`, `privacy`, `createdAt`, `tags`.

### TripLocation (`trip_locations`) ✅
- `name`, `latitude`/`longitude` (Float), `country`, `city`, `address`, `order`, `arrivedAt`/`departedAt`, `notes` (Text — mig 2), `theme` (Json — mig 2).
- **Relations:** media (via `Media.locationId`, `onDelete: SetNull` — deleting a location detaches, not deletes, its media).
- **Indexes:** `tripId`, `[latitude, longitude]`.
- **Now API-mutable after creation** (flagship-journal upgrade, ADR-016): add/update/delete/reorder via `/v1/trips/:id/locations…`. `order` is append-on-add, compacted on delete, index-assigned on reorder. There is **no denormalized locations counter on Trip** — `getTripStats` counts live; don't add one.
- ~~⚠️ Trip creation currently writes `lat:0,lng:0` (no geocoding — WV-301)~~ → coordinates are user-enterable at create time and editable afterwards (geocoding itself still stubbed — WV-301); `0,0` now means "pin not placed yet".

### Media (`media`) ✅
- `type` (MediaType), `mimeType`, `filename`, `originalUrl`, `variants` (Json — *never populated*), `width`/`height`, `fileSize` (BigInt), `duration`, `exif` (Json), `caption` (VarChar 500), `tags` (String[]), `aiDescription`, `locationName`, `latitude`/`longitude`/`altitude`, `processingStatus` (string, 'pending'), `aiEnhanced` (Boolean), `order`, `locationId` (FK → TripLocation, `SetNull`, mig 2), `coverForTrip` (reverse of `Trip.coverPhotoId`).
- **Indexes:** `tripId`, `userId`, `locationId`, `type`, `createdAt`, `[latitude, longitude]`.

### Story (`stories`) ✅
- `tripId` (unique, 1:1), `template` ('cinematic-scroll'), `theme` (Json), `blocks` (Json, required), `version` (1), `lastEditedBy`, `lastEditedAt`, `publishedAt`, `publishedUrl`.
- **`blocks` shape** (as written by the journal editor + backend default): `[{ id: string, type: 'hero'|'heading'|'text'|'photo'|…, position: {x,y,w,h} (y = block index), content: {…} }]`. Content per type — hero: `{title, subtitle, overlayOpacity}`; heading/text: `{text}`; photo: `{mediaId, url, caption}`. **Editors must preserve unknown block types on save** — `PUT` is a full replace.

### Comment (`comments`) ✅
- `content` (VarChar 2000), `parentId` (⚠ **plain String, not a FK relation** — referential integrity enforced only in app code), `likesCount`, likes (`CommentLike[]`).
- **Indexes:** `tripId`, `userId`, `parentId`, `createdAt`.

### Like (`likes`) ✅ / CommentLike (`comment_likes`) ✅
- `Like`: unique `[tripId, userId]`; indexes `tripId`, `userId`.
- `CommentLike`: unique `[commentId, userId]`; indexes `commentId`, `userId` (added migration 3, cascades from comments & users).

### Follow (`follows`) ✅
- `followerId`/`followingId` (self-relations "follower"/"following" on User). Unique `[followerId, followingId]`. **One-way** (Instagram-style).

### AIJob (`ai_jobs`) ✅
- `type` (AIJobType), `status` (AIJobStatus=QUEUED), `input`/`result` (Json), `error` (Text), `tokensUsed`, `costUsd` (Decimal 10,6 — **never populated**), `queuedAt`/`startedAt`/`completedAt`.
- **Indexes:** `userId`, `tripId`, `status`, `type`.

### Notification (`notifications`) ✅
- `type` (string), `title`, `body`, `data` (Json), `read`/`readAt`.
- **Indexes:** `userId`, `read`, `createdAt`.

### TripCollaborator (`trip_collaborators`) ✅
- `role` (CollaboratorRole=EDITOR). Unique `[tripId, userId]`. Indexes `tripId`, `userId`.

---

## Dead models (💤 — exist but unused)

| Model | Would support | Fields (summary) |
|---|---|---|
| `Session` | server sessions (unneeded — Clerk is stateless) | `token` (unique), `ipAddress`, `userAgent`, `expiresAt` |
| `Invoice` | Stripe billing | `stripeInvoiceId` (unique), `amount` (Decimal 10,2), `currency`, `status`, `periodStart/End`, `pdfUrl` |
| `Export` | Trip Recap / exports | `format` (ExportFormat), `status`, `url`, `fileSize`, `completedAt` |
| `Challenge` / `ChallengeEntry` | community challenges | theme-based challenges with vote counts |
| `UserActivity` | analytics | `type` (string), `metadata` (Json) |
| `MapTileCache` | tile caching | `z/x/y/style`, `tileData` (Bytes), `expiresAt`; unique `[z,x,y,style]` |

**Do not remove these lightly** — they map to planned phases (Exports→P5, Invoice→P6, MapTileCache/UserActivity→P9, Challenge→P10). WV-109 decides keep-vs-remove per item.

---

## Relationships (ER summary)

```
User 1───* Trip 1───* TripLocation 1───* Media
 │           │  1───1 Story
 │           │  1───* Comment *───1 (parentId self, app-enforced)
 │           │  1───* Like / TripCollaborator / AIJob / Export
 │           │  *cover* 1───1 Media (coverPhotoId)
 │
 ├─* Follow *─┤ (self, follower/following, one-way)
 ├─* Media / Comment / Like / CommentLike / AIJob / Notification / Export / UserActivity / Session
Comment 1───* CommentLike
```

---

## Migrations (in order)
1. **`20260625145732_init`** — full baseline: all 7 enums + core tables (users, sessions, trips, trip_locations, trip_collaborators, media, stories, comments, likes, follows, ai_jobs, invoices, exports, challenges, challenge_entries, notifications, user_activities, map_tile_cache) with indexes + FKs. *No `comment_likes` yet.*
2. **`20260627162134_trip_location_notes_and_media_location`** — adds `notes`+`theme` to `trip_locations`; adds `location_id` FK (`SetNull`) + index to `media`.
3. **`20260629173624_add_comment_like`** — creates `comment_likes` (unique `[comment_id, user_id]`, cascades from comments & users).

`migration_lock.toml` pins provider = `postgresql`. Schema ↔ migrations are in sync.

---

## Future schema ideas (align with roadmap)
- **BucketList / SavedPlace** (P4) — the viral-loop "save to bucket list."
- **Passport / stat aggregates** or materialized views (P3) — countries/km/cities.
- **Moment** + ephemeral **Story** distinction (P7).
- Convert `Media.processingStatus` and `Notification.type` to real **enums**.
- Make `Comment.parentId` a proper **self-relation FK** for DB-level integrity.
- Populate `AIJob.costUsd` and `Media.variants` when those features land.
- Reconsider `Session` (likely deletable) once WV-109 is decided.
