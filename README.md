# App Starter

A minimal, production-ready Next.js starter kit with authentication, database, and email configured out of the box.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Neon (PostgreSQL) + Drizzle ORM
- **Auth:** Clerk
- **Styling:** Tailwind CSS + shadcn/ui
- **Email:** Resend
- **Testing:** Vitest

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd app-starter
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook secret (for user sync) |
| `RESEND_API_KEY` | Resend API key |

### 3. Set Up the Database

Run migrations to create the database schema:

```bash
pnpm db:push
```

### 4. Configure Clerk Webhook

In your Clerk dashboard, create a webhook endpoint pointing to:
```
https://your-domain.com/api/webhooks/clerk
```

Subscribe to the following events:
- `user.created`
- `user.updated`
- `user.deleted`

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema changes directly |
| `pnpm db:studio` | Open Drizzle Studio |

## Docker

Build and run with Docker:

```bash
docker build -t app-starter \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key \
  .

docker run -p 3000:3000 \
  -e DATABASE_URL=your_url \
  -e CLERK_SECRET_KEY=your_key \
  app-starter
```

Or use Docker Compose:

```bash
docker-compose up
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/        # Protected dashboard pages
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   └── ui/                 # shadcn/ui components
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Drizzle schema
├── lib/
│   ├── email.ts            # Email helpers
│   └── utils.ts            # Utility functions
└── middleware.ts           # Clerk auth middleware
```

## Future Improvements

The following features and improvements are planned for future development:

### 1. Health Document Uploads (DEXA / VO2 Max)
Add a section for uploading and viewing PDF documents of health assessments:
- DEXA scan results
- VO2 max test results
- Simple upload and view functionality
- PDF rendered inline on the site for easy viewing
- No charts or data extraction needed initially

### 2. Injury Log / Journal
A journal-style logging system for tracking injuries:
- Natural language entries for tracking current injuries
- Chronological view of past entries
- Future enhancements:
  - AI-powered summaries of injury progression
  - Ability to upload supporting documents (MRIs, X-rays, etc.)

## License

MIT
