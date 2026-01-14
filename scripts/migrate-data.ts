/**
 * Data Migration Script
 *
 * Migrates data from the old SQLite Workout-Log database to the new PostgreSQL database.
 *
 * Usage:
 *   1. Ensure DATABASE_URL is set in .env.local
 *   2. Ensure the schema has been pushed: pnpm db:push
 *   3. Run: npx tsx scripts/migrate-data.ts
 *
 * Note: This script requires better-sqlite3 to be installed:
 *   pnpm add -D better-sqlite3 @types/better-sqlite3
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SQLITE_PATH = path.join(__dirname, "../../Workout-Log/instance/workout.db");

// ID mapping from old SQLite integer IDs to new PostgreSQL UUIDs
const idMaps = {
  dayTemplates: new Map<number, string>(),
  blocks: new Map<number, string>(),
  blockWeeks: new Map<number, string>(),
  blockWeekExercises: new Map<number, string>(),
  users: new Map<number, string>(),
  workoutLogs: new Map<number, string>(),
  exerciseLogs: new Map<number, string>(),
};

async function main() {
  console.log("Starting data migration...\n");

  // Connect to PostgreSQL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not found in environment variables");
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  // Connect to SQLite
  console.log(`Opening SQLite database: ${SQLITE_PATH}`);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  try {
    // Migrate in order of dependencies
    await migrateDayTemplates(db, sqlite);
    await migrateBlocks(db, sqlite);
    await migrateDayTemplateBlocks(db, sqlite);
    await migrateBlockWeeks(db, sqlite);
    await migrateBlockWeekExercises(db, sqlite);
    await migrateWorkoutLogs(db, sqlite);
    await migrateExerciseLogs(db, sqlite);
    await migrateBlockNoteLogs(db, sqlite);
    await migrateExerciseSnapshots(db, sqlite);

    console.log("\n✅ Migration completed successfully!");
    console.log("\nSummary:");
    console.log(`  - Day Templates: ${idMaps.dayTemplates.size}`);
    console.log(`  - Blocks: ${idMaps.blocks.size}`);
    console.log(`  - Block Weeks: ${idMaps.blockWeeks.size}`);
    console.log(`  - Block Week Exercises: ${idMaps.blockWeekExercises.size}`);
    console.log(`  - Workout Logs: ${idMaps.workoutLogs.size}`);
    console.log(`  - Exercise Logs: ${idMaps.exerciseLogs.size}`);
  } finally {
    sqlite.close();
  }
}

async function migrateDayTemplates(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating day templates...");

  const rows = sqlite.prepare(`
    SELECT id, day_number, name, description, version, last_modified
    FROM day_template
  `).all() as Array<{
    id: number;
    day_number: number;
    name: string;
    description: string | null;
    version: number;
    last_modified: string | null;
  }>;

  for (const row of rows) {
    const result = await db
      .insert(schema.dayTemplates)
      .values({
        dayNumber: row.day_number,
        name: row.name,
        description: row.description,
        version: row.version || 1,
        lastModified: row.last_modified ? new Date(row.last_modified) : new Date(),
      })
      .returning({ id: schema.dayTemplates.id });

    idMaps.dayTemplates.set(row.id, result[0].id);
  }

  console.log(`  ✓ Migrated ${rows.length} day templates`);
}

async function migrateBlocks(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating blocks...");

  const rows = sqlite.prepare(`
    SELECT id, name, description, category, version, created_at, last_modified
    FROM block
  `).all() as Array<{
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    version: number;
    created_at: string | null;
    last_modified: string | null;
  }>;

  for (const row of rows) {
    const result = await db
      .insert(schema.blocks)
      .values({
        name: row.name,
        description: row.description,
        category: row.category,
        version: row.version || 1,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        lastModified: row.last_modified ? new Date(row.last_modified) : new Date(),
      })
      .returning({ id: schema.blocks.id });

    idMaps.blocks.set(row.id, result[0].id);
  }

  console.log(`  ✓ Migrated ${rows.length} blocks`);
}

async function migrateDayTemplateBlocks(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating day template blocks...");

  const rows = sqlite.prepare(`
    SELECT id, day_template_id, block_id, "order"
    FROM day_template_block
  `).all() as Array<{
    id: number;
    day_template_id: number;
    block_id: number;
    order: number;
  }>;

  let migrated = 0;
  for (const row of rows) {
    const dayTemplateId = idMaps.dayTemplates.get(row.day_template_id);
    const blockId = idMaps.blocks.get(row.block_id);

    if (!dayTemplateId || !blockId) {
      console.warn(`  ⚠ Skipping day template block ${row.id}: missing reference`);
      continue;
    }

    await db.insert(schema.dayTemplateBlocks).values({
      dayTemplateId,
      blockId,
      order: row.order,
    });
    migrated++;
  }

  console.log(`  ✓ Migrated ${migrated} day template block assignments`);
}

async function migrateBlockWeeks(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating block weeks...");

  const rows = sqlite.prepare(`
    SELECT id, block_id, week_number, notes
    FROM block_week
  `).all() as Array<{
    id: number;
    block_id: number;
    week_number: number;
    notes: string | null;
  }>;

  for (const row of rows) {
    const blockId = idMaps.blocks.get(row.block_id);

    if (!blockId) {
      console.warn(`  ⚠ Skipping block week ${row.id}: missing block reference`);
      continue;
    }

    const result = await db
      .insert(schema.blockWeeks)
      .values({
        blockId,
        weekNumber: row.week_number,
        notes: row.notes,
      })
      .returning({ id: schema.blockWeeks.id });

    idMaps.blockWeeks.set(row.id, result[0].id);
  }

  console.log(`  ✓ Migrated ${idMaps.blockWeeks.size} block weeks`);
}

async function migrateBlockWeekExercises(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating block week exercises...");

  const rows = sqlite.prepare(`
    SELECT id, block_week_id, "order", name, sets, reps, tempo, rest, weight_guidance, notes, is_active
    FROM block_week_exercise
  `).all() as Array<{
    id: number;
    block_week_id: number;
    order: number;
    name: string;
    sets: number | null;
    reps: string | null;
    tempo: string | null;
    rest: string | null;
    weight_guidance: string | null;
    notes: string | null;
    is_active: number;
  }>;

  for (const row of rows) {
    const blockWeekId = idMaps.blockWeeks.get(row.block_week_id);

    if (!blockWeekId) {
      console.warn(`  ⚠ Skipping exercise ${row.id}: missing block week reference`);
      continue;
    }

    const result = await db
      .insert(schema.blockWeekExercises)
      .values({
        blockWeekId,
        order: row.order,
        name: row.name,
        sets: row.sets,
        reps: row.reps,
        tempo: row.tempo,
        rest: row.rest,
        weightGuidance: row.weight_guidance,
        notes: row.notes,
        isActive: row.is_active === 1,
      })
      .returning({ id: schema.blockWeekExercises.id });

    idMaps.blockWeekExercises.set(row.id, result[0].id);
  }

  console.log(`  ✓ Migrated ${idMaps.blockWeekExercises.size} exercises`);
}

async function migrateWorkoutLogs(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating workout logs...");

  // First, we need to get the user ID from PostgreSQL (Clerk user)
  // For now, we'll get the first user from the database
  const users = await db.select().from(schema.users).limit(1);

  if (users.length === 0) {
    console.log("  ⚠ No users found in PostgreSQL. Skipping workout logs.");
    console.log("    You must sign in first, then run this migration again.");
    return;
  }

  const userId = users[0].id;
  console.log(`  Using user ID: ${userId}`);

  const rows = sqlite.prepare(`
    SELECT id, date, day_template_id, completed
    FROM workout_log
  `).all() as Array<{
    id: number;
    date: string;
    day_template_id: number | null;
    completed: number;
  }>;

  for (const row of rows) {
    const dayTemplateId = row.day_template_id
      ? idMaps.dayTemplates.get(row.day_template_id)
      : null;

    const result = await db
      .insert(schema.workoutLogs)
      .values({
        userId,
        date: row.date,
        dayTemplateId,
        completed: row.completed === 1,
      })
      .returning({ id: schema.workoutLogs.id });

    idMaps.workoutLogs.set(row.id, result[0].id);
  }

  console.log(`  ✓ Migrated ${idMaps.workoutLogs.size} workout logs`);
}

async function migrateExerciseLogs(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating exercise logs...");

  // Note: The old system uses Exercise (from WorkoutBlock) not BlockWeekExercise
  // We need to map from the old exercise_id to the new BlockWeekExercise
  // This is complex because the old system had a different structure
  // For now, we'll migrate what we can and note discrepancies

  const rows = sqlite.prepare(`
    SELECT id, workout_log_id, exercise_id, set_number, reps, weight, notes
    FROM exercise_log
  `).all() as Array<{
    id: number;
    workout_log_id: number;
    exercise_id: number;
    set_number: number;
    reps: number | null;
    weight: number | null;
    notes: string | null;
  }>;

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const workoutLogId = idMaps.workoutLogs.get(row.workout_log_id);
    const exerciseId = idMaps.blockWeekExercises.get(row.exercise_id);

    if (!workoutLogId) {
      skipped++;
      continue;
    }

    if (!exerciseId) {
      // Try to find exercise in the new BlockWeekExercise table by looking at old Exercise table
      skipped++;
      continue;
    }

    const result = await db
      .insert(schema.exerciseLogs)
      .values({
        workoutLogId,
        exerciseId,
        setNumber: row.set_number,
        reps: row.reps,
        weight: row.weight,
        notes: row.notes,
      })
      .returning({ id: schema.exerciseLogs.id });

    idMaps.exerciseLogs.set(row.id, result[0].id);
    migrated++;
  }

  console.log(`  ✓ Migrated ${migrated} exercise logs (skipped ${skipped} with missing references)`);
}

async function migrateBlockNoteLogs(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating block note logs...");

  const rows = sqlite.prepare(`
    SELECT id, workout_log_id, block_id, notes
    FROM block_note_log
  `).all() as Array<{
    id: number;
    workout_log_id: number;
    block_id: number;
    notes: string | null;
  }>;

  let migrated = 0;
  for (const row of rows) {
    const workoutLogId = idMaps.workoutLogs.get(row.workout_log_id);
    const blockId = idMaps.blocks.get(row.block_id);

    if (!workoutLogId || !blockId || !row.notes) {
      continue;
    }

    await db.insert(schema.blockNoteLogs).values({
      workoutLogId,
      blockId,
      notes: row.notes,
    });
    migrated++;
  }

  console.log(`  ✓ Migrated ${migrated} block note logs`);
}

async function migrateExerciseSnapshots(db: ReturnType<typeof drizzle>, sqlite: Database.Database) {
  console.log("Migrating exercise snapshots...");

  const rows = sqlite.prepare(`
    SELECT id, exercise_log_id, exercise_id, name, sets, reps, tempo, rest, notes, created_at
    FROM exercise_snapshot
  `).all() as Array<{
    id: number;
    exercise_log_id: number;
    exercise_id: number;
    name: string;
    sets: number | null;
    reps: string | null;
    tempo: string | null;
    rest: string | null;
    notes: string | null;
    created_at: string | null;
  }>;

  let migrated = 0;
  for (const row of rows) {
    const exerciseLogId = idMaps.exerciseLogs.get(row.exercise_log_id);
    const exerciseId = idMaps.blockWeekExercises.get(row.exercise_id);

    if (!exerciseLogId || !exerciseId) {
      continue;
    }

    await db.insert(schema.exerciseSnapshots).values({
      exerciseLogId,
      exerciseId,
      name: row.name,
      sets: row.sets,
      reps: row.reps,
      tempo: row.tempo,
      rest: row.rest,
      notes: row.notes,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    });
    migrated++;
  }

  console.log(`  ✓ Migrated ${migrated} exercise snapshots`);
}

// Run the migration
main().catch(console.error);
