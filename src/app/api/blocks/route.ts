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
import { eq, asc } from "drizzle-orm";
import type { BlockSummary, CreateBlockPayload } from "@/types/workout";

// GET all blocks with summary info
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allBlocks = await db.query.blocks.findMany({
    orderBy: [asc(blocks.category), asc(blocks.name)],
  });

  const result: BlockSummary[] = [];

  for (const block of allBlocks) {
    // Get week 1 to count exercises
    const week1 = await db.query.blockWeeks.findFirst({
      where: eq(blockWeeks.blockId, block.id),
    });

    let exerciseCount = 0;
    if (week1) {
      const exercises = await db.query.blockWeekExercises.findMany({
        where: eq(blockWeekExercises.blockWeekId, week1.id),
      });
      exerciseCount = exercises.filter((e) => e.isActive).length;
    }

    // Get days that use this block
    const daysUsed = await db
      .select({ name: dayTemplates.name })
      .from(dayTemplateBlocks)
      .innerJoin(dayTemplates, eq(dayTemplateBlocks.dayTemplateId, dayTemplates.id))
      .where(eq(dayTemplateBlocks.blockId, block.id));

    result.push({
      id: block.id,
      name: block.name,
      description: block.description,
      category: block.category,
      exerciseCount,
      daysUsed: daysUsed.map((d) => d.name),
      version: block.version,
      lastModified: block.lastModified?.toISOString() || null,
    });
  }

  return NextResponse.json(result);
}

// POST create a new block
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data: CreateBlockPayload = await request.json();

  if (!data.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Check for duplicate name
  const existing = await db.query.blocks.findFirst({
    where: eq(blocks.name, data.name),
  });

  if (existing) {
    return NextResponse.json(
      { error: "A block with this name already exists" },
      { status: 400 }
    );
  }

  // Create the block
  const blockResult = await db
    .insert(blocks)
    .values({
      name: data.name,
      description: data.description || "",
      category: data.category || "strength",
    })
    .returning();

  const block = blockResult[0];

  // Create 6 empty weeks
  for (let weekNum = 1; weekNum <= 6; weekNum++) {
    await db.insert(blockWeeks).values({
      blockId: block.id,
      weekNumber: weekNum,
    });
  }

  return NextResponse.json({
    success: true,
    id: block.id,
    message: `Block "${block.name}" created`,
  });
}
