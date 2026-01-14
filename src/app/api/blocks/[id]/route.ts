import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  blocks,
  blockWeeks,
  blockWeekExercises,
  dayTemplateBlocks,
  dayTemplates,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { BlockDetail, UpdateBlockPayload } from "@/types/workout";

// GET a block with all 6 weeks and exercises
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: blockId } = await params;

  const block = await db.query.blocks.findFirst({
    where: eq(blocks.id, blockId),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Get all 6 weeks
  const weeks = [];
  for (let weekNum = 1; weekNum <= 6; weekNum++) {
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

    weeks.push({
      weekNumber: weekNum,
      id: blockWeek?.id || null,
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

  // Get days that use this block
  const daysUsed = await db
    .select({
      dayNumber: dayTemplates.dayNumber,
      name: dayTemplates.name,
    })
    .from(dayTemplateBlocks)
    .innerJoin(dayTemplates, eq(dayTemplateBlocks.dayTemplateId, dayTemplates.id))
    .where(eq(dayTemplateBlocks.blockId, block.id));

  const result: BlockDetail = {
    id: block.id,
    name: block.name,
    description: block.description,
    category: block.category,
    version: block.version,
    lastModified: block.lastModified?.toISOString() || null,
    weeks,
    daysUsed,
  };

  return NextResponse.json(result);
}

// PUT update block metadata
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: blockId } = await params;
  const data: UpdateBlockPayload = await request.json();

  const block = await db.query.blocks.findFirst({
    where: eq(blocks.id, blockId),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Check for duplicate name if name is changing
  if (data.name && data.name !== block.name) {
    const existing = await db.query.blocks.findFirst({
      where: eq(blocks.name, data.name),
    });
    if (existing) {
      return NextResponse.json(
        { error: "A block with this name already exists" },
        { status: 400 }
      );
    }
  }

  // Update block
  await db
    .update(blocks)
    .set({
      name: data.name !== undefined ? data.name : block.name,
      description: data.description !== undefined ? data.description : block.description,
      category: data.category !== undefined ? data.category : block.category,
      version: block.version + 1,
      lastModified: new Date(),
    })
    .where(eq(blocks.id, blockId));

  return NextResponse.json({ success: true, message: "Block updated" });
}

// DELETE a block (only if not used by any day)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: blockId } = await params;

  const block = await db.query.blocks.findFirst({
    where: eq(blocks.id, blockId),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Check if block is used by any day
  const usageCount = await db
    .select()
    .from(dayTemplateBlocks)
    .where(eq(dayTemplateBlocks.blockId, blockId));

  if (usageCount.length > 0) {
    return NextResponse.json(
      { error: `Cannot delete block - it is used by ${usageCount.length} day(s)` },
      { status: 400 }
    );
  }

  // Delete the block (cascade will handle weeks and exercises)
  await db.delete(blocks).where(eq(blocks.id, blockId));

  return NextResponse.json({ success: true, message: "Block deleted" });
}
