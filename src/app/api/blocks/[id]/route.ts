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
import { eq, and, asc, inArray } from "drizzle-orm";
import { getUserByClerkId } from "@/lib/user";
import type { BlockDetail, UpdateBlockPayload } from "@/types/workout";

// GET a block with all 6 weeks and exercises
export async function GET(
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

  // Batch load all weeks for this block (1 query instead of 6)
  const allBlockWeeks = await db.query.blockWeeks.findMany({
    where: eq(blockWeeks.blockId, block.id),
  });

  // Batch load all exercises for all weeks (1 query instead of 6)
  const blockWeekIds = allBlockWeeks.map((w) => w.id);
  const allExercises = blockWeekIds.length > 0
    ? await db.query.blockWeekExercises.findMany({
        where: and(
          inArray(blockWeekExercises.blockWeekId, blockWeekIds),
          eq(blockWeekExercises.isActive, true)
        ),
        orderBy: asc(blockWeekExercises.order),
      })
    : [];

  // Group exercises by week
  const exercisesByWeekId = new Map<string, typeof allExercises>();
  for (const ex of allExercises) {
    const list = exercisesByWeekId.get(ex.blockWeekId) || [];
    list.push(ex);
    exercisesByWeekId.set(ex.blockWeekId, list);
  }

  // Build weeks array
  const weeks = [];
  for (let weekNum = 1; weekNum <= 6; weekNum++) {
    const blockWeek = allBlockWeeks.find((w) => w.weekNumber === weekNum);
    const exercises = blockWeek ? exercisesByWeekId.get(blockWeek.id) || [] : [];

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

  // Get days that use this block (only for user's day templates)
  const daysUsed = await db
    .select({
      dayNumber: dayTemplates.dayNumber,
      name: dayTemplates.name,
    })
    .from(dayTemplateBlocks)
    .innerJoin(dayTemplates, eq(dayTemplateBlocks.dayTemplateId, dayTemplates.id))
    .where(
      and(
        eq(dayTemplateBlocks.blockId, block.id),
        eq(dayTemplates.userId, user.id)
      )
    );

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

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, max-age=0, stale-while-revalidate=60",
    },
  });
}

// PUT update block metadata
export async function PUT(
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
  const data: UpdateBlockPayload = await request.json();

  const block = await db.query.blocks.findFirst({
    where: and(eq(blocks.id, blockId), eq(blocks.userId, user.id)),
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Check for duplicate name if name is changing (for this user only)
  if (data.name && data.name !== block.name) {
    const existing = await db.query.blocks.findFirst({
      where: and(eq(blocks.userId, user.id), eq(blocks.name, data.name)),
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

  // Check if block is used by any day (for this user's day templates)
  const usageCount = await db
    .select()
    .from(dayTemplateBlocks)
    .innerJoin(dayTemplates, eq(dayTemplateBlocks.dayTemplateId, dayTemplates.id))
    .where(
      and(
        eq(dayTemplateBlocks.blockId, blockId),
        eq(dayTemplates.userId, user.id)
      )
    );

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
