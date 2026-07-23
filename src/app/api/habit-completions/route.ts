import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, habitCompletions } from "@/db/schema";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const date = dateParam || new Date().toISOString().split("T")[0];

  const completions = await db.query.habitCompletions.findMany({
    where: and(
      eq(habitCompletions.userId, user.id),
      eq(habitCompletions.date, date)
    ),
  });

  return NextResponse.json(completions);
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

  const payload = await request.json();
  const { habitId, date: dateParam } = payload;

  if (!habitId) {
    return NextResponse.json({ error: "Habit ID is required" }, { status: 400 });
  }

  const date = dateParam || new Date().toISOString().split("T")[0];

  // Check if completion already exists
  const existing = await db.query.habitCompletions.findFirst({
    where: and(
      eq(habitCompletions.habitId, habitId),
      eq(habitCompletions.date, date)
    ),
  });

  if (existing) {
    // Toggle off - delete the completion
    await db
      .delete(habitCompletions)
      .where(eq(habitCompletions.id, existing.id));

    return NextResponse.json({ completed: false, habitId, date });
  }

  // Toggle on - create the completion
  const [completion] = await db
    .insert(habitCompletions)
    .values({
      habitId,
      userId: user.id,
      date,
    })
    .returning();

  return NextResponse.json({ completed: true, habitId, date, completion });
}
