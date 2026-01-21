import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  dayTemplates,
  workoutLogs,
  exerciseLogs,
  blockNoteLogs,
  exerciseSnapshots,
  blockWeekExercises,
  users,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getWorkoutForDateString } from "@/lib/workout-cycle";
import type { WorkoutLogPayload } from "@/types/workout";

export async function POST(
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

  // Parse request body
  const data: WorkoutLogPayload = await request.json();

  // Get workout info for this date
  const workoutInfo = getWorkoutForDateString(dateStr);

  // Get day template
  const dayTemplate = await db.query.dayTemplates.findFirst({
    where: eq(dayTemplates.dayNumber, workoutInfo.dayNumber),
  });

  // Get or create workout log
  let workoutLog = await db.query.workoutLogs.findFirst({
    where: and(
      eq(workoutLogs.userId, user.id),
      eq(workoutLogs.date, dateStr)
    ),
  });

  if (!workoutLog) {
    const result = await db
      .insert(workoutLogs)
      .values({
        userId: user.id,
        date: dateStr,
        dayTemplateId: dayTemplate?.id || null,
        completed: false,
      })
      .returning();
    workoutLog = result[0];
  } else {
    // Delete existing exercise logs and snapshots using batch operations
    const existingLogs = await db.query.exerciseLogs.findMany({
      where: eq(exerciseLogs.workoutLogId, workoutLog.id),
    });

    const existingLogIds = existingLogs.map((l) => l.id);
    if (existingLogIds.length > 0) {
      // Batch delete all snapshots in one query
      await db
        .delete(exerciseSnapshots)
        .where(inArray(exerciseSnapshots.exerciseLogId, existingLogIds));
    }

    // Batch delete all exercise logs in one query
    await db
      .delete(exerciseLogs)
      .where(eq(exerciseLogs.workoutLogId, workoutLog.id));
  }

  // Batch fetch all exercise definitions upfront
  const exerciseIds = [...new Set(data.exercises.map((e) => e.exerciseId))];
  const allExerciseDefs =
    exerciseIds.length > 0
      ? await db.query.blockWeekExercises.findMany({
          where: inArray(blockWeekExercises.id, exerciseIds),
        })
      : [];
  const exerciseDefMap = new Map(allExerciseDefs.map((e) => [e.id, e]));

  // Insert all exercise logs in batch
  const exerciseLogInserts = data.exercises.map((exerciseData) => ({
    workoutLogId: workoutLog!.id,
    exerciseId: exerciseData.exerciseId,
    setNumber: exerciseData.setNumber,
    reps: exerciseData.reps,
    weight: exerciseData.weight,
    notes: exerciseData.notes || null,
  }));

  let insertedLogs: { id: string; exerciseId: string }[] = [];
  if (exerciseLogInserts.length > 0) {
    insertedLogs = await db
      .insert(exerciseLogs)
      .values(exerciseLogInserts)
      .returning({ id: exerciseLogs.id, exerciseId: exerciseLogs.exerciseId });
  }

  // Insert all snapshots in batch
  const snapshotInserts = insertedLogs
    .map((log) => {
      const exercise = exerciseDefMap.get(log.exerciseId);
      if (!exercise) return null;
      return {
        exerciseLogId: log.id,
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        tempo: exercise.tempo,
        rest: exercise.rest,
        notes: exercise.notes,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (snapshotInserts.length > 0) {
    await db.insert(exerciseSnapshots).values(snapshotInserts);
  }

  // Save block notes - delete existing and batch insert new ones
  await db
    .delete(blockNoteLogs)
    .where(eq(blockNoteLogs.workoutLogId, workoutLog.id));

  // Batch insert new block notes
  const blockNoteInserts = data.blockNotes
    .filter((bn) => bn.notes && bn.notes.trim())
    .map((bn) => ({
      workoutLogId: workoutLog!.id,
      blockId: bn.blockId,
      notes: bn.notes!.trim(),
    }));

  if (blockNoteInserts.length > 0) {
    await db.insert(blockNoteLogs).values(blockNoteInserts);
  }

  // Update workout log completed status
  await db
    .update(workoutLogs)
    .set({
      completed: data.completed,
      updatedAt: new Date(),
    })
    .where(eq(workoutLogs.id, workoutLog.id));

  return NextResponse.json({ success: true });
}
