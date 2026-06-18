# Wanderverse — API Design Document

## 1. API Design Principles

- **RESTful**: Resource-oriented URLs, HTTP verbs, standard status codes
- **Versioned**: `/v1/` prefix for all endpoints
- **Consistent**: JSON request/response format, snake_case keys, ISO 8601 dates
- **Paginated**: Cursor-based pagination for all list endpoints
- **Authenticated**: Bearer JWT (Clerk-issued) via `Authorization` header
- **Rate Limited**: 429 responses with `Retry-After` header
- **Documented**: OpenAPI 3.1 spec auto-generated from NestJS decorators

## 2. Base URL & Authentication

```
Production:  https://api.wanderverse.com/v1
Staging:     https://api-staging.wanderverse.com/v1
Development: http://localhost:3001/v1
```

### Authentication Header
```
Authorization: Bearer <clerk-jwt-token>
```

### Standard Response Wrapper
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "next_cursor": "eyJpZCI6MTIzfQ=="
  },
  "error": null
}
```

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "title", "message": "Title must be between 1 and 200 characters" }
    ]
  }
}
```

## 3. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Invalid or missing JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Downstream service unavailable |
| `AI_GENERATION_FAILED` | 502 | AI service error |
| `STORAGE_QUOTA_EXCEEDED` | 403 | User storage limit reached |
| `TRIP_LIMIT_REACHED` | 403 | Free tier trip limit reached |

## 4. Endpoint Reference

### 4.1 Authentication (Clerk Webhooks)

```
POST /v1/webhooks/clerk
```
Handles Clerk events: `user.created`, `user.updated`, `user.deleted`, `session.created`, `session.revoked`.

### 4.2 Users

```
GET    /v1/users/me                    → Get current user profile
PATCH  /v1/users/me                    → Update user profile
GET    /v1/users/me/stats              → Get user stats (trips, photos, followers)
GET    /v1/users/me/subscription       → Get current subscription
DELETE /v1/users/me                    → Delete account (GDPR)
```

**User Profile Response:**
```json
{
  "id": "usr_2aBcD3eFgH4iJ",
  "email": "user@example.com",
  "display_name": "Sarah Chen",
  "username": "sarah_travels",
  "avatar_url": "https://cdn.wanderverse.com/avatars/usr_2aBcD3eFgH4iJ.webp",
  "bio": "Photographer & explorer. 47 countries and counting.",
  "location": "San Francisco, CA",
  "website": "https://sarahtravels.com",
  "social_links": {
    "instagram": "@sarah_travels",
    "twitter": "@sarah_travels"
  },
  "preferences": {
    "language": "en",
    "timezone": "America/Los_Angeles",
    "email_notifications": true,
    "unit_system": "metric"
  },
  "subscription": {
    "tier": "explorer",
    "status": "active",
    "current_period_end": "2025-06-15T00:00:00Z"
  },
  "stats": {
    "trips_count": 23,
    "photos_count": 1847,
    "followers_count": 3420,
    "following_count": 156
  },
  "created_at": "2023-03-10T14:23:00Z",
  "updated_at": "2025-01-14T09:15:00Z"
}
```

### 4.3 Trips

```
GET    /v1/trips?status=&privacy=&sort=&cursor=    → List trips (paginated)
POST   /v1/trips                                      → Create trip
GET    /v1/trips/:id                                  → Get trip details
PATCH  /v1/trips/:id                                  → Update trip
DELETE /v1/trips/:id                                  → Delete trip
POST   /v1/trips/:id/duplicate                        → Duplicate trip
POST   /v1/trips/:id/export                           → Export trip (PDF, MP4, static)
GET    /v1/trips/:id/stats                             → Trip analytics
```

**Create Trip Request:**
```json
{
  "title": "Kyoto Cherry Blossom Season",
  "description": "A week exploring temples, gardens, and hidden alleys during sakura season.",
  "start_date": "2025-04-01",
  "end_date": "2025-04-07",
  "locations": [
    {
      "name": "Kyoto, Japan",
      "latitude": 35.0116,
      "longitude": 135.7681,
      "country": "JP",
      "order": 0
    }
  ],
  "privacy": "public",
  "tags": ["japan", "cherry-blossom", "temples", "photography"],
  "cover_photo_id": "media_abc123"
}
```

**Trip Response:**
```json
{
  "id": "trip_9xYzA8bCdE7f",
  "title": "Kyoto Cherry Blossom Season",
  "slug": "kyoto-cherry-blossom-season-2025",
  "description": "A week exploring temples...",
  "status": "draft",
  "privacy": "public",
  "start_date": "2025-04-01",
  "end_date": "2025-04-07",
  "locations": [...],
  "cover_photo": { "id": "media_abc123", "url": "...", "thumbnail_url": "..." },
  "stats": {
    "photos_count": 147,
    "videos_count": 12,
    "story_blocks_count": 24,
    "views_count": 0,
    "likes_count": 0
  },
  "collaborators": [
    { "user_id": "usr_xxx", "role": "editor", "display_name": "John Doe" }
  ],
  "tags": ["japan", "cherry-blossom"],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### 4.4 Media

```
POST   /v1/media/presigned-url            → Get S3 presigned upload URL
POST   /v1/media/batch-presigned-urls     → Batch presigned URLs (up to 50)
GET    /v1/media/:id                      → Get media metadata
PATCH  /v1/media/:id                      → Update media (caption, tags, location)
DELETE /v1/media/:id                      → Delete media
POST   /v1/media/:id/process              → Trigger reprocessing (AI enhancement)
POST   /v1/media/batch-import             → Import from URL (Google Photos, etc.)
GET    /v1/media/:id/exif                 → Get EXIF metadata
```

**Presigned URL Request:**
```json
{
  "filename": "IMG_2025_0401_001.jpg",
  "content_type": "image/jpeg",
  "file_size": 5242880,
  "trip_id": "trip_9xYzA8bCdE7f"
}
```

**Presigned URL Response:**
```json
{
  "media_id": "media_xyz789",
  "upload_url": "https://wanderverse-media.s3.amazonaws.com/uploads/...",
  "upload_fields": {
    "key": "uploads/usr_xxx/2025/04/media_xyz789.jpg",
    "x-amz-algorithm": "AWS4-HMAC-SHA256",
    "x-amz-credential": "...",
    "x-amz-date": "20250115T100000Z",
    "policy": "...",
    "x-amz-signature": "..."
  },
  "public_url": "https://cdn.wanderverse.com/media/media_xyz789.webp",
  "expires_at": "2025-01-15T10:15:00Z"
}
```

**Media Object:**
```json
{
  "id": "media_xyz789",
  "trip_id": "trip_9xYzA8bCdE7f",
  "type": "image",
  "mime_type": "image/jpeg",
  "filename": "IMG_2025_0401_001.jpg",
  "original_url": "https://cdn.wanderverse.com/original/media_xyz789.jpg",
  "variants": {
    "thumbnail": { "url": "...", "width": 300, "height": 200 },
    "medium": { "url": "...", "width": 1200, "height": 800 },
    "large": { "url": "...", "width": 2400, "height": 1600 },
    "webp": { "url": "...", "width": 1200, "height": 800 }
  },
  "metadata": {
    "width": 4032,
    "height": 3024,
    "file_size": 5242880,
    "exif": {
      "camera": "Sony A7IV",
      "lens": "24-70mm GM",
      "aperture": "f/2.8",
      "iso": 400,
      "shutter_speed": "1/250",
      "taken_at": "2025-04-01T06:30:00Z",
      "gps": { "latitude": 35.0116, "longitude": 135.7681, "altitude": 45 }
    }
  },
  "caption": "Golden hour at Fushimi Inari",
  "tags": ["fushimi-inari", "golden-hour", "temple"],
  "ai_description": "A torii gate path at Fushimi Inari shrine during golden hour...",
  "location": { "name": "Fushimi Inari", "latitude": 35.0116, "longitude": 135.7681 },
  "order": 0,
  "created_at": "2025-01-15T10:00:00Z"
}
```

### 4.5 Story (Editor & Layout)

```
GET    /v1/trips/:id/story                → Get story layout
PUT    /v1/trips/:id/story                → Update story layout (full replace)
PATCH  /v1/trips/:id/story/blocks         → Partial block updates
POST   /v1/trips/:id/story/blocks/:id/move → Move block to new position
POST   /v1/trips/:id/story/apply-template  → Apply template to story
POST   /v1/trips/:id/story/auto-layout    → AI auto-layout suggestion
POST   /v1/trips/:id/story/publish        → Publish story (generate static assets)
```

**Story Layout Object:**
```json
{
  "trip_id": "trip_9xYzA8bCdE7f",
  "template": "cinematic-scroll",
  "theme": {
    "primary_color": "#E85D4C",
    "secondary_color": "#2C3E50",
    "font_heading": "Playfair Display",
    "font_body": "Inter",
    "map_style": "wander-dark"
  },
  "blocks": [
    {
      "id": "block_001",
      "type": "hero",
      "position": { "x": 0, "y": 0, "w": 12, "h": 6 },
      "content": {
        "media_id": "media_abc123",
        "title": "Kyoto Cherry Blossom Season",
        "subtitle": "April 1–7, 2025",
        "overlay_opacity": 0.4
      }
    },
    {
      "id": "block_002",
      "type": "map-route",
      "position": { "x": 0, "y": 6, "w": 12, "h": 4 },
      "content": {
        "route_color": "#E85D4C",
        "animation_speed": "normal",
        "show_photos": true,
        "show_timeline": true
      }
    },
    {
      "id": "block_003",
      "type": "photo-grid",
      "position": { "x": 0, "y": 10, "w": 12, "h": 8 },
      "content": {
        "layout": "masonry",
        "media_ids": ["media_xyz789", "media_def456", "media_ghi789"],
        "caption_position": "bottom",
        "gap": 8
      }
    },
    {
      "id": "block_004",
      "type": "text",
      "position": { "x": 2, "y": 18, "w": 8, "h": 3 },
      "content": {
        "text": "The first light of dawn filtered through the torii gates...",
        "style": "quote",
        "alignment": "center"
      }
    }
  ],
  "version": 12,
  "last_edited_by": "usr_2aBcD3eFgH4iJ",
  "last_edited_at": "2025-01-15T14:30:00Z"
}
```

### 4.6 AI Services

```
POST   /v1/ai/generate-story              → Generate story text from trip data
POST   /v1/ai/generate-title              → Generate trip title suggestions
POST   /v1/ai/generate-captions           → Generate captions for media
POST   /v1/ai/enhance-photo               → AI photo enhancement (async job)
POST   /v1/ai/auto-layout                 → AI story layout suggestion
POST   /v1/ai/translate                   → Translate story content
POST   /v1/ai/voice-narrate               → Generate audio narration (async)
POST   /v1/ai/reconstruct-route           → Reconstruct route from photo metadata
GET    /v1/ai/jobs/:id                    → Get AI job status
```

**Generate Story Request:**
```json
{
  "trip_id": "trip_9xYzA8bCdE7f",
  "tone": "poetic",
  "length": "medium",
  "language": "en",
  "focus_areas": ["culture", "food", "nature"],
  "user_prompt": "Emphasize the contrast between the quiet temple mornings and the bustling evening markets."
}
```

**Generate Story Response:**
```json
{
  "job_id": "job_ai_12345",
  "status": "queued",
  "estimated_duration": "15s"
}
```

**Job Status Response (GET /v1/ai/jobs/job_ai_12345):**
```json
{
  "job_id": "job_ai_12345",
  "status": "completed",
  "type": "generate-story",
  "result": {
    "title": "Petals and Silence: A Week in Kyoto",
    "content": "The first light of dawn...",
    "word_count": 847,
    "confidence": 0.94
  },
  "tokens_used": 1847,
  "cost_usd": 0.023,
  "created_at": "2025-01-15T10:00:00Z",
  "completed_at": "2025-01-15T10:00:15Z"
}
```

### 4.7 Maps & Geodata

```
GET    /v1/maps/trips/:id/route           → Get calculated route for trip
GET    /v1/maps/trips/:id/heatmap         → Get heatmap data points
GET    /v1/geocode/forward?q=             → Forward geocode (address → coords)
GET    /v1/geocode/reverse?lat=&lng=      → Reverse geocode (coords → address)
GET    /v1/maps/styles                    → List available map styles
GET    /v1/maps/tiles/:z/:x/:y            → Proxy cached map tiles
```

**Route Response:**
```json
{
  "trip_id": "trip_9xYzA8bCdE7f",
  "distance_km": 47.3,
  "duration_hours": 12.5,
  "legs": [
    {
      "from": { "name": "Fushimi Inari", "lat": 35.0116, "lng": 135.7681 },
      "to": { "name": "Kinkaku-ji", "lat": 35.0394, "lng": 135.7292 },
      "distance_km": 8.2,
      "duration_minutes": 45,
      "mode": "transit",
      "geometry": {
        "type": "LineString",
        "coordinates": [[135.7681, 35.0116], [135.7600, 35.0200], ...]
      }
    }
  ],
  "total_bounds": {
    "north": 35.1000,
    "south": 34.9800,
    "east": 135.8200,
    "west": 135.7000
  }
}
```

### 4.8 Social

```
GET    /v1/feed                           → Discovery feed (public trips)
GET    /v1/trips/:id/comments             → List comments
POST   /v1/trips/:id/comments             → Add comment
DELETE /v1/comments/:id                   → Delete comment
POST   /v1/trips/:id/like                 → Toggle like
GET    /v1/users/:id/trips                → Get user's public trips
POST   /v1/users/:id/follow               → Follow/unfollow user
GET    /v1/users/:id/followers            → List followers
GET    /v1/challenges                     → List active challenges
POST   /v1/challenges/:id/entries         → Submit trip to challenge
```

### 4.9 Payments (Stripe)

```
GET    /v1/subscriptions/plans            → List available plans
POST   /v1/subscriptions                  → Create subscription
PATCH  /v1/subscriptions                  → Update subscription
DELETE /v1/subscriptions                  → Cancel subscription
POST   /v1/subscriptions/upgrade          → Upgrade/downgrade plan
GET    /v1/invoices                       → List invoices
POST   /v1/webhooks/stripe                → Stripe webhook handler
POST   /v1/billing/portal                 → Create customer portal session
```

### 4.10 Real-time (WebSocket)

```
WS /v1/ws
```

**Connection:** JWT token in query param: `?token=<jwt>`

**Events:**
```json
// Client → Server: Join trip room
{ "type": "room:join", "trip_id": "trip_9xYzA8bCdE7f" }

// Server → Client: User joined
{ "type": "user:joined", "user_id": "usr_xxx", "display_name": "John" }

// Client → Server: Cursor position (throttled 10fps)
{ "type": "cursor:move", "trip_id": "trip_9xYzA8bCdE7f", "x": 450, "y": 320 }

// Server → Broadcast: Cursor update
{ "type": "cursor:update", "user_id": "usr_xxx", "x": 450, "y": 320, "color": "#E85D4C" }

// Client → Server: Story block change
{ "type": "story:update", "trip_id": "trip_9xYzA8bCdE7f", "block_id": "block_001", "patch": {...} }

// Server → Broadcast: Story updated
{ "type": "story:updated", "block_id": "block_001", "patch": {...}, "version": 13 }

// Server → Client: AI job completed
{ "type": "ai:completed", "job_id": "job_ai_12345", "trip_id": "trip_9xYzA8bCdE7f" }
```

## 5. Rate Limits

| Tier | Requests/Min | Concurrent Uploads | AI Jobs/Hour | WebSocket Msg/Sec |
|---|---|---|---|---|
| Free | 60 | 3 | 10 | 5 |
| Wanderer | 120 | 10 | 50 | 10 |
| Explorer | 300 | 25 | 200 | 20 |
| Voyager | 600 | 50 | 500 | 30 |

## 6. OpenAPI Specification

The full OpenAPI 3.1 spec is generated from NestJS `@ApiProperty`, `@ApiOperation`, `@ApiResponse` decorators and served at:
```
GET /v1/docs          → Swagger UI
GET /v1/docs-json     → OpenAPI JSON
```

---

*Document Version: 1.0 | Last Updated: 2025-01-15 | Owner: API Team*
