import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  blocks,
  blockWeekExercises,
  blockWeeks,
  dayTemplateBlocks,
  dayTemplates,
  users,
} from "../src/db/schema";

interface ProgramExercise {
  name: string;
  sets?: number | null;
  reps?: string | null;
  rest?: string | null;
  notes?: string | null;
}

interface ProgramBlock {
  name: string;
  category: string;
  description: string;
  exercises: ProgramExercise[];
}

const block = (
  name: string,
  category: string,
  description: string,
  exercises: ProgramExercise[]
): ProgramBlock => ({ name, category, description, exercises });

const PROGRAM_BLOCKS: ProgramBlock[] = [
  block("Hip-Focused Warmup", "mobility", "Three minutes of cardio followed by two rounds of preparation.", [
    { name: "Cardio", sets: 1, reps: "3 minutes", notes: "No bike" },
    { name: "T-Spine Rolling + T-Spine Pulses", sets: 2, reps: "30 sec + 6 pulses" },
    { name: "90/90 Hip Switches with Glute Stretch", sets: 2, reps: "4/side" },
    { name: "Side-Plank Internal-Rotation Holds", sets: 2, reps: "15 sec/side" },
    { name: "Band Routine", sets: 2, reps: "1 pass" },
    { name: "Sumo Goblet Kettlebell Squats", sets: 2, reps: "8" },
  ]),
  block("Hip PT", "pt", "Shared hip-focused PT circuit for all lifting days.", [
    { name: "Hip Airplanes", sets: 2, reps: "5/side" },
    { name: "Kettlebell Hip Openers", sets: 2, reps: "6/side" },
    { name: "Banded Joint Mobilization Stretch", sets: 2, reps: "30 sec/side" },
  ]),
  block("Leg Strength Superset A", "strength", "Three-set hinge and long-step lunge superset.", [
    { name: "Single-Leg Kettlebell RDL", sets: 3, reps: "8/side", notes: "A1" },
    { name: "Long-Step Lunges", sets: 3, reps: "10/side", rest: "Rest after pair", notes: "A2" },
  ]),
  block("Leg Strength Superset B", "strength", "Two-set unilateral and cyclist-squat superset.", [
    { name: "Bulgarian Split Squats", sets: 2, reps: "8/side", notes: "B1" },
    { name: "Cyclist Goblet Squats", sets: 2, reps: "10–12", rest: "Rest after pair", notes: "B2" },
  ]),
  block("Calf + Side-Plank Superset", "accessory", "Three-round lower-leg and lateral-core superset.", [
    { name: "Seated Calf Raises", sets: 3, reps: "8–12", notes: "C1" },
    { name: "Side Planks", sets: 3, reps: "30 sec/side", rest: "Rest after pair", notes: "C2" },
  ]),
  block("Core Circuit", "strength", "Shared three-round core circuit for all lifting days.", [
    { name: "Dragon Flags or V-Ups", sets: 3, reps: "8–10", notes: "Choose one variation" },
    { name: "Medicine Ball Routine", sets: 3, reps: "1 pass" },
    { name: "Hanging Knees-Up Hold", sets: 3, reps: "Max duration", rest: "Rest after circuit" },
  ]),
  block("Upper-Body Warmup", "mobility", "Three minutes of cardio followed by two rounds of upper-body preparation.", [
    { name: "Cardio", sets: 1, reps: "3 minutes", notes: "No bike" },
    { name: "T-Spine Rolling + T-Spine Pulses", sets: 2, reps: "30 sec + 6 pulses" },
    { name: "Dead Hang", sets: 2, reps: "30 sec" },
    { name: "Scapular Push-Ups", sets: 2, reps: "8" },
    { name: "Shoulder-Tap Plank", sets: 2, reps: "6/side" },
    { name: "Banded or Cable Face Pulls", sets: 2, reps: "10" },
  ]),
  block("Push/Pull Superset A", "strength", "Shared four-set weighted-pull-up and push-up superset.", [
    { name: "Weighted Pull-Ups", sets: 4, reps: "8", notes: "A1" },
    { name: "Push-Ups", sets: 4, reps: "20", rest: "Rest after pair", notes: "A2" },
  ]),
  block("Push/Pull A Superset B", "strength", "Three-round vertical-pull and lateral-raise superset.", [
    { name: "Lat Pulldown", sets: 3, reps: "8–10", notes: "B1" },
    { name: "Cable or Dumbbell Lateral Raises", sets: 3, reps: "10", rest: "Rest after pair", notes: "B2" },
  ]),
  block("Push/Pull A Superset C", "strength", "Three-round dumbbell press and supported-row superset.", [
    { name: "Dumbbell Bench Press", sets: 3, reps: "6–10", notes: "C1" },
    { name: "Bench-Stabilized Row", sets: 3, reps: "8–12/side", rest: "Rest after pair", notes: "C2" },
  ]),
  block("Push/Pull B Superset B", "strength", "Three-round overhead-press and gorilla-row superset.", [
    { name: "Single-Arm Dumbbell Overhead Press", sets: 3, reps: "8/side", notes: "B1" },
    { name: "Kettlebell Gorilla Row", sets: 3, reps: "20", rest: "Rest after pair", notes: "B2" },
  ]),
  block("Push/Pull B Superset C", "strength", "Three-round horizontal-row and anti-rotation superset.", [
    { name: "Horizontal Cable Rows", sets: 3, reps: "8–10", notes: "C1" },
    { name: "Pallof Press", sets: 3, reps: "8–10/side", rest: "Rest after pair", notes: "C2" },
  ]),
  block("Recovery PT", "recovery", "Shared recovery-day hip mobility and activation.", [
    { name: "90/90 Hip Switches + Glute Stretch" },
    { name: "Hip Internal Rotation" },
    { name: "Side-Plank Glute Internal-Rotation Activations" },
  ]),
  block("Cardio", "cardio", "Dedicated weekly cardio session.", [
    { name: "Cardio", sets: 1, reps: "60 minutes" },
  ]),
  block("Daily Stretching", "stretching", "Daily stretch block with per-stretch stopwatch tracking.", [
    { name: "Couch Stretch" },
    { name: "90/90 Glute Stretch with Slow Transitions" },
    { name: "Back Rolling / T-Spine Stretching" },
    { name: "World’s Greatest Stretch" },
    { name: "Reverse Plank" },
  ]),
];

const DAYS = [
  {
    dayNumber: 1,
    name: "Leg Day",
    description: "Hip-focused preparation, lower-body supersets, and core.",
    blocks: ["Hip-Focused Warmup", "Hip PT", "Leg Strength Superset A", "Leg Strength Superset B", "Calf + Side-Plank Superset", "Core Circuit", "Daily Stretching"],
  },
  { dayNumber: 2, name: "Recovery + PT", description: "Recovery PT and daily stretching.", blocks: ["Recovery PT", "Daily Stretching"] },
  { dayNumber: 3, name: "Recovery + PT", description: "Recovery PT and daily stretching.", blocks: ["Recovery PT", "Daily Stretching"] },
  {
    dayNumber: 4,
    name: "Push / Pull + Core A",
    description: "Push/pull supersets, shared hip PT, and core.",
    blocks: ["Upper-Body Warmup", "Hip PT", "Push/Pull Superset A", "Push/Pull A Superset B", "Push/Pull A Superset C", "Core Circuit", "Daily Stretching"],
  },
  { dayNumber: 5, name: "Recovery + PT", description: "Recovery PT and daily stretching.", blocks: ["Recovery PT", "Daily Stretching"] },
  {
    dayNumber: 6,
    name: "Push / Pull + Core B",
    description: "Complementary push/pull supersets, shared hip PT, and core.",
    blocks: ["Upper-Body Warmup", "Hip PT", "Push/Pull Superset A", "Push/Pull B Superset B", "Push/Pull B Superset C", "Core Circuit", "Daily Stretching"],
  },
  { dayNumber: 7, name: "Dedicated Cardio", description: "Cardio and daily stretching.", blocks: ["Cardio", "Daily Stretching"] },
];

function argument(name: string): string | null {
  const exact = process.argv.find((value) => value.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function exerciseSignature(exercise: {
  order: number;
  name: string;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  notes: string | null;
}) {
  return JSON.stringify([
    exercise.order,
    exercise.name,
    exercise.sets,
    exercise.reps,
    exercise.rest,
    exercise.notes,
  ]);
}

async function main() {
  const email = argument("--email");
  const dryRun = process.argv.includes("--dry-run");
  if (!email) {
    throw new Error("Usage: npx tsx scripts/apply-workout-overhaul.ts --email you@example.com [--dry-run]");
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new Error(`No user found for ${email}`);

  console.log(`${dryRun ? "Would apply" : "Applying"} workout overhaul to ${email}`);
  console.log(`${PROGRAM_BLOCKS.length} blocks, 7 day templates, identical Weeks 1–6`);
  if (dryRun) return;

  const blockIds = new Map<string, string>();
  for (const definition of PROGRAM_BLOCKS) {
    let existing = await db.query.blocks.findFirst({
      where: and(eq(blocks.userId, user.id), eq(blocks.name, definition.name)),
    });

    if (!existing) {
      [existing] = await db
        .insert(blocks)
        .values({
          userId: user.id,
          name: definition.name,
          category: definition.category,
          description: definition.description,
        })
        .returning();
    } else {
      [existing] = await db
        .update(blocks)
        .set({
          category: definition.category,
          description: definition.description,
          version: existing.version + 1,
          lastModified: new Date(),
        })
        .where(eq(blocks.id, existing.id))
        .returning();
    }
    blockIds.set(definition.name, existing.id);

    for (let weekNumber = 1; weekNumber <= 6; weekNumber++) {
      let week = await db.query.blockWeeks.findFirst({
        where: and(eq(blockWeeks.blockId, existing.id), eq(blockWeeks.weekNumber, weekNumber)),
      });
      if (!week) {
        [week] = await db
          .insert(blockWeeks)
          .values({ blockId: existing.id, weekNumber, notes: "Same prescription for Weeks 1–6" })
          .returning();
      } else {
        await db
          .update(blockWeeks)
          .set({ notes: "Same prescription for Weeks 1–6" })
          .where(eq(blockWeeks.id, week.id));
      }

      const activeExercises = await db.query.blockWeekExercises.findMany({
        where: and(
          eq(blockWeekExercises.blockWeekId, week.id),
          eq(blockWeekExercises.isActive, true)
        ),
      });
      const desired = definition.exercises.map((exercise, index) => ({
        order: index + 1,
        name: exercise.name,
        sets: exercise.sets ?? null,
        reps: exercise.reps ?? null,
        rest: exercise.rest ?? null,
        notes: exercise.notes ?? null,
      }));
      const unchanged =
        activeExercises.length === desired.length &&
        [...activeExercises]
          .sort((a, b) => a.order - b.order)
          .every((exercise, index) => exerciseSignature(exercise) === exerciseSignature(desired[index]));

      if (!unchanged) {
        await db
          .update(blockWeekExercises)
          .set({ isActive: false })
          .where(eq(blockWeekExercises.blockWeekId, week.id));
        if (desired.length) {
          await db.insert(blockWeekExercises).values(
            desired.map((exercise) => ({
              blockWeekId: week.id,
              ...exercise,
              isActive: true,
            }))
          );
        }
      }
    }
  }

  for (const definition of DAYS) {
    let day = await db.query.dayTemplates.findFirst({
      where: and(
        eq(dayTemplates.userId, user.id),
        eq(dayTemplates.dayNumber, definition.dayNumber)
      ),
    });
    if (!day) {
      [day] = await db
        .insert(dayTemplates)
        .values({
          userId: user.id,
          dayNumber: definition.dayNumber,
          name: definition.name,
          description: definition.description,
        })
        .returning();
    } else {
      [day] = await db
        .update(dayTemplates)
        .set({
          name: definition.name,
          description: definition.description,
          version: day.version + 1,
          lastModified: new Date(),
        })
        .where(eq(dayTemplates.id, day.id))
        .returning();
    }

    await db.delete(dayTemplateBlocks).where(eq(dayTemplateBlocks.dayTemplateId, day.id));
    await db.insert(dayTemplateBlocks).values(
      definition.blocks.map((name, index) => {
        const blockId = blockIds.get(name);
        if (!blockId) throw new Error(`Missing block ${name}`);
        return { dayTemplateId: day.id, blockId, order: index + 1 };
      })
    );
  }

  console.log("Workout program updated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
