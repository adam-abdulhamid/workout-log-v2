import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { stretchTimeEntries } from "@/db/schema";
import { getUserByClerkId } from "@/lib/user";
import {
  STRETCHES,
  addDays,
  aggregateStretchDurations,
  emptyStretchDurations,
  getStretchWeekRange,
  totalStretchSeconds,
} from "@/lib/stretching";

export async function GET(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const params = new URL(request.url).searchParams;
  const endDate = params.get("endDate");
  const requestedWeeks = Number(params.get("weeks") ?? 12);
  if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: "A valid endDate is required" }, { status: 400 });
  }
  if (!Number.isInteger(requestedWeeks) || requestedWeeks < 1 || requestedWeeks > 52) {
    return NextResponse.json({ error: "weeks must be between 1 and 52" }, { status: 400 });
  }

  const currentWeek = getStretchWeekRange(endDate);
  const startDate = addDays(currentWeek.start, -(requestedWeeks - 1) * 7);
  const records = await db.query.stretchTimeEntries.findMany({
    where: and(
      eq(stretchTimeEntries.userId, user.id),
      gte(stretchTimeEntries.date, startDate),
      lte(stretchTimeEntries.date, endDate)
    ),
  });

  const dailyMap = new Map<string, ReturnType<typeof emptyStretchDurations>>();
  for (const record of records) {
    const totals = dailyMap.get(record.date) ?? emptyStretchDurations();
    if (record.stretchId in totals) {
      totals[record.stretchId as keyof typeof totals] += record.durationSeconds;
    }
    dailyMap.set(record.date, totals);
  }

  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, byStretch]) => ({
      date,
      totalSeconds: totalStretchSeconds(byStretch),
      byStretch,
    }));

  const weekly = Array.from({ length: requestedWeeks }, (_, index) => {
    const weekStart = addDays(startDate, index * 7);
    const weekEnd = addDays(weekStart, 6);
    const weekRecords = records.filter(
      (record) => record.date >= weekStart && record.date <= weekEnd
    );
    const byStretch = aggregateStretchDurations(weekRecords);
    return {
      weekStart,
      weekEnd,
      totalSeconds: totalStretchSeconds(byStretch),
      byStretch,
    };
  });

  const byStretch = aggregateStretchDurations(records);
  return NextResponse.json({
    startDate,
    endDate,
    stretches: STRETCHES,
    totalSeconds: totalStretchSeconds(byStretch),
    byStretch,
    daily,
    weekly,
  });
}
