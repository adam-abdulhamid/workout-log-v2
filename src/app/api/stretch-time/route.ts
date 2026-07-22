import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { stretchTimeEntries } from "@/db/schema";
import { getUserByClerkId } from "@/lib/user";
import {
  STRETCHES,
  aggregateStretchDurations,
  getStretchWeekRange,
  isStretchId,
  totalStretchSeconds,
} from "@/lib/stretching";

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return getUserByClerkId(clerkId);
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = new URL(request.url).searchParams.get("date");
  if (!isDateString(date)) {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }

  const week = getStretchWeekRange(date);
  const records = await db.query.stretchTimeEntries.findMany({
    where: and(
      eq(stretchTimeEntries.userId, user.id),
      gte(stretchTimeEntries.date, week.start),
      lte(stretchTimeEntries.date, week.end)
    ),
  });

  const todayByStretch = aggregateStretchDurations(records, date);
  const weekByStretch = aggregateStretchDurations(records);

  return NextResponse.json({
    date,
    weekStart: week.start,
    weekEnd: week.end,
    today: {
      totalSeconds: totalStretchSeconds(todayByStretch),
      byStretch: todayByStretch,
    },
    week: {
      totalSeconds: totalStretchSeconds(weekByStretch),
      byStretch: weekByStretch,
    },
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    date?: unknown;
    entries?: Array<{ stretchId?: unknown; durationSeconds?: unknown }>;
  };

  if (!isDateString(body.date) || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: "Invalid stretch-time payload" }, { status: 400 });
  }

  const normalized = new Map<string, number>();
  for (const entry of body.entries) {
    if (
      typeof entry.stretchId !== "string" ||
      !isStretchId(entry.stretchId) ||
      typeof entry.durationSeconds !== "number" ||
      !Number.isFinite(entry.durationSeconds) ||
      entry.durationSeconds < 0 ||
      entry.durationSeconds > 86_400
    ) {
      return NextResponse.json({ error: "Invalid stretch-time entry" }, { status: 400 });
    }
    normalized.set(entry.stretchId, Math.floor(entry.durationSeconds));
  }

  for (const stretch of STRETCHES) {
    const durationSeconds = normalized.get(stretch.id) ?? 0;
    await db
      .insert(stretchTimeEntries)
      .values({
        userId: user.id,
        date: body.date,
        stretchId: stretch.id,
        durationSeconds,
      })
      .onConflictDoUpdate({
        target: [
          stretchTimeEntries.userId,
          stretchTimeEntries.date,
          stretchTimeEntries.stretchId,
        ],
        set: { durationSeconds, updatedAt: new Date() },
      });
  }

  return NextResponse.json({ success: true });
}
