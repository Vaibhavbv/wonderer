# Wanderverse — Technical Architecture

## 1. System Architecture Overview

Wanderverse follows a **microservices-oriented modular monolith** pattern — a single NestJS backend codebase deployed as modular services, with clear service boundaries for future extraction. This balances development velocity with scaling flexibility.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js 15 (App Router)                                             │
│  ├── React Server Components (RSC) for static/SEO content          │
│  ├── Client Components for interactive UI                           │
│  ├── Three.js / React Three Fiber for 3D globe                      │
│  ├── Mapbox GL JS for 2D/3D maps                                    │
│  ├── Framer Motion + GSAP for scroll animations                      │
│  └── Tailwind CSS v4 + Shadcn UI component system                  │
├─────────────────────────────────────────────────────────────────────┤
│  Mobile PWA (Next.js PWA + Service Workers)                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EDGE / CDN LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Vercel Edge Network (Frontend + API Routes)                         │
│  ├── Global static asset caching (images, JS, CSS)                  │
│  ├── API route caching (GET /public/*)                              │
│  └── Edge middleware (auth, geo-routing, A/B testing)               │
├─────────────────────────────────────────────────────────────────────┤
│  CloudFront (S3 media assets)                                        │
│  └── Image optimization via Lambda@Edge / Sharp                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  NestJS API (Modular Monolith)                                       │
│  ├── Auth Module (Clerk integration)                                 │
│  ├── Trip Module (CRUD + metadata)                                   │
│  ├── Media Module (upload, processing, storage)                        │
│  ├── Map Module (geodata, routes, tiles)                             │
│  ├── Story Module (editor, layouts, collaboration)                     │
│  ├── AI Module (OpenAI, Claude, image generation)                    │
│  ├── Social Module (feed, comments, follows)                         │
│  ├── Payment Module (Stripe subscriptions)                             │
│  └── Analytics Module (event tracking, dashboards)                   │
├─────────────────────────────────────────────────────────────────────┤
│  API Gateway (Kong / AWS API Gateway — future)                       │
│  ├── Rate limiting (Redis-based)                                     │
│  ├── Request/response transformation                                 │
│  └── API versioning (/v1, /v2)                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA & STORAGE LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 15 (Primary Database)                                    │
│  ├── Primary: AWS RDS (Multi-AZ)                                    │
│  ├── Read Replicas: 2x (for analytics, public feeds)                │
│  └── Connection Pooling: PgBouncer                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Redis 7 (ElastiCache)                                               │
│  ├── Session cache (Clerk JWT validation)                             │
│  ├── Rate limiting counters                                          │
│  ├── Real-time presence (collaborative editing)                     │
│  ├── Job queues (BullMQ) for AI processing                           │
│  └── Map tile cache                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  AWS S3 (Media Storage)                                              │
│  ├── Original uploads (private, encrypted)                          │
│  ├── Processed variants (thumbnails, WebP, AVIF)                    │
│  ├── Public CDN-ready assets                                         │
│  └── Lifecycle: 90d → Glacier for originals                          │
├─────────────────────────────────────────────────────────────────────┤
│  Meilisearch (Search Engine)                                         │
│  ├── Full-text trip search (title, tags, locations)                   │
│  ├── Geo-search (trips near location)                                │
│  └── User search (creators by name, bio)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ClickHouse (Analytics DB — future)                                  │
│  └── Event streaming, funnel analysis, retention metrics            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AI / ML LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  OpenAI API (GPT-4o, DALL-E 3)                                       │
│  ├── Story generation, title/caption creation                       │
│  └── Image analysis (content description, location inference)         │
├─────────────────────────────────────────────────────────────────────┤
│  Anthropic Claude (Claude 3.5 Sonnet)                                │
│  ├── Long-form narrative generation (higher quality)                │
│  └── Content moderation (safety filtering)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Replicate / Stability AI (Image Generation/Enhancement)             │
│  ├── Photo enhancement, style transfer, upscaling                     │
│  └── Fallback when OpenAI image tools unavailable                   │
├─────────────────────────────────────────────────────────────────────┤
│  Self-hosted AI (Future)                                             │
│  ├── Llama 3.1 70B for basic text generation (cost control)         │
│  └── Stable Diffusion XL for image generation                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Clerk (Authentication)                                              │
│  ├── OAuth providers (Google, Apple, Facebook)                        │
│  ├── MFA, session management, user metadata                           │
│  └── Webhooks: user.created, user.deleted, session.*                │
├─────────────────────────────────────────────────────────────────────┤
│  Stripe (Payments)                                                   │
│  ├── Subscriptions, usage-based billing                             │
│  ├── Webhooks: subscription events, invoice paid, failed payments   │
│  └── Customer portal for self-serve billing                         │
├─────────────────────────────────────────────────────────────────────┤
│  Mapbox (Maps & Geocoding)                                           │
│  ├── Static & dynamic maps, custom styles                             │
│  ├── Geocoding API (forward/reverse)                                 │
│  └── Directions API (route calculation)                               │
├─────────────────────────────────────────────────────────────────────┤
│  WeatherAPI / OpenWeather (Historical Weather)                         │
│  └── Historical weather data for trip dates/locations               │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Service Boundaries (NestJS Modules)

Each module is self-contained with:
- Domain entities (Prisma models)
- DTOs (Zod validation schemas)
- Controller (HTTP handlers)
- Service (business logic)
- Repository (data access, Prisma client)
- Events (event emitters for async processing)

### Module Communication
- **Synchronous**: Direct service injection (same process, bounded context)
- **Asynchronous**: Redis-backed BullMQ queues for cross-module events
- **Events**: NestJS EventEmitter for in-process decoupling

## 3. Data Flow Patterns

### Pattern A: Standard CRUD Flow
```
Client → API Controller → DTO Validation → Service → Repository → PostgreSQL
                                    ↓
                              Cache Invalidation (Redis)
```

### Pattern B: Async AI Processing Flow
```
Client → API Controller → Queue Job (BullMQ) → Worker → AI Service → Result
                                    ↓                          ↓
                              Job Status (Redis)        Store Result (DB)
                                    ↓                          ↓
                              WebSocket/SSE              Notification
```

### Pattern C: Real-time Collaboration Flow
```
Client 1 ──┐
            ├── WebSocket Gateway → Redis Pub/Sub → Broadcast to Room
Client 2 ──┘                              ↓
                                    Presence State (Redis)
```

### Pattern D: Upload Flow
```
Client → Presigned URL (S3) → Direct Upload to S3 → S3 Event → Lambda →
Process (thumbnail, metadata, virus scan) → DB Update → Webhook to Client
```

## 4. Caching Strategy

| Layer | Technology | TTL | Strategy |
|---|---|---|---|
| Browser | Service Worker | 24h | Stale-while-revalidate for assets |
| CDN | CloudFront / Vercel Edge | 1h–1y | Static assets long, API short |
| Application | Redis | 5m–24h | Query result cache, user sessions |
| Database | PostgreSQL + PgBouncer | — | Connection pooling, query plan cache |
| Search | Meilisearch | — | Index auto-updates on DB changes |
| Map Tiles | Redis + Mapbox | 7d | Tile JSON cache, style sprites |

## 5. Security Architecture

### Authentication Flow
```
1. User → Clerk OAuth/Password → Clerk issues JWT
2. Client stores JWT (httpOnly cookie + localStorage fallback)
3. Every request → Clerk middleware validates JWT signature
4. Backend extracts `userId` from JWT claims
5. RBAC: Role-based access control on resources (owner, editor, viewer)
```

### Authorization Matrix
| Resource | Owner | Editor | Viewer | Public |
|---|---|---|---|---|
| Trip metadata | CRUD | RU | R | R* |
| Photos | CRUD | RU | R | R* |
| Story layout | CRUD | RU | R | R* |
| Collaborators | CRUD | — | — | — |
| AI generations | CRUD | CRU | R | — |
| Comments | CRUD | CRU | CR | CR |

*R = Read only if trip is public/unlisted

### Data Protection
- AES-256 encryption at rest for S3 (private trips)
- TLS 1.3 for all data in transit
- Field-level encryption for sensitive PII (email, phone)
- Row-level security (RLS) in PostgreSQL for multi-tenant isolation
- API rate limiting: 100 req/min per user, 1000 req/min per IP

## 6. Deployment Architecture

### Production Environment
```
┌────────────────────────────────────────────────────────────┐
│  AWS Account (Production)                                   │
│  ├── VPC (10.0.0.0/16)                                     │
│  │   ├── Public Subnets (ALB, NAT)                         │
│  │   ├── Private Subnets (ECS Fargate, RDS)                │
│  │   └── Database Subnets (RDS, ElastiCache)              │
│  ├── ECS Fargate (NestJS API)                               │
│  │   ├── 3 tasks minimum, 20 tasks maximum (auto-scale)   │
│  │   └── Health checks, rolling deployments                │
│  ├── RDS PostgreSQL (Multi-AZ)                              │
│  ├── ElastiCache Redis (Cluster Mode)                       │
│  ├── S3 Buckets (Media, Logs, Backups)                     │
│  ├── CloudFront (CDN)                                       │
│  ├── Route53 (DNS)                                          │
│  ├── CloudWatch (Logs, Metrics, Alarms)                    │
│  └── AWS WAF (DDoS, SQL injection, XSS protection)         │
├────────────────────────────────────────────────────────────┤
│  Vercel (Frontend)                                          │
│  ├── Next.js 15 with Edge Runtime                          │
│  ├── ISR for static pages                                   │
│  └── Edge Functions for API routes, middleware             │
└────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline
```
GitHub → GitHub Actions →
  ├── Lint, Type Check, Unit Tests →
  ├── Build Docker Images →
  ├── Push to ECR →
  ├── Terraform Plan/Apply (Infra) →
  ├── ECS Blue/Green Deployment →
  ├── Integration Tests →
  └── Smoke Tests → Production
```

## 7. Monitoring & Observability

### Metrics (Prometheus + Grafana)
- Request latency (p50, p95, p99)
- Error rate (5xx, 4xx breakdown)
- Queue depth (BullMQ job counts)
- Database connection pool usage
- Cache hit/miss rates
- AI API latency and cost per request
- Map tile API usage and costs

### Logging (Structured JSON)
- Correlation IDs across all services
- Request/response logging (sensitive data redacted)
- Error stack traces with source maps
- AI generation audit logs (prompt + output)
- Security events (auth failures, rate limit hits)

### Alerting (PagerDuty + Slack)
- P95 latency > 500ms for 5 minutes
- Error rate > 1% for 2 minutes
- Queue depth > 10,000 jobs
- Database CPU > 80% for 10 minutes
- S3 upload failure rate > 5%
- AI API failure rate > 10%

## 8. Technology Stack Summary

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Frontend Framework | Next.js | 15 | App Router, RSC, Edge, ISR |
| Frontend Language | TypeScript | 5.6+ | Type safety, DX |
| Styling | Tailwind CSS | 4 | Utility-first, JIT, v4 performance |
| UI Components | Shadcn/ui | latest | Radix-based, accessible, customizable |
| Animation | Framer Motion | 11+ | React-native animations, layout animations |
| Scroll Animation | GSAP + ScrollTrigger | 3.12+ | High-performance scroll-driven animation |
| 3D Rendering | Three.js + React Three Fiber | 0.16+ | Declarative 3D in React |
| Maps | Mapbox GL JS | 3.0+ | 2D/3D, custom styles, performance |
| Backend Framework | NestJS | 10+ | Modular, TypeScript, enterprise-grade |
| ORM | Prisma | 5+ | Type-safe queries, migrations, schema management |
| Database | PostgreSQL | 15 | JSONB, full-text search, PostGIS (future) |
| Cache/Queue | Redis | 7 | BullMQ, sessions, real-time presence |
| Search | Meilisearch | 1.8+ | Typo-tolerant, geo-search, fast indexing |
| Auth | Clerk | latest | OAuth, MFA, session management, webhooks |
| Payments | Stripe | latest | Subscriptions, usage billing, webhooks |
| Storage | AWS S3 | — | Multi-region, lifecycle, CDN integration |
| AI/LLM | OpenAI + Anthropic | latest | Best-in-class text + image generation |
| Hosting | Vercel + AWS ECS | — | Edge + containerized backend |
| IaC | Terraform | 1.9+ | Reproducible infrastructure |
| CI/CD | GitHub Actions | — | Native integration, matrix builds |

---

*Document Version: 1.0 | Last Updated: 2025-01-15 | Owner: Engineering Team*
