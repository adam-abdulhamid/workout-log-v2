import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, feedbackEntries } from "@/db/schema";

export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.isFeedbackUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await db.query.feedbackEntries.findMany({
    orderBy: desc(feedbackEntries.createdAt),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.isFeedbackUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const { description, screenshot, url, userAgent, screenWidth, screenHeight } = payload;

  if (!screenshot || !url) {
    return NextResponse.json(
      { error: "Screenshot and URL are required" },
      { status: 400 }
    );
  }

  const [entry] = await db
    .insert(feedbackEntries)
    .values({
      userId: user.id,
      description: description?.trim() || null,
      screenshot,
      url,
      userAgent: userAgent || null,
      screenWidth: screenWidth || null,
      screenHeight: screenHeight || null,
      status: "open",
    })
    .returning();

  return NextResponse.json(entry);
}
