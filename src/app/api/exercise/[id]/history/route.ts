import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  exerciseLogs,
  workoutLogs,
  exerciseSnapshots,
  users,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
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

  // Batch load all snapshots for these exercise logs
  const exerciseLogIds = logs.map((l) => l.exerciseLog.id);
  const allSnapshots =
    exerciseLogIds.length > 0
      ? await db.query.exerciseSnapshots.findMany({
          where: inArray(exerciseSnapshots.exerciseLogId, exerciseLogIds),
        })
      : [];

  // Create a map for quick lookup
  const snapshotMap = new Map(
    allSnapshots.map((s) => [s.exerciseLogId, s])
  );

  // Build history from logs and snapshots
  const history: ExerciseHistoryEntry[] = logs.map(
    ({ exerciseLog, workoutLog }) => {
      const snapshot = snapshotMap.get(exerciseLog.id);
      return {
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
      };
    }
  );

  return NextResponse.json(history);
}
