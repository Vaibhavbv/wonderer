# Wanderverse — QuickStart Guide

> ⚠️ **This guide is partially outdated.** For the authoritative, code-audited documentation, see **[`docs/00_README.md`](./docs/00_README.md)** — start with [`docs/05_AI_CONTEXT.md`](./docs/05_AI_CONTEXT.md) and [`docs/15_PHASE_STATUS.md`](./docs/15_PHASE_STATUS.md). Corrections: the real app uses **React Three Fiber + Framer Motion** (not GSAP), renders geography with **R3F globes** (Mapbox is not used in the browser), and the signature experience lives in `apps/web/components/journey/` + `components/three/` (there is no `components/story/WanderView`). The standalone `wander-demo.html` prototype was removed in Phase 0 (superseded by the real implementation).

## 🎯 What You Can Do Right Now

The fastest way to see the app: run the frontend dev server (below). The signature "Wander View" is live at `/` (demo data) and at `/trips/[id]/wander` (real trips).

---

## 🚀 Running the Full Application (Requires Setup)

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 10+ | Included with Node.js |
| **PostgreSQL** | 15+ | [postgresql.org](https://postgresql.org/) or [pgAdmin](https://www.pgadmin.org/) |
| **Redis** | 7+ | [redis.io](https://redis.io/) or Docker |
| **Docker** | Latest | [docker.com](https://docker.com/) (optional, recommended) |
| **Git** | 2.40+ | [git-scm.com](https://git-scm.com/) |

### External Services You Need (Free Tiers Available)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Clerk** | Authentication | 10,000 MAU |
| **Mapbox** | Maps & Geocoding | 50,000 loads/month |
| **OpenAI** | AI Story Generation | $5 credit |
| **Stripe** | Payments | Test mode free |
| **AWS S3** | Photo Storage | 12 months free tier |

---

## Step 1: Install Dependencies

### Option A: Using Docker (Easiest)

If you have Docker installed, you can run the entire backend stack with one command:

```bash
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse\infra
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Meilisearch on port 7700

### Option B: Manual Install

1. **Install PostgreSQL** and create a database:
   ```sql
   CREATE DATABASE wanderverse;
   CREATE USER wanderverse WITH PASSWORD 'wanderverse';
   GRANT ALL PRIVILEGES ON DATABASE wanderverse TO wanderverse;
   ```

2. **Install Redis** and start it:
   ```bash
   # Windows (WSL or Docker recommended)
   # Or use Memurai for native Windows Redis
   redis-server
   ```

---

## Step 2: Configure Environment Variables

### Backend (`apps/api/.env`)

Copy the example file and fill in your real API keys:

```bash
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse\apps\api
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
DATABASE_URL=postgresql://wanderverse:wanderverse@localhost:5432/wanderverse?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
CLERK_SECRET_KEY=sk_test_...        # Get from clerk.com
CLERK_PUBLISHABLE_KEY=pk_test_...    # Get from clerk.com

# Optional for full features
OPENAI_API_KEY=sk-...                # Get from platform.openai.com
MAPBOX_ACCESS_TOKEN=pk.eyJ...        # Get from mapbox.com
STRIPE_SECRET_KEY=sk_test_...        # Get from stripe.com
AWS_ACCESS_KEY_ID=...                # Get from AWS Console
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=wanderverse-media
```

### Frontend (`apps/web/.env.local`)

```bash
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse\apps\web
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

---

## Step 3: Start the Backend

```bash
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse\apps\api

# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. (Optional) Seed the database
npm run db:seed

# 5. Start the development server
npm run start:dev
```

The API will be running at **http://localhost:3001**

Check it's working:
```bash
curl http://localhost:3001/health
# Expected: {"status":"healthy",...}
```

API Docs: **http://localhost:3001/v1/docs**

---

## Step 4: Start the Frontend

Open a **new terminal** window:

```bash
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse\apps\web

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The frontend will be running at **http://localhost:3000**

---

## Step 5: Set Up Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com/) and create a free account
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key** into your `.env` files
4. In the Clerk dashboard, add `http://localhost:3000` to your **Allowed Origins**
5. (Optional) Configure OAuth providers (Google, Apple, etc.)

---

## Step 6: First Time Sign-In

1. Open **http://localhost:3000** in your browser
2. Click "Get Started" → Sign up with Clerk
3. After sign-in, you'll be redirected to the **Dashboard**
4. Click "New Trip" to create your first trip
5. Upload photos, add locations, and build your story

---

## 📁 Project Structure

```
wanderverse/
├── docs/                          # Product & architecture docs
│   ├── PRD.md                     # Product Requirements
│   ├── ARCHITECTURE.md            # System Architecture
│   ├── API_DESIGN.md              # API Specification
│   ├── DESIGN_SYSTEM.md           # Design Tokens & Motion
│   ├── MONETIZATION.md            # Revenue Strategy
│   └── ROADMAP.md                 # Implementation Plan
│
├── apps/
│   ├── api/                       # NestJS Backend
│   │   ├── prisma/schema.prisma   # Database schema (12 models)
│   │   ├── src/
│   │   │   ├── main.ts            # App entry point
│   │   │   ├── app.module.ts      # Root module
│   │   │   ├── auth/              # Clerk authentication
│   │   │   ├── users/             # User management
│   │   │   ├── trips/             # Trip CRUD
│   │   │   ├── media/             # Photo upload (S3)
│   │   │   ├── stories/           # Story editor
│   │   │   ├── ai/                # OpenAI integration
│   │   │   ├── maps/              # Mapbox & geocoding
│   │   │   └── common/            # Guards, interceptors, decorators
│   │   ├── docker/Dockerfile
│   │   └── .env.example
│   │
│   └── web/                       # Next.js 15 Frontend
│       ├── app/                   # App Router pages
│       │   ├── layout.tsx         # Root layout (ClerkProvider)
│       │   ├── page.tsx           # Landing page
│       │   ├── dashboard/page.tsx # Trip dashboard
│       │   └── trips/[id]/
│       │       ├── page.tsx       # Trip detail
│       │       └── wander/page.tsx # Immersive scroll view
│       ├── components/
│       │   ├── ui/                # Button, Card (Shadcn-style)
│       │   ├── layout/            # Navbar, Footer
│       │   ├── landing/           # Hero, Features, Pricing
│       │   ├── dashboard/         # TripGrid, StatsCards
│       │   ├── trips/             # TripDetail
│       │   ├── map/               # MapViewer (Mapbox GL)
│       │   └── story/             # WanderView (scroll experience)
│       ├── lib/utils.ts           # Utility functions
│       └── public/
│           └── wander-demo.html   # Standalone demo (open in browser)
│
└── infra/
    ├── docker-compose.yml         # PostgreSQL + Redis + API
    └── terraform/                 # AWS infrastructure (Terraform)
```

---

## 🔧 Common Commands

### Backend
```bash
cd apps/api

npm run start:dev        # Development with watch
npm run build            # Production build
npm run test             # Run tests
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio (GUI)
npx prisma generate      # Regenerate Prisma client
```

### Frontend
```bash
cd apps/web

npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint check
npm run type-check       # TypeScript check
```

### Database
```bash
cd apps/api

# Open Prisma Studio (GUI to browse/edit data)
npx prisma studio

# Reset database (development only)
npm run db:reset

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Deploy migrations (production)
npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### "npm: command not found"
**Fix:** Install Node.js from [nodejs.org](https://nodejs.org/). npm is included.

### "Cannot connect to database"
**Fix:** Make sure PostgreSQL is running and the database exists:
```bash
# Check if PostgreSQL is running
pg_isready

# Create the database if missing
psql -U postgres -c "CREATE DATABASE wanderverse;"
```

### "Redis connection refused"
**Fix:** Start Redis:
```bash
redis-server
# Or with Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### "Prisma client not found"
**Fix:** Generate the client:
```bash
npx prisma generate
```

### "Clerk authentication fails"
**Fix:**
1. Check that `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are set correctly
2. Verify `localhost:3000` is in Clerk's Allowed Origins
3. Make sure your Clerk application is in "Development" mode

### "Port 3000 or 3001 already in use"
**Fix:** Kill the process or use a different port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change the port in .env
PORT=3002
```

---

## 🎨 What to See First

Once everything is running, visit these URLs in order:

1. **http://localhost:3000** — Landing page (Hero, Features, Pricing)
2. **http://localhost:3000/v1/docs** — API documentation (Swagger UI)
3. Sign up → **http://localhost:3000/dashboard** — Your trip dashboard
4. Create a trip → **http://localhost:3000/trips/<id>** — Trip detail with photos and map
5. Click "Wander View" → **Immersive scroll experience** with synced map and animations

---

## 🧪 Testing Without External APIs

If you don't want to set up Clerk, Mapbox, OpenAI, or Stripe yet, the app will still work with these limitations:

| Missing Service | Impact | Workaround |
|---------------|--------|-----------|
| Clerk | No auth | The landing page still works. For dashboard, mock auth middleware |
| Mapbox | No real maps | The demo uses a gradient placeholder; map data won't load |
| OpenAI | No AI generation | Story generation returns placeholder text |
| Stripe | No payments | Subscription features are UI-only |
| AWS S3 | No photo uploads | Use local file URLs or Unsplash placeholders |

To run the app without API keys, just skip those steps and set dummy values in `.env`:
```env
CLERK_SECRET_KEY=dummy
OPENAI_API_KEY=dummy
MAPBOX_ACCESS_TOKEN=dummy
STRIPE_SECRET_KEY=dummy
```

The app will start and show the UI, but those features will be non-functional.

---

## 📚 Next Steps After Setup

1. **Customize the Design System** — Edit `apps/web/app/globals.css` to change brand colors, fonts, and spacing
2. **Add Real Mapbox Integration** — Replace the gradient placeholder in `MapViewer` with a real Mapbox token
3. **Connect AI Generation** — Add your OpenAI key and test story generation
4. **Set Up S3 Upload** — Configure AWS credentials for photo storage
5. **Deploy to Production** — Follow the Terraform README in `infra/terraform/`

---

## 💬 Getting Help

If you run into issues:
1. Check the **Troubleshooting** section above
2. Review the relevant `.md` file in `/docs` for architecture decisions
3. Check the API docs at `http://localhost:3001/v1/docs` for endpoint details

---

*Happy Wandering! 🌍✨*
