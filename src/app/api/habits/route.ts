import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, habits } from "@/db/schema";

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

  const userHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, user.id), eq(habits.isActive, true)),
    orderBy: habits.createdAt,
  });

  return NextResponse.json(userHabits, {
    headers: {
      "Cache-Control": "private, max-age=0, stale-while-revalidate=60",
    },
  });
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
  const name = payload?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [habit] = await db
    .insert(habits)
    .values({
      userId: user.id,
      name,
    })
    .returning();

  return NextResponse.json(habit);
}
