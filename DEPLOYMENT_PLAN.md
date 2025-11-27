# Deployment and Optimization Plan

This document outlines the plan to deploy your YouTube Summarizer application using Docker and CI/CD, and how to optimize it for 100-1000 users using Redis caching.

## 1. Docker Configuration

To containerize your application, you will need to create the following files in your project root:

### `Dockerfile`
This file defines how your application is built and run. Use a multi-stage build to keep the image size small.

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
```

### `.dockerignore`
Exclude unnecessary files from the Docker build context.

```
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git
```

### `docker-compose.yml`
This file defines your services: the Next.js app (`web`) and the Redis cache (`redis`).

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - redis

  redis:
    image: "redis:alpine"
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## 2. Caching Strategy (Cost Optimization)

To handle 100-1000 users without exploding your Groq API usage, you **must** implement caching.

1.  **Install Redis Client**: `npm install ioredis`
2.  **Create Redis Client**: Create `lib/redis.ts` to initialize the connection.
3.  **Update API Route**: Modify `app/api/summarize/route.ts` to:
    -   Check Redis for a cached summary using the video ID as the key.
    -   If found, return it immediately (saving an API call).
    -   If not found, generate the summary with Groq, then save it to Redis with an expiration (e.g., 7 days).

## 3. CI/CD Pipeline (GitHub Actions)

To automate deployment, create `.github/workflows/deploy.yml`. This workflow will build your Docker image and push it to the GitHub Container Registry (GHCR) whenever you push to the `main` branch.

```yaml
name: Deploy to GHCR

on:
  push:
    branches: [ "main" ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to the Container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

## 4. Hosting & Domain Setup

For a cost-effective solution (~$5/mo), use a VPS like **Hetzner Cloud** (CPX11) or **DigitalOcean** (Basic Droplet).

### Steps to Deploy on VPS:

1.  **Provision Server**: Create a VPS with Ubuntu and Docker pre-installed.
2.  **Clone/Copy Files**: Copy your `docker-compose.yml` and `.env` file to the server.
3.  **Set Environment Variables**: In `.env`, set `GROQ_API_KEY` and `REDIS_URL=redis://redis:6379`.
4.  **Run Application**:
    ```bash
    docker-compose up -d
    ```
5.  **Configure Domain (Nginx)**:
    -   Install Nginx: `sudo apt install nginx`
    -   Create a config file in `/etc/nginx/sites-available/myapp` that proxies port 80 to port 3000.
    -   Enable SSL with Certbot: `sudo certbot --nginx -d your-domain.com`

This setup gives you a robust, scalable, and cost-effective deployment with automated builds and caching.
