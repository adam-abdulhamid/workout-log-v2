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
import { eq, asc, inArray, and } from "drizzle-orm";
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

  const blockIds = allBlocks.map((b) => b.id);

  // Batch load week 1 for all blocks
  const allWeek1s =
    blockIds.length > 0
      ? await db.query.blockWeeks.findMany({
          where: and(
            inArray(blockWeeks.blockId, blockIds),
            eq(blockWeeks.weekNumber, 1)
          ),
        })
      : [];
  const week1Map = new Map(allWeek1s.map((w) => [w.blockId, w]));

  // Batch load all exercises for week 1s
  const week1Ids = allWeek1s.map((w) => w.id);
  const allExercises =
    week1Ids.length > 0
      ? await db.query.blockWeekExercises.findMany({
          where: inArray(blockWeekExercises.blockWeekId, week1Ids),
        })
      : [];

  // Group exercises by blockWeekId and count active ones
  const exerciseCountMap = new Map<string, number>();
  for (const ex of allExercises) {
    if (ex.isActive) {
      const count = exerciseCountMap.get(ex.blockWeekId) || 0;
      exerciseCountMap.set(ex.blockWeekId, count + 1);
    }
  }

  // Batch load all day assignments
  const allDayAssignments =
    blockIds.length > 0
      ? await db
          .select({
            blockId: dayTemplateBlocks.blockId,
            dayName: dayTemplates.name,
          })
          .from(dayTemplateBlocks)
          .innerJoin(
            dayTemplates,
            eq(dayTemplateBlocks.dayTemplateId, dayTemplates.id)
          )
          .where(inArray(dayTemplateBlocks.blockId, blockIds))
      : [];

  // Group day assignments by blockId
  const daysUsedMap = new Map<string, string[]>();
  for (const assignment of allDayAssignments) {
    const days = daysUsedMap.get(assignment.blockId) || [];
    days.push(assignment.dayName);
    daysUsedMap.set(assignment.blockId, days);
  }

  // Build result
  const result: BlockSummary[] = allBlocks.map((block) => {
    const week1 = week1Map.get(block.id);
    const exerciseCount = week1 ? exerciseCountMap.get(week1.id) || 0 : 0;
    const daysUsed = daysUsedMap.get(block.id) || [];

    return {
      id: block.id,
      name: block.name,
      description: block.description,
      category: block.category,
      exerciseCount,
      daysUsed,
      version: block.version,
      lastModified: block.lastModified?.toISOString() || null,
    };
  });

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
