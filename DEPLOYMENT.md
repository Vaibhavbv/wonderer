# Wanderverse — Zero-Local Setup Deployment Guide

## 🎯 The Plan (No Local Machine Setup Required)

You don't need to install anything on your computer. We'll use GitHub + cloud platforms. Here's the architecture:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel         │     │   Render         │     │   Neon (DB)      │
│   (Next.js 15)   │────▶│   (NestJS API)   │────▶│   PostgreSQL     │
│   wanderverse    │     │   wanderverse-api│     │   1GB Free       │
│   vercel.app     │     │   render.com     │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                                               │
         │         ┌──────────────────┐                  │
         └────────▶│   Upstash      │                  │
                   │   Redis 7      │                  │
                   │   10MB Free    │                  │
                   └──────────────────┘                  │
                                                          │
                              ┌──────────────────┐        │
                              │   Clerk (Auth)   │        │
                              │   10,000 MAU     │        │
                              │   (Free)         │        │
                              └──────────────────┘        │
                                                           │
                              ┌──────────────────┐         │
                              │   Mapbox (Maps)  │         │
                              │   50K loads/mo   │         │
                              │   (Free)         │         │
                              └──────────────────┘         │
                                                           │
                              ┌──────────────────┐         │
                              │   OpenAI (AI)    │         │
                              │   $5 Credit      │         │
                              │   (Free)         │         │
                              └──────────────────┘         │
                                                           │
                              ┌──────────────────┐         │
                              │   AWS S3         │         │
                              │   (Free Tier)    │         │
                              │   12 Months      │         │
                              └──────────────────┘◄────────┘
```

## 🏗️ Where Each Part Lives

| Service | Platform | Free Tier | Purpose |
|---------|----------|-----------|---------|
| **Frontend** | Vercel | Unlimited | Next.js 15 app, SSR, Edge, ISR |
| **Backend API** | Render | 750 hrs/month | NestJS API server |
| **Database** | Neon | 1GB, 10M rows | PostgreSQL 15 |
| **Cache/Queue** | Upstash | 10MB | Redis 7 for sessions & BullMQ |
| **Auth** | Clerk | 10,000 MAU | OAuth, MFA, session management |
| **Maps** | Mapbox | 50K loads/mo | Custom map tiles & geocoding |
| **AI** | OpenAI | $5 credit | Story generation, captions |
| **Storage** | AWS S3 | 12 months free | Photo uploads (or use Cloudflare R2) |
| **Domain** | Vercel | Free *.vercel.app | Custom domain upgrade later |

---

## 📋 What You Need (All Free, No Credit Card for Most)

1. **GitHub account** (free)
2. **Vercel account** (free — sign up with GitHub)
3. **Render account** (free — sign up with GitHub)
4. **Neon account** (free — no credit card)
5. **Upstash account** (free — no credit card)
6. **Clerk account** (free — sign up, no credit card)
7. **Mapbox account** (free — no credit card needed for dev token)
8. **OpenAI account** (free — $5 credit on signup)
9. **AWS account** (free tier — requires credit card for verification)

> **Alternative:** Skip AWS S3 initially and use Cloudflare R2 (free 10GB, no egress fees) — better for the long run anyway.

---

## Step 1: Push to GitHub (Monorepo Setup)

### Create a GitHub Repository

Go to [github.com](https://github.com) → Create a new repository named `wanderverse` → Public or Private → **Don't initialize with a README** (we already have one).

### Push Your Code

```bash
# Open Git Bash or any terminal
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse

# Initialize git repo
git init

# Add all files
git add .

# Commit
git commit -m "feat: Wanderverse initial commit - full SaaS stack"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/wanderverse.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Why This Matters for Vercel

Vercel detects **Next.js apps** automatically in a monorepo. It will:
- Find the `apps/web` folder
- Build the Next.js app
- Deploy it globally on their Edge Network
- Handle SSL, CDN, and previews for every PR automatically

---

## Step 2: Deploy Frontend to Vercel

### Method A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **"Add New Project"**
3. Select your `wanderverse` repository from the list
4. Vercel will detect the Next.js app in `apps/web/`
5. Configure build settings:

```
Framework Preset: Next.js
Root Directory: apps/web
Build Command: next build
Output Directory: .next
Install Command: npm install
```

6. Add Environment Variables (see below)
7. Click **Deploy**

### Method B: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login (opens browser)
vercel login

# Deploy from project root
cd C:\Users\L-0098\Documents\Personal\Kimi\Wonder\wanderverse\apps\web
vercel

# Follow prompts:
# ? Set up and deploy? [Y/n] → Y
# ? Which scope? → Your account
# ? Link to existing project? → N (first time)
# ? What's your project name? → wanderverse
# ? In which directory is your code located? → ./ (current)
```

### Frontend Environment Variables (Vercel)

In the Vercel dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://wanderverse-api.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

> Note: `NEXT_PUBLIC_` variables are exposed to the browser. Never put secrets here.

### Vercel Settings for This Project

Go to **Project Settings → General** and set:

```
Build & Development Settings:
  Framework Preset: Next.js
  Root Directory: apps/web
  Build Command: cd ../.. && npm install && cd apps/web && next build
  
Or if using a monorepo tool (Turborepo):
  Build Command: npx turbo run build --filter=web
```

Since we don't have a monorepo config file yet, Vercel should auto-detect the Next.js app. If it doesn't, point it to `apps/web` as the root directory.

---

## Step 3: Deploy Backend to Render

### Create a New Web Service

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Select your `wanderverse` repository
4. Configure:

```
Name: wanderverse-api
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: apps/api
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
Instance Type: Free (512MB RAM, 0.1 CPU)
```

### Backend Environment Variables (Render)

Go to **Environment** tab and add:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://... (from Neon, see Step 4)
REDIS_HOST=... (from Upstash, see Step 5)
REDIS_PORT=6379
REDIS_PASSWORD=... (from Upstash)
REDIS_DB=0
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
OPENAI_API_KEY=sk-...
MAPBOX_ACCESS_TOKEN=pk.eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=wanderverse-media
CORS_ORIGINS=https://wanderverse.vercel.app,https://www.wanderverse.com
FRONTEND_URL=https://wanderverse.vercel.app
```

### Important Render Settings

- **Auto-Deploy**: On (deploys on every push to main)
- **Health Check Path**: `/health`
- **Disk**: Not needed (stateless, uses S3 for files)

> Render free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds. For production, upgrade to Starter ($7/month) for always-on.

---

## Step 4: Set Up Neon Database

### Create a Neon Project

1. Go to [neon.tech](https://neon.tech) → Sign up
2. Create a new project named `wanderverse`
3. Choose **AWS** region (us-east-1 for Render compatibility)
4. Copy the connection string:

```
postgresql://wanderverse_owner:password@ep-xxx.us-east-1.aws.neon.tech/wanderverse?sslmode=require
```

5. Paste this into Render's `DATABASE_URL` environment variable

### Run Migrations on Render

You can either:

**Option A:** SSH into Render's shell and run:
```bash
# In Render dashboard → Shell tab
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

**Option B:** Add a startup script to `package.json`:
```json
"scripts": {
  "start:prod": "prisma migrate deploy && prisma generate && node dist/main"
}
```

### Prisma Studio on Neon

```bash
# Local (if you install Node.js later)
DATABASE_URL=postgresql://... npx prisma studio

# Or use Neon's built-in SQL Editor in their dashboard
```

---

## Step 5: Set Up Upstash Redis

### Create a Redis Database

1. Go to [upstash.com](https://upstash.com) → Sign up
2. Create a new Redis database named `wanderverse`
3. Choose **AWS** region (us-east-1)
4. Copy the **endpoint** and **password** from the dashboard

### Add to Render Environment Variables

```
REDIS_HOST=xxx-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
REDIS_DB=0
```

> Upstash free tier: 10,000 commands/day, 10MB storage. Perfect for dev.

---

## Step 6: Set Up Clerk Authentication

### Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) → Sign up
2. Create a new application named `Wanderverse`
3. Choose sign-in methods: **Email + Google** (at minimum)
4. Go to **API Keys** → copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → Vercel env vars
   - `CLERK_SECRET_KEY` → Render env vars

### Configure Clerk URLs

In Clerk Dashboard → **Configure → URLs**:

```
Home URL: https://wanderverse.vercel.app
Sign-in URL: https://wanderverse.vercel.app/sign-in
Sign-up URL: https://wanderverse.vercel.app/sign-up
Redirect URL: https://wanderverse.vercel.app/dashboard
```

### Add Allowed Origins

In Clerk Dashboard → **Configure → CORS**:

```
https://wanderverse.vercel.app
https://wanderverse-api.onrender.com
```

### Webhook (Optional but Recommended)

In Clerk Dashboard → **Webhooks** → Add Endpoint:

```
URL: https://wanderverse-api.onrender.com/v1/webhooks/clerk
```

Select events: `user.created`, `user.updated`, `user.deleted`

Copy the **Signing Secret** → Add to Render env vars as `CLERK_WEBHOOK_SECRET`

---

## Step 7: Set Up Mapbox

1. Go to [mapbox.com](https://mapbox.com) → Sign up
2. Go to **Account → Tokens** → Create a new **Public Access Token**
3. Copy the token → Add to both Vercel and Render env vars as `MAPBOX_ACCESS_TOKEN` / `NEXT_PUBLIC_MAPBOX_TOKEN`

---

## Step 8: Set Up OpenAI

1. Go to [platform.openai.com](https://platform.openai.com) → Sign up
2. Go to **API Keys** → Create new secret key
3. Copy the key → Add to Render env vars as `OPENAI_API_KEY`
4. Set up a **usage limit** (e.g., $5/month) to avoid surprises

---

## Step 9: Set Up S3 (or Cloudflare R2)

### Option A: AWS S3 (Free Tier)

1. Go to [aws.amazon.com](https://aws.amazon.com) → Sign up (requires credit card)
2. Create an S3 bucket named `wanderverse-media`
3. Region: **US East (N. Virginia)** `us-east-1`
4. Create an IAM user with **AmazonS3FullAccess** policy
5. Copy Access Key ID and Secret Access Key → Render env vars

### Option B: Cloudflare R2 (Better — Free 10GB, No Egress Fees)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Sign up
2. Go to **R2** → Create bucket named `wanderverse-media`
3. Create an API token with **Object Read & Write** permissions
4. Copy Account ID, Access Key ID, Secret Access Key → Render env vars
5. Update the AWS SDK config to use R2's endpoint:

```typescript
// In media.service.ts, add this to S3Client config:
endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
```

---

## Step 10: Set Up Stripe (Optional for Now)

1. Go to [stripe.com](https://stripe.com) → Sign up
2. Go to **Developers → API Keys** → Copy test keys
3. Add to Render env vars
4. Go to **Webhooks** → Add endpoint:

```
URL: https://wanderverse-api.onrender.com/v1/webhooks/stripe
Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.updated
```

Copy webhook secret → `STRIPE_WEBHOOK_SECRET` in Render env vars

---

## 🔄 Full Environment Variable Reference

### Vercel (Frontend)

```
NEXT_PUBLIC_API_URL=https://wanderverse-api.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

### Render (Backend)

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://wanderverse_owner:password@ep-xxx.us-east-1.aws.neon.tech/wanderverse?sslmode=require
REDIS_HOST=xxx-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=...
REDIS_DB=0
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-... (optional)
MAPBOX_ACCESS_TOKEN=pk.eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=wanderverse-media
CORS_ORIGINS=https://wanderverse.vercel.app
FRONTEND_URL=https://wanderverse.vercel.app
```

---

## 🚀 Automated Deployment (CI/CD)

### GitHub Actions for Vercel

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Vercel
on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./apps/web
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./apps/web
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./apps/web
```

### Render Auto-Deploy

Render already auto-deploys on every push to `main`. No additional CI needed for the backend.

---

## 📊 Cost Breakdown (Monthly, All Free Tier)

| Service | Free Tier | Upgrade Cost |
|---------|-----------|-------------|
| Vercel | Unlimited deploys, 100GB bandwidth | Pro: $20/mo |
| Render | 750 hrs, 512MB RAM | Starter: $7/mo |
| Neon | 1GB storage, 10M rows | Pro: $0.025/GB |
| Upstash | 10MB, 10K commands/day | Pay-as-you-go |
| Clerk | 10,000 MAU | Pro: $25/mo |
| Mapbox | 50K loads/mo | Pay-as-you-go |
| OpenAI | $5 credit | Pay-as-you-go |
| AWS S3 | 12 months free | ~$0.023/GB |
| **Total** | **$0/month** | **~$60/mo** when scaling |

---

## 🌐 Custom Domain (Later)

Once everything works, buy a domain (e.g., `wanderverse.com`) and:

1. **Vercel**: Project Settings → Domains → Add `www.wanderverse.com`
2. **Render**: Project Settings → Custom Domain → Add `api.wanderverse.com`
3. **DNS**: Add CNAME records in your domain registrar pointing to Vercel/Render

Update CORS origins and redirect URLs to use the custom domain.

---

## 🐛 Troubleshooting Deployed Issues

### "CORS errors in browser console"
**Fix:** Make sure `CORS_ORIGINS` on Render includes your Vercel URL exactly:
```
CORS_ORIGINS=https://wanderverse.vercel.app,https://wanderverse-xxx.vercel.app
```

### "Database connection timeout"
**Fix:** Neon databases sleep after 5 min of inactivity on free tier. First connection after sleep is slow. Add a warmup ping or use connection pooling.

### "Redis connection refused"
**Fix:** Make sure you're using the **Redis** protocol (not REST) URL from Upstash. The format should be:
```
REDIS_HOST=xxx-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=password
```

### "Photos not uploading to S3"
**Fix:** Check the S3 bucket CORS policy allows requests from your Vercel domain:
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://wanderverse.vercel.app</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

### "Clerk auth not working on deployed site"
**Fix:** Check that your Vercel domain is in Clerk's Allowed Origins. Also verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly in Vercel (not just locally).

---

## 📝 Summary Checklist

- [ ] Push code to GitHub
- [ ] Create Vercel project, deploy frontend
- [ ] Create Render web service, deploy backend
- [ ] Create Neon PostgreSQL database, run migrations
- [ ] Create Upstash Redis database
- [ ] Set up Clerk application (keys, URLs, webhooks)
- [ ] Get Mapbox access token
- [ ] Get OpenAI API key
- [ ] Set up S3/R2 bucket for photos
- [ ] (Optional) Set up Stripe for payments
- [ ] Test everything end-to-end
- [ ] Share your URL! 🎉

---

*This guide lets you deploy Wanderverse to production without installing anything on your local machine. Everything is done through web dashboards and GitHub.*
