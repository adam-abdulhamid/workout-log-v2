# Production Deployment Runbook

This is the authoritative deployment guide for Workout Log.

## How Deployment Works

The application deploys automatically when a commit reaches `main`.

1. GitHub Actions runs the **Build and Deploy** workflow in
   `.github/workflows/deploy.yml`.
2. The workflow builds a Docker image and publishes two GHCR tags:
   `latest` and the short Git commit SHA.
3. The workflow connects to the VPS over SSH.
4. The VPS pulls `ghcr.io/adam-abdulhamid/workout-log-v2:latest` and recreates
   the Compose service behind Traefik.

The workflow does **not** run database migrations or account-specific data
installers. Perform those operations separately, before merging application
code that depends on them.

Production URL: <https://workout.adamabdulhamid.com>

GitHub Actions:
<https://github.com/adam-abdulhamid/workout-log-v2/actions/workflows/deploy.yml>

## Normal Code-Only Release

Use this flow when the change does not modify `src/db/schema.ts`, add files
under `src/db/migrations/`, or require a data-update script.

### 1. Confirm the release contents

```bash
git status --short --branch
git diff --stat origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Do not commit unrelated local files such as `.codex/`, screenshots, local
environment files, or another worktree's changes.

### 2. Run release checks

```bash
pnpm type-check
pnpm test:run
pnpm build
```

Also run `pnpm lint`, but be aware that lint is not currently a clean release
gate: the repository has pre-existing lint errors and may scan nested
`.claude/worktrees`. Review new lint errors introduced by the release rather
than assuming the existing repository-wide command will pass.

Run Playwright when the change affects an important user flow and the required
test credentials are configured:

```bash
pnpm test:e2e
```

### 3. Merge the PR

Merge the PR into `main` in GitHub. A direct push to `main` also triggers the
workflow, but merging through the PR is preferred because it preserves review
and status history.

Do not manually SSH to the VPS for a normal release.

### 4. Watch the workflow

Open the **Build and Deploy** workflow and confirm both of these steps pass:

- **Build and push Docker image**
- **Deploy to VPS**

If GitHub CLI authentication is configured, the equivalent commands are:

```bash
gh run list --workflow deploy.yml --branch main --limit 5
gh run watch
```

If `gh` returns `401 Unauthorized`, run `gh auth login` or use the GitHub
Actions web page.

### 5. Smoke-test production

```bash
curl -fsS https://workout.adamabdulhamid.com/ >/dev/null
```

Then sign in through a browser and test the changed authenticated page.
Protected Clerk routes can return a signed-out 404 to `curl`; that response
does not prove the route is missing.

For a VPS-level check, connect with the configured VPS account and run:

```bash
cd ~/apps/workout-log-v2
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

## Releases With Database Schema Changes

### Current production migration state

As verified on July 23, 2026:

- The production database contains the legacy application schema.
- `drizzle.__drizzle_migrations` exists but has no baseline migration rows.
- `health_documents` already existed outside the migration ledger.
- `stretch_time_entries` and `idx_stretch_time_user_date` were applied
  manually and are live.

Because the ledger is not baselined, **do not run `pnpm db:migrate` against
production**. It would start with `0000_bent_ogun.sql` and attempt to recreate
existing tables.

Until the migration ledger is deliberately baselined, use this process:

1. Review the exact schema diff and new migration:

   ```bash
   git diff origin/main...HEAD -- src/db/schema.ts src/db/migrations
   ```

2. Make new production migrations additive and safe to rerun where practical.
   Prefer `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and
   guarded constraint creation.
3. Confirm `.env` points to the intended production Neon database. Never print
   the full `DATABASE_URL`.
4. Before merging the PR, execute only the new reviewed migration SQL in the
   Neon SQL Editor. Do not execute older migration files again.
5. Verify the new table, column, index, or constraint in Neon.
6. Merge the PR and follow the normal deployment verification steps.

Do not use `pnpm db:push` against production. It is intended for development
schema iteration and can apply changes beyond the reviewed migration.

Database changes should be backward-compatible with the currently running
image because they are applied before the new image deploys.

## Account-Specific Data Updates

The workout overhaul is separate from schema and image deployment. Run it only
when intentionally installing or refreshing that program for one account.

1. Confirm `.env` uses the production database.
2. Identify the exact account email. Do not guess if multiple real accounts
   could match.
3. Preview the operation:

   ```bash
   npx tsx scripts/apply-workout-overhaul.ts \
     --email you@example.com \
     --dry-run
   ```

4. Apply it:

   ```bash
   npx tsx scripts/apply-workout-overhaul.ts \
     --email you@example.com
   ```

The installer:

- targets one existing account by exact email;
- creates or updates 15 program blocks;
- replaces that account's seven day-template assignments;
- writes identical exercise prescriptions for Weeks 1–6;
- is safe to rerun.

The seeded E2E account must not receive production account data.

## Failure Behavior and Recovery

### Image build fails

If **Build and push Docker image** fails, the VPS deployment step is skipped
and the previous production image keeps running.

Inspect the failed step, fix the cause, push a new commit to `main`, and watch
the new workflow. Do not repeatedly rerun a deterministic build failure.

The Dockerfile intentionally pins pnpm 10.28.2. Do not change it back to
`pnpm@latest`; pnpm 11 caused frozen Docker installs to fail with
`ERR_PNPM_IGNORED_BUILDS`.

### VPS deployment fails

If the image builds but **Deploy to VPS** fails, the new image may exist in
GHCR while the old container remains live. Inspect the workflow SSH output,
then check:

```bash
cd ~/apps/workout-log-v2
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 app
docker network inspect traefik-public
```

### Roll back application code

Prefer reverting the bad commit in GitHub and merging the revert into `main`.
That creates a normal, auditable deployment of the previous code.

Every build is also tagged with its short Git SHA in GHCR. An emergency manual
rollback can pin that SHA in the VPS `docker-compose.prod.yml`, pull it, and
recreate the service. The next successful workflow will rewrite Compose to use
`latest` again.

Application rollback does not reverse database changes. Keep schema changes
backward-compatible and handle any destructive database rollback separately.

## Required Deployment Configuration

GitHub Actions requires these repository secrets:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `VPS_HOST`
- `VPS_USER`
- `SSH_PRIVATE_KEY`
- `GHCR_USER`
- `GHCR_TOKEN`

The VPS requires:

- `~/apps/workout-log-v2/.env`;
- the external Docker network `traefik-public`;
- Traefik configured for
  `workout.adamabdulhamid.com`;
- permission to pull the private GHCR image.

Never commit `.env`, database URLs, Clerk secret keys, GHCR tokens, or SSH
private keys.
