import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blocks, blockWeeks, blockWeekExercises } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface ParsedExercise {
  order: number;
  name: string;
  sets: number | null;
  reps: string | null;
  tempo: string | null;
  rest: string | null;
  notes: string | null;
}

interface ParsedBlock {
  name: string | null;
  category: string | null;
  description: string | null;
  weeks: Record<number, ParsedExercise[]>;
}

function parseBlockMarkdown(markdown: string): ParsedBlock {
  const result: ParsedBlock = {
    name: null,
    category: null,
    description: null,
    weeks: {},
  };

  const lines = markdown.trim().split("\n");
  let currentWeek: number | null = null;
  let inTable = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Parse header: # Block: Push
    if (trimmedLine.startsWith("# Block:")) {
      result.name = trimmedLine.replace("# Block:", "").trim();
      continue;
    }

    // Parse metadata
    if (trimmedLine.startsWith("**Category:**")) {
      result.category = trimmedLine.replace("**Category:**", "").trim();
      continue;
    }
    if (trimmedLine.startsWith("**Description:**")) {
      result.description = trimmedLine.replace("**Description:**", "").trim();
      continue;
    }

    // Parse week header: ## Week 1
    const weekMatch = trimmedLine.match(/^## Week (\d+)/);
    if (weekMatch) {
      currentWeek = parseInt(weekMatch[1]);
      result.weeks[currentWeek] = [];
      inTable = false;
      continue;
    }

    // Parse table rows
    if (trimmedLine.startsWith("|") && currentWeek) {
      if (trimmedLine.includes("---")) {
        inTable = true;
        continue;
      }
      if (inTable) {
        const cols = trimmedLine
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c);

        if (cols.length >= 2) {
          const orderStr = cols[0];
          const exercise: ParsedExercise = {
            order: /^\d+$/.test(orderStr)
              ? parseInt(orderStr)
              : result.weeks[currentWeek].length + 1,
            name: cols[1] || "",
            sets: cols[2] ? parseInt(cols[2]) || null : null,
            reps: cols[3] || null,
            tempo: cols[4] || null,
            rest: cols[5] || null,
            notes: cols[6] || null,
          };

          // Skip header row
          if (exercise.name && exercise.name.toLowerCase() !== "exercise") {
            result.weeks[currentWeek].push(exercise);
          }
        }
      }
    }
  }

  return result;
}

// POST import markdown to update block
export async function POST(
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

  const { markdown } = await request.json();

  let parsed: ParsedBlock;
  try {
    parsed = parseBlockMarkdown(markdown);
  } catch (error) {
    return NextResponse.json(
      { error: `Parse error: ${error}` },
      { status: 400 }
    );
  }

  // Update block metadata if present
  const updates: { category?: string; description?: string } = {};
  if (parsed.category) {
    updates.category = parsed.category;
  }
  if (parsed.description) {
    updates.description = parsed.description;
  }
  if (Object.keys(updates).length > 0) {
    await db.update(blocks).set(updates).where(eq(blocks.id, blockId));
  }

  // Update weeks
  let totalExercises = 0;
  for (const [weekNumStr, exercises] of Object.entries(parsed.weeks)) {
    const weekNum = parseInt(weekNumStr);

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

    // Soft delete existing exercises
    await db
      .update(blockWeekExercises)
      .set({ isActive: false })
      .where(eq(blockWeekExercises.blockWeekId, blockWeek.id));

    // Add new exercises from markdown
    for (const ex of exercises) {
      await db.insert(blockWeekExercises).values({
        blockWeekId: blockWeek.id,
        order: ex.order,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        tempo: ex.tempo,
        rest: ex.rest,
        notes: ex.notes,
        isActive: true,
      });
      totalExercises++;
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

  return NextResponse.json({
    success: true,
    message: `Imported ${totalExercises} exercises`,
  });
}
