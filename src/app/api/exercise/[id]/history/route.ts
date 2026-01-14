import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  exerciseLogs,
  workoutLogs,
  exerciseSnapshots,
  users,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ExerciseHistoryEntry } from "@/types/workout";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: exerciseId } = await params;

  // Get user from database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get last 50 logs for this exercise with their workout dates
  const logs = await db
    .select({
      exerciseLog: exerciseLogs,
      workoutLog: workoutLogs,
    })
    .from(exerciseLogs)
    .innerJoin(workoutLogs, eq(exerciseLogs.workoutLogId, workoutLogs.id))
    .where(
      and(
        eq(exerciseLogs.exerciseId, exerciseId),
        eq(workoutLogs.userId, user.id)
      )
    )
    .orderBy(desc(workoutLogs.date))
    .limit(50);

  // Get snapshots for these exercise logs
  const history: ExerciseHistoryEntry[] = [];

  for (const { exerciseLog, workoutLog } of logs) {
    // Get snapshot for this log
    const snapshot = await db.query.exerciseSnapshots.findFirst({
      where: eq(exerciseSnapshots.exerciseLogId, exerciseLog.id),
    });

    history.push({
      date: workoutLog.date,
      setNumber: exerciseLog.setNumber,
      reps: exerciseLog.reps,
      weight: exerciseLog.weight,
      notes: exerciseLog.notes,
      prescribed: snapshot
        ? {
            name: snapshot.name,
            sets: snapshot.sets,
            reps: snapshot.reps,
            tempo: snapshot.tempo,
            rest: snapshot.rest,
          }
        : null,
    });
  }

  return NextResponse.json(history);
}
