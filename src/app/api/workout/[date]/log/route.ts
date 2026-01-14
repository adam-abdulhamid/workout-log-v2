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
import { eq, and } from "drizzle-orm";
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
    // Delete existing exercise logs and snapshots to avoid duplicates
    const existingLogs = await db.query.exerciseLogs.findMany({
      where: eq(exerciseLogs.workoutLogId, workoutLog.id),
    });

    for (const log of existingLogs) {
      await db
        .delete(exerciseSnapshots)
        .where(eq(exerciseSnapshots.exerciseLogId, log.id));
    }

    await db
      .delete(exerciseLogs)
      .where(eq(exerciseLogs.workoutLogId, workoutLog.id));
  }

  // Save exercise logs with snapshots
  for (const exerciseData of data.exercises) {
    // Get the exercise definition
    const exercise = await db.query.blockWeekExercises.findFirst({
      where: eq(blockWeekExercises.id, exerciseData.exerciseId),
    });

    // Create exercise log
    const exerciseLogResult = await db
      .insert(exerciseLogs)
      .values({
        workoutLogId: workoutLog.id,
        exerciseId: exerciseData.exerciseId,
        setNumber: exerciseData.setNumber,
        reps: exerciseData.reps,
        weight: exerciseData.weight,
        notes: exerciseData.notes || null,
      })
      .returning();

    const exerciseLog = exerciseLogResult[0];

    // Create snapshot of exercise definition
    if (exercise) {
      await db.insert(exerciseSnapshots).values({
        exerciseLogId: exerciseLog.id,
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        tempo: exercise.tempo,
        rest: exercise.rest,
        notes: exercise.notes,
      });
    }
  }

  // Save block notes
  // First, delete existing block notes for this workout
  await db
    .delete(blockNoteLogs)
    .where(eq(blockNoteLogs.workoutLogId, workoutLog.id));

  // Then insert new block notes
  for (const blockNote of data.blockNotes) {
    if (blockNote.notes && blockNote.notes.trim()) {
      await db.insert(blockNoteLogs).values({
        workoutLogId: workoutLog.id,
        blockId: blockNote.blockId,
        notes: blockNote.notes.trim(),
      });
    }
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
