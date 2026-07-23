import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blocks, blockWeeks, blockWeekExercises } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUserByClerkId } from "@/lib/user";
import type { UpdateWeekPayload } from "@/types/workout";

// GET a specific week's exercises for a block
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; weekNum: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id: blockId, weekNum: weekNumStr } = await params;
  const weekNum = parseInt(weekNumStr);

  if (isNaN(weekNum) || weekNum < 1 || weekNum > 6) {
    return NextResponse.json(
      { error: "Week number must be 1-6" },
      { status: 400 }
    );
  }

  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.id, blockId), eq(blocks.userId, user.id)),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const blockWeek = await db.query.blockWeeks.findFirst({
    where: and(
      eq(blockWeeks.blockId, block.id),
      eq(blockWeeks.weekNumber, weekNum)
    ),
  });

  const exercises = blockWeek
    ? await db.query.blockWeekExercises.findMany({
        where: and(
          eq(blockWeekExercises.blockWeekId, blockWeek.id),
          eq(blockWeekExercises.isActive, true)
        ),
        orderBy: asc(blockWeekExercises.order),
      })
    : [];

  return NextResponse.json({
    blockId: block.id,
    blockName: block.name,
    weekNumber: weekNum,
    weekId: blockWeek?.id || null,
    notes: blockWeek?.notes || null,
    exercises: exercises.map((ex) => ({
      id: ex.id,
      order: ex.order,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      rest: ex.rest,
      weightGuidance: ex.weightGuidance,
      notes: ex.notes,
    })),
  });
}

// PUT update a specific week's exercises
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; weekNum: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id: blockId, weekNum: weekNumStr } = await params;
  const weekNum = parseInt(weekNumStr);

  if (isNaN(weekNum) || weekNum < 1 || weekNum > 6) {
    return NextResponse.json(
      { error: "Week number must be 1-6" },
      { status: 400 }
    );
  }

  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.id, blockId), eq(blocks.userId, user.id)),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const data: UpdateWeekPayload = await request.json();

  // Get or create the block week
  let blockWeek = await db.query.blockWeeks.findFirst({
    where: and(
      eq(blockWeeks.blockId, block.id),
      eq(blockWeeks.weekNumber, weekNum)
    ),
  });

  if (!blockWeek) {
    const result = await db
      .insert(blockWeeks)
      .values({
        blockId: block.id,
        weekNumber: weekNum,
      })
      .returning();
    blockWeek = result[0];
  }

  // Update week notes if provided
  if (data.notes !== undefined) {
    await db
      .update(blockWeeks)
      .set({ notes: data.notes })
      .where(eq(blockWeeks.id, blockWeek.id));
  }

  // Handle deleted exercises (soft delete)
  if (data.deletedExercises) {
    for (const exerciseId of data.deletedExercises) {
      await db
        .update(blockWeekExercises)
        .set({ isActive: false })
        .where(
          and(
            eq(blockWeekExercises.id, exerciseId),
            eq(blockWeekExercises.blockWeekId, blockWeek.id)
          )
        );
    }
  }

  // Update or create exercises
  if (data.exercises) {
    for (const exData of data.exercises) {
      if (exData.id) {
        // Update existing exercise
        await db
          .update(blockWeekExercises)
          .set({
            order: exData.order,
            name: exData.name,
            sets: exData.sets,
            reps: exData.reps,
            tempo: exData.tempo,
            rest: exData.rest,
            weightGuidance: exData.weightGuidance,
            notes: exData.notes,
          })
          .where(
            and(
              eq(blockWeekExercises.id, exData.id),
              eq(blockWeekExercises.blockWeekId, blockWeek.id)
            )
          );
      } else {
        // Create new exercise
        await db.insert(blockWeekExercises).values({
          blockWeekId: blockWeek.id,
          order: exData.order,
          name: exData.name,
          sets: exData.sets,
          reps: exData.reps,
          tempo: exData.tempo,
          rest: exData.rest,
          weightGuidance: exData.weightGuidance,
          notes: exData.notes,
          isActive: true,
        });
      }
    }
  }

  // Update block version
  await db
    .update(blocks)
    .set({
      version: block.version + 1,
      lastModified: new Date(),
    })
    .where(eq(blocks.id, blockId));

  return NextResponse.json({ success: true, message: `Week ${weekNum} updated` });
}
