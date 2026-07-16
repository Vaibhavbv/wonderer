# Wanderverse API
FROM node:20-alpine

WORKDIR /app

# Install dependencies. Dev deps are required at image-build time: `nest
# build` needs @nestjs/cli and `npx prisma generate` needs prisma.
COPY package*.json ./
RUN npm ci --include=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Health check. URI versioning (defaultVersion: '1') applies to the health
# controller too, so the route is /v1/health — /health 404s.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/v1/health || exit 1

# Start
CMD ["node", "dist/main.js"]
