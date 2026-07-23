# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is a Next.js starter kit template for building web applications. It's designed to be forked using `fork.sh` and customized for specific applications. Supports two modes:

- **Full mode** (default): Login-based apps with auth, database, and email
- **Simple mode** (`--simple`): Lightweight apps/landing pages without auth infrastructure

## Tech Stack

### Full Mode
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Neon (PostgreSQL) with Drizzle ORM
- **Auth:** Clerk
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Email:** Resend
- **Analytics:** PostHog (optional)
- **Testing:** Vitest (unit), Playwright (E2E)
- **Deployment:** Docker on VPS

### Simple Mode
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Analytics:** PostHog (optional)
- **Testing:** Vitest
- **Deployment:** Docker on VPS

## Common Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking
pnpm test         # Run unit tests in watch mode
pnpm test:run     # Run unit tests once
pnpm test:e2e     # Run E2E tests (Playwright)
pnpm test:e2e:ui  # Run E2E tests with interactive UI
pnpm db:push      # Push schema changes in development only
pnpm db:generate  # Generate migrations
pnpm db:studio    # Open Drizzle Studio
```

## Forking a New Project

```bash
# Full app with auth, database, and email
./fork.sh my-app

# Simple app without auth/db/email (landing pages, etc.)
./fork.sh my-app --simple
```

Projects are created in `~/Code/apps/<project-name>`.

## Project Structure

### Root (Full Mode)
- `src/app/` - Next.js App Router pages and API routes
- `src/app/(auth)/` - Authentication pages (sign-in, sign-up)
- `src/app/(dashboard)/` - Protected dashboard pages
- `src/app/api/webhooks/clerk/` - Clerk webhook for user sync
- `src/components/ui/` - shadcn/ui components
- `src/components/providers/` - React context providers (PostHog, etc.)
- `src/db/` - Database schema and connection (Drizzle)
- `src/lib/` - Utility functions and email helpers
- `src/middleware.ts` - Clerk auth middleware
- `tests/` - Vitest unit tests
- `e2e/` - Playwright E2E tests (pages, fixtures, visual tests)

### Templates
- `templates/simple/` - Override files for simple mode (layout, page, package.json, env)

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
Required variables are documented in `.env.example`. Copy to `.env` for local development.

## Code Style

- Use TypeScript strict mode
- Prefer server components where possible
- Use `cn()` utility for conditional class names
- Follow existing patterns in the codebase

## Feedback System

Users can submit feedback with screenshots. Query and manage feedback items using the script at `scripts/query-feedback.ts`:

```bash
# List open feedback items
npx tsx scripts/query-feedback.ts

# Save screenshots to view them
npx tsx scripts/save-feedback-screenshots.ts

# Mark feedback items as fixed
npx tsx scripts/fix-feedback.ts <id1> [id2] [id3] ...
```

Feedback schema (`feedbackEntries` table):
- `id`, `userId`, `description`, `screenshot` (base64), `url`, `status` (open/fixed/wont_fix), `createdAt`

## Future Improvements

When finishing a task or set of tasks, check the **Future Improvements** section in `README.md` and ask the user if any of those items should be implemented next.

## Deployment

Use [`docs/deployment.md`](docs/deployment.md) as the single authoritative
production runbook.

- Merging or pushing to `main` triggers the GitHub Actions deployment.
- Do not build directly on the VPS during a normal release.
- Database migrations and account-specific installers are separate operations.
- The production Drizzle migration ledger is not currently baselined, so do
  not run `pnpm db:migrate` or `pnpm db:push` against production.
