import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  dayTemplates,
  dayTemplateBlocks,
  blocks,
  blockWeeks,
  blockWeekExercises,
  workoutLogs,
  exerciseLogs,
  blockNoteLogs,
  users,
} from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { getWorkoutForDateString } from "@/lib/workout-cycle";
import { ensureUserDayTemplates, getUserDayTemplate } from "@/lib/user";
import type { WorkoutData, WorkoutBlock, WorkoutExercise } from "@/types/workout";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date: dateStr } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Get user from database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Ensure day templates exist for this user
  await ensureUserDayTemplates(user.id);

  // Get workout info for this date
  const workoutInfo = getWorkoutForDateString(dateStr);

  // Get day template (user-scoped)
  const dayTemplate = await getUserDayTemplate(user.id, workoutInfo.dayNumber);

  if (!dayTemplate) {
    return NextResponse.json(
      { error: "Day template not found" },
      { status: 404 }
    );
  }

  // Get existing workout log
  const workoutLog = await db.query.workoutLogs.findFirst({
    where: and(
      eq(workoutLogs.userId, user.id),
      eq(workoutLogs.date, dateStr)
    ),
  });

  // Get existing exercise logs
  const existingLogs = workoutLog
    ? await db.query.exerciseLogs.findMany({
        where: eq(exerciseLogs.workoutLogId, workoutLog.id),
      })
    : [];

  const exerciseLogsMap = new Map<string, { reps: number | null; weight: number | null }>();
  for (const log of existingLogs) {
    const key = `${log.exerciseId}-${log.setNumber}`;
    exerciseLogsMap.set(key, { reps: log.reps, weight: log.weight });
  }

  // Get existing block notes
  const existingBlockNotes = workoutLog
    ? await db.query.blockNoteLogs.findMany({
        where: eq(blockNoteLogs.workoutLogId, workoutLog.id),
      })
    : [];

  const blockNotesMap = new Map(
    existingBlockNotes.map((bn) => [bn.blockId, bn.notes])
  );

  // Get blocks assigned to this day
  const dayBlocks = await db
    .select({
      block: blocks,
      order: dayTemplateBlocks.order,
    })
    .from(dayTemplateBlocks)
    .innerJoin(blocks, eq(dayTemplateBlocks.blockId, blocks.id))
    .where(eq(dayTemplateBlocks.dayTemplateId, dayTemplate.id))
    .orderBy(asc(dayTemplateBlocks.order));

  // Build workout blocks data - BATCH queries to avoid N+1
  const blockIds = dayBlocks.map((db) => db.block.id);

  // Batch load all blockWeeks for these blocks at the prescription week
  const allBlockWeeks =
    blockIds.length > 0
      ? await db.query.blockWeeks.findMany({
          where: and(
            inArray(blockWeeks.blockId, blockIds),
            eq(blockWeeks.weekNumber, workoutInfo.prescriptionWeek)
          ),
        })
      : [];
  const blockWeeksMap = new Map(allBlockWeeks.map((bw) => [bw.blockId, bw]));

  // Batch load all exercises for these blockWeeks
  const blockWeekIds = allBlockWeeks.map((bw) => bw.id);
  const allExercises =
    blockWeekIds.length > 0
      ? await db.query.blockWeekExercises.findMany({
          where: and(
            inArray(blockWeekExercises.blockWeekId, blockWeekIds),
            eq(blockWeekExercises.isActive, true)
          ),
          orderBy: asc(blockWeekExercises.order),
        })
      : [];

  // Group exercises by blockWeekId
  const exercisesByBlockWeek = new Map<string, typeof allExercises>();
  for (const ex of allExercises) {
    const existing = exercisesByBlockWeek.get(ex.blockWeekId) || [];
    existing.push(ex);
    exercisesByBlockWeek.set(ex.blockWeekId, existing);
  }

  // Build workout blocks
  const workoutBlocks: WorkoutBlock[] = dayBlocks.map(({ block }) => {
    const blockWeek = blockWeeksMap.get(block.id);
    const weekExercises = blockWeek
      ? exercisesByBlockWeek.get(blockWeek.id) || []
      : [];

    const exercises: WorkoutExercise[] = weekExercises.map((ex) => ({
      id: ex.id,
      order: ex.order,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      rest: ex.rest,
      weightGuidance: ex.weightGuidance,
      notes: ex.notes,
    }));

    return {
      id: block.id,
      name: `${block.name} (Week ${workoutInfo.prescriptionWeek})`,
      category: block.category,
      exercises,
      existingNote: blockNotesMap.get(block.id) || null,
    };
  });

  const workoutData: WorkoutData = {
    date: dateStr,
    dayName: dayTemplate.name,
    dayNumber: workoutInfo.dayNumber,
    prescriptionWeek: workoutInfo.prescriptionWeek,
    isDeload: workoutInfo.isDeload,
    isCompleted: workoutLog?.completed || false,
    blocks: workoutBlocks,
  };

  return NextResponse.json(workoutData);
}
