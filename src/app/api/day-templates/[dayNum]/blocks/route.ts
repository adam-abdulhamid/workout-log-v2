import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { dayTemplates, dayTemplateBlocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UpdateDayBlocksPayload } from "@/types/workout";

// PUT update the blocks assigned to a day template
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ dayNum: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dayNum: dayNumStr } = await params;
  const dayNum = parseInt(dayNumStr);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
    return NextResponse.json(
      { error: "Day number must be 1-7" },
      { status: 400 }
    );
  }

  const dt = await db.query.dayTemplates.findFirst({
    where: eq(dayTemplates.dayNumber, dayNum),
  });

  if (!dt) {
    return NextResponse.json(
      { error: "Day template not found" },
      { status: 404 }
    );
  }

  const data: UpdateDayBlocksPayload = await request.json();

  // Remove all existing block assignments
  await db
    .delete(dayTemplateBlocks)
    .where(eq(dayTemplateBlocks.dayTemplateId, dt.id));

  // Add new block assignments
  for (let i = 0; i < data.blocks.length; i++) {
    const blockData = data.blocks[i];
    await db.insert(dayTemplateBlocks).values({
      dayTemplateId: dt.id,
      blockId: blockData.id,
      order: blockData.order ?? i + 1,
    });
  }

  // Update day template version
  await db
    .update(dayTemplates)
    .set({
      version: dt.version + 1,
      lastModified: new Date(),
    })
    .where(eq(dayTemplates.id, dt.id));

  return NextResponse.json({ success: true, message: "Day blocks updated" });
}
