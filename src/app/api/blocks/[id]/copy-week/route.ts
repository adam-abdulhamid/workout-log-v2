import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blocks, blockWeeks, blockWeekExercises } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUserByClerkId } from "@/lib/user";
import type { CopyWeekPayload } from "@/types/workout";

// POST copy exercises from one week to others
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id: blockId } = await params;

  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.id, blockId), eq(blocks.userId, user.id)),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const data: CopyWeekPayload = await request.json();

  if (data.sourceWeek < 1 || data.sourceWeek > 6) {
    return NextResponse.json(
      { error: "Source week must be 1-6" },
      { status: 400 }
    );
  }

  // Get source week
  const sourceBlockWeek = await db.query.blockWeeks.findFirst({
    where: and(
      eq(blockWeeks.blockId, block.id),
      eq(blockWeeks.weekNumber, data.sourceWeek)
    ),
  });

  if (!sourceBlockWeek) {
    return NextResponse.json(
      { error: `Source week ${data.sourceWeek} not found` },
      { status: 404 }
    );
  }

  // Get source exercises
  const sourceExercises = await db.query.blockWeekExercises.findMany({
    where: and(
      eq(blockWeekExercises.blockWeekId, sourceBlockWeek.id),
      eq(blockWeekExercises.isActive, true)
    ),
    orderBy: asc(blockWeekExercises.order),
  });

  let copiedCount = 0;

  for (const targetWeek of data.targetWeeks) {
    if (targetWeek < 1 || targetWeek > 6 || targetWeek === data.sourceWeek) {
      continue;
    }

    // Get or create target week
    let targetBlockWeek = await db.query.blockWeeks.findFirst({
      where: and(
        eq(blockWeeks.blockId, block.id),
        eq(blockWeeks.weekNumber, targetWeek)
      ),
    });

    if (!targetBlockWeek) {
      const result = await db
        .insert(blockWeeks)
        .values({
          blockId: block.id,
          weekNumber: targetWeek,
        })
        .returning();
      targetBlockWeek = result[0];
    }

    // Soft delete existing exercises in target week
    await db
      .update(blockWeekExercises)
      .set({ isActive: false })
      .where(eq(blockWeekExercises.blockWeekId, targetBlockWeek.id));

    // Copy exercises
    for (const ex of sourceExercises) {
      await db.insert(blockWeekExercises).values({
        blockWeekId: targetBlockWeek.id,
        order: ex.order,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        tempo: ex.tempo,
        rest: ex.rest,
        weightGuidance: ex.weightGuidance,
        notes: ex.notes,
        isActive: true,
      });
    }

    copiedCount++;
  }

  // Update block version
  await db
    .update(blocks)
    .set({
      version: block.version + 1,
      lastModified: new Date(),
    })
    .where(eq(blocks.id, blockId));

  return NextResponse.json({
    success: true,
    message: `Copied week ${data.sourceWeek} to ${copiedCount} week(s)`,
  });
}
