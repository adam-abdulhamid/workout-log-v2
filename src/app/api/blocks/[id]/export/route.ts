import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blocks, blockWeeks, blockWeekExercises } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
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

  const lines: string[] = [
    `# Block: ${block.name}`,
    "",
    `**Category:** ${block.category || "strength"}`,
    `**Description:** ${block.description || ""}`,
    "",
  ];

  for (let weekNum = 1; weekNum <= 6; weekNum++) {
    const blockWeek = await db.query.blockWeeks.findFirst({
      where: and(
        eq(blockWeeks.blockId, block.id),
        eq(blockWeeks.weekNumber, weekNum)
      ),
    });

    lines.push(`## Week ${weekNum}`);

    if (blockWeek?.notes) {
      lines.push(`*${blockWeek.notes}*`);
    }

    lines.push("");
    lines.push("| # | Exercise | Sets | Reps | Tempo | Rest | Notes |");
    lines.push("|---|----------|------|------|-------|------|-------|");

    if (blockWeek) {
      const exercises = await db.query.blockWeekExercises.findMany({
        where: and(
          eq(blockWeekExercises.blockWeekId, blockWeek.id),
          eq(blockWeekExercises.isActive, true)
        ),
        orderBy: asc(blockWeekExercises.order),
      });

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
