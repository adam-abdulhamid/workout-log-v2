import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workoutLogs, users } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getWorkoutForDate, formatDate } from "@/lib/workout-cycle";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  // Get user from database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get all day templates
  const templates = await db.query.dayTemplates.findMany();
  const templateMap = new Map(templates.map((t) => [t.dayNumber, t]));

  // Get number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build date range for query
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

  // Get workout logs for this month only (filter in database, not in JS)
  const logs = await db.query.workoutLogs.findMany({
    where: and(
      eq(workoutLogs.userId, user.id),
      gte(workoutLogs.date, startDate),
      lte(workoutLogs.date, endDate)
    ),
  });

  const logsMap = new Map(logs.map((log) => [log.date, log]));

  // Build calendar data
  const calendarData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = formatDate(date);
    const workoutInfo = getWorkoutForDate(date);

    const dayTemplate = templateMap.get(workoutInfo.dayNumber);
    const workoutLog = logsMap.get(dateStr);

    calendarData.push({
      date: dateStr,
      day,
      workoutDay: dayTemplate?.name || "Rest",
      completed: workoutLog?.completed || false,
      isDeload: workoutInfo.isDeload,
      prescriptionWeek: workoutInfo.prescriptionWeek,
    });
  }

  return NextResponse.json(calendarData);
}
