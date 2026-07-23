import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, weightEntries } from "@/db/schema";

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

  const entries = await db.query.weightEntries.findMany({
    where: eq(weightEntries.userId, user.id),
    orderBy: desc(weightEntries.date),
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

  const payload = await request.json();
  const weightLb = Number(payload?.weightLb);
  const date = payload?.date ? new Date(payload.date) : new Date();

  if (!Number.isFinite(weightLb) || weightLb <= 0) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [entry] = await db
    .insert(weightEntries)
    .values({
      userId: user.id,
      date,
      weightLb,
    })
    .returning();

  return NextResponse.json(entry);
}
