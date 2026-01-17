# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is a Next.js starter kit template for building login-based web applications. It's designed to be forked and customized for specific applications.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Neon (PostgreSQL) with Drizzle ORM
- **Auth:** Clerk
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Email:** Resend
- **Analytics:** PostHog (optional)
- **Testing:** Vitest
- **Deployment:** Docker on VPS

## Common Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
pnpm test         # Run tests in watch mode
pnpm test:run     # Run tests once
pnpm db:push      # Push schema changes to database
pnpm db:generate  # Generate migrations
pnpm db:studio    # Open Drizzle Studio
```

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/app/(auth)/` - Authentication pages (sign-in, sign-up)
- `src/app/(dashboard)/` - Protected dashboard pages
- `src/app/api/webhooks/clerk/` - Clerk webhook for user sync
- `src/components/ui/` - shadcn/ui components
- `src/components/providers/` - React context providers (PostHog, etc.)
- `src/db/` - Database schema and connection (Drizzle)
- `src/lib/` - Utility functions and email helpers
- `src/middleware.ts` - Clerk auth middleware
- `tests/` - Vitest tests

## Key Patterns

### Authentication
- Clerk handles all auth UI and logic
- `middleware.ts` protects routes - public routes are defined in `isPublicRoute`
- Users are synced to the database via webhook at `/api/webhooks/clerk`

### Database
- Schema defined in `src/db/schema.ts`
- Use `db` from `src/db/index.ts` for queries
- Drizzle ORM with Neon serverless driver

### Analytics
- PostHog is integrated for product analytics (optional - disabled if env vars not set)
- Provider configured in `src/components/providers/posthog-provider.tsx`
- Automatic page view tracking for SPA navigation
- Free tier: 1M events/month at [posthog.com](https://posthog.com)
- To enable: add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to your environment

### Adding shadcn/ui Components
```bash
pnpm dlx shadcn@latest add <component-name>
```

### Environment Variables
Required variables are documented in `.env.example`. Copy to `.env.local` for local development.

## Code Style

- Use TypeScript strict mode
- Prefer server components where possible
- Use `cn()` utility for conditional class names
- Follow existing patterns in the codebase

## Future Improvements

When finishing a task or set of tasks, check the **Future Improvements** section in `README.md` and ask the user if any of those items should be implemented next. Current planned improvements include:

1. **Faster Deployment Pipeline** - Optimize Docker builds and consider CI/CD with image registry
2. **Health Document Uploads** - PDF upload/view for DEXA scans, VO2 max tests
3. **Injury Log / Journal** - Natural language injury tracking with chronological view

## Deployment (VPS with Traefik)

### One-time Traefik Setup

On your VPS, create `~/traefik/docker-compose.yml`:
```yaml
services:
  traefik:
    image: traefik:v2.11
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - traefik-public

networks:
  traefik-public:
    name: traefik-public
```

Create `~/traefik/traefik.yml`:
```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-public

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /acme.json
      httpChallenge:
        entryPoint: web
```

Create empty acme.json with correct permissions:
```bash
touch ~/traefik/acme.json && chmod 600 ~/traefik/acme.json
```

Start Traefik:
```bash
cd ~/traefik && docker compose up -d
```

### Deploying an App

1. Update `docker-compose.yml`: replace `YOUR_APP_NAME` and `your.domain.com`
2. Create `.env` on VPS with production environment variables
3. Clone/copy repo to VPS (e.g., `~/apps/your-app`)
4. Build and run:
```bash
cd ~/apps/your-app && docker compose up -d --build
```

### Verification
```bash
docker ps                                    # Check containers running
docker logs <container-name>                 # Check app logs
docker network inspect traefik-public        # Verify network connectivity
```
