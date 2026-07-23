import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { dayTemplates, dayTemplateBlocks, blocks } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getUserByClerkId, ensureUserDayTemplates, getUserDayTemplate } from "@/lib/user";
import type { DayTemplateDetail, UpdateDayTemplatePayload } from "@/types/workout";

// GET a day template with its assigned blocks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dayNum: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { dayNum: dayNumStr } = await params;
  const dayNum = parseInt(dayNumStr);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
    return NextResponse.json(
      { error: "Day number must be 1-7" },
      { status: 400 }
    );
  }

  // Ensure day templates exist for this user
  await ensureUserDayTemplates(user.id);

  const dt = await getUserDayTemplate(user.id, dayNum);

  if (!dt) {
    return NextResponse.json(
      { error: "Day template not found" },
      { status: 404 }
    );
  }

  const templateBlocks = await db
    .select({
      id: blocks.id,
      name: blocks.name,
      category: blocks.category,
      description: blocks.description,
      order: dayTemplateBlocks.order,
    })
    .from(dayTemplateBlocks)
    .innerJoin(blocks, eq(dayTemplateBlocks.blockId, blocks.id))
    .where(eq(dayTemplateBlocks.dayTemplateId, dt.id))
    .orderBy(asc(dayTemplateBlocks.order));

  const result: DayTemplateDetail = {
    id: dt.id,
    dayNumber: dt.dayNumber,
    name: dt.name,
    description: dt.description,
    version: dt.version,
    blocks: templateBlocks,
  };

  return NextResponse.json(result);
}

// PUT update a day template (name, description)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ dayNum: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { dayNum: dayNumStr } = await params;
  const dayNum = parseInt(dayNumStr);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
    return NextResponse.json(
      { error: "Day number must be 1-7" },
      { status: 400 }
    );
  }

  // Ensure day templates exist for this user
  await ensureUserDayTemplates(user.id);

  const dt = await getUserDayTemplate(user.id, dayNum);

  if (!dt) {
    return NextResponse.json(
      { error: "Day template not found" },
      { status: 404 }
    );
  }

  const data: UpdateDayTemplatePayload = await request.json();

  await db
    .update(dayTemplates)
    .set({
      name: data.name !== undefined ? data.name : dt.name,
      description: data.description !== undefined ? data.description : dt.description,
      version: dt.version + 1,
      lastModified: new Date(),
    })
    .where(eq(dayTemplates.id, dt.id));

  return NextResponse.json({ success: true, message: "Day template updated" });
}
