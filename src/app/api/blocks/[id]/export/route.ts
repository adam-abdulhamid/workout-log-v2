import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blocks, blockWeeks, blockWeekExercises } from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { getUserByClerkId } from "@/lib/user";

// GET export block as markdown
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

  // Batch load all weeks and exercises (2 queries instead of 12)
  const allBlockWeeks = await db.query.blockWeeks.findMany({
    where: eq(blockWeeks.blockId, block.id),
  });

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

  const lines: string[] = [
    `# Block: ${block.name}`,
    "",
    `**Category:** ${block.category || "strength"}`,
    `**Description:** ${block.description || ""}`,
    "",
  ];

  for (let weekNum = 1; weekNum <= 6; weekNum++) {
    const blockWeek = allBlockWeeks.find((w) => w.weekNumber === weekNum);

    lines.push(`## Week ${weekNum}`);

    if (blockWeek?.notes) {
      lines.push(`*${blockWeek.notes}*`);
    }

    lines.push("");
    lines.push("| # | Exercise | Sets | Reps | Tempo | Rest | Notes |");
    lines.push("|---|----------|------|------|-------|------|-------|");

    if (blockWeek) {
      const exercises = exercisesByWeekId.get(blockWeek.id) || [];
      for (const ex of exercises) {
        lines.push(
          `| ${ex.order} | ${ex.name} | ${ex.sets || ""} | ${ex.reps || ""} | ${
            ex.tempo || ""
          } | ${ex.rest || ""} | ${ex.notes || ""} |`
        );
      }
    }

    lines.push("");
  }

  return NextResponse.json({
    markdown: lines.join("\n"),
    blockName: block.name,
  });
}
