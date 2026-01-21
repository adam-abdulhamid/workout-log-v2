import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { workoutLogs, users } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  getWorkoutForDate,
  formatDate,
  getWeekStart,
  parseDate,
} from "@/lib/workout-cycle";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date: dateStr } = await params;

  // Parse the center date
  let centerDate: Date;
  try {
    centerDate = parseDate(dateStr);
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
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

  // Get the Monday of this week
  const weekStart = getWeekStart(centerDate);

  // Build date range for query
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekStartStr = formatDate(weekStart);
  const weekEndStr = formatDate(weekEnd);

  // Get workout logs for this week only (not all logs)
  const logs = await db.query.workoutLogs.findMany({
    where: and(
      eq(workoutLogs.userId, user.id),
      gte(workoutLogs.date, weekStartStr),
      lte(workoutLogs.date, weekEndStr)
    ),
  });

  const logsMap = new Map(logs.map((log) => [log.date, log]));

  // Build week data
  const weekData = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateString = formatDate(date);
    const workoutInfo = getWorkoutForDate(date);

    const dayTemplate = templateMap.get(workoutInfo.dayNumber);
    const workoutLog = logsMap.get(dateString);

    weekData.push({
      date: dateString,
      day: date.getDate(),
      weekday: dayNames[i],
      month: monthNames[date.getMonth()],
      workoutDay: dayTemplate?.name || "Rest",
      completed: workoutLog?.completed || false,
      isDeload: workoutInfo.isDeload,
      prescriptionWeek: workoutInfo.prescriptionWeek,
    });
  }

  return NextResponse.json({
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    days: weekData,
  });
}
