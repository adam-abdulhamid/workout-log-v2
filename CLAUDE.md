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
