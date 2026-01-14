import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { dayTemplates, dayTemplateBlocks, blocks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { DayTemplateSummary } from "@/types/workout";

// GET all day templates
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await db.query.dayTemplates.findMany({
    orderBy: asc(dayTemplates.dayNumber),
  });

  const result: DayTemplateSummary[] = [];

  for (const dt of templates) {
    const templateBlocks = await db
      .select({
        id: blocks.id,
        name: blocks.name,
        category: blocks.category,
        order: dayTemplateBlocks.order,
      })
      .from(dayTemplateBlocks)
      .innerJoin(blocks, eq(dayTemplateBlocks.blockId, blocks.id))
      .where(eq(dayTemplateBlocks.dayTemplateId, dt.id))
      .orderBy(asc(dayTemplateBlocks.order));

    result.push({
      id: dt.id,
      dayNumber: dt.dayNumber,
      name: dt.name,
      description: dt.description,
      version: dt.version,
      blocks: templateBlocks,
    });
  }

  return NextResponse.json(result);
}
