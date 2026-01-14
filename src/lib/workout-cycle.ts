/**
 * Workout Cycle Utilities
 *
 * Core business logic for determining workout schedules based on a 7-week training cycle.
 * - Weeks 1-6: Normal training with progressive overload
 * - Week 7: Deload week (uses Week 6 exercise prescriptions at reduced intensity)
 */

// Cycle start date: Monday, January 12, 2026
const CYCLE_START_DATE = new Date(2026, 0, 12); // Month is 0-indexed

/**
 * Get the workout cycle start date
 */
export function getCycleStartDate(): Date {
  return new Date(CYCLE_START_DATE);
}

/**
 * Parse a date string to a Date object at midnight UTC
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the Monday of the week containing the given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return d;
}

/**
 * Calculate days between two dates (ignoring time)
 */
function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export interface WorkoutDayInfo {
  /**
   * Day number (1-7 for Monday-Sunday)
   */
  dayNumber: number;

  /**
   * Week number for exercise prescription (1-6)
   * Note: Week 7 (deload) uses Week 6 prescriptions
   */
  prescriptionWeek: number;

  /**
   * True if this is a deload week (week 7 in the cycle)
   */
  isDeload: boolean;

  /**
   * Current week in the 7-week cycle (1-7)
   */
  weekInCycle: number;
}

/**
 * Determine which workout day and prescription week corresponds to a given date.
 *
 * @param date - The date to check
 * @returns WorkoutDayInfo with day number, prescription week, and deload status
 */
export function getWorkoutForDate(date: Date): WorkoutDayInfo {
  // Calculate days since cycle start
  const daysSinceStart = daysBetween(CYCLE_START_DATE, date);

  // Calculate weeks since start (can be negative for dates before cycle start)
  const weeksSinceStart = Math.floor(daysSinceStart / 7);

  // 7-week cycle: 6 weeks normal + 1 deload week
  // Use modulo that handles negative numbers correctly
  let weekInCycle = ((weeksSinceStart % 7) + 7) % 7;
  if (weekInCycle === 0) weekInCycle = 7;

  const isDeload = weekInCycle === 7;

  // Prescription week: weeks 1-6 use their own prescription, week 7 uses week 6
  const prescriptionWeek = weekInCycle <= 6 ? weekInCycle : 6;

  // Get day of week (0=Sunday, 6=Saturday in JS)
  const dayOfWeek = date.getDay();

  // Map to workout day (1=Monday, 7=Sunday)
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  return {
    dayNumber,
    prescriptionWeek,
    isDeload,
    weekInCycle,
  };
}

/**
 * Get workout info from a date string (YYYY-MM-DD format)
 */
export function getWorkoutForDateString(dateStr: string): WorkoutDayInfo {
  return getWorkoutForDate(parseDate(dateStr));
}

/**
 * Get the day name for a day number (1-7)
 */
export function getDayName(dayNumber: number): string {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return days[dayNumber - 1] || "Unknown";
}

/**
 * Get the short day name for a day number (1-7)
 */
export function getShortDayName(dayNumber: number): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[dayNumber - 1] || "???";
}

/**
 * Get all dates for a given week starting from a date
 */
export function getWeekDates(startDate: Date): Date[] {
  const weekStart = getWeekStart(startDate);
  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Get all days in a month with their workout info
 */
export function getMonthDays(
  year: number,
  month: number
): Array<{
  date: Date;
  dateStr: string;
  day: number;
  workoutInfo: WorkoutDayInfo;
}> {
  const days: Array<{
    date: Date;
    dateStr: string;
    day: number;
    workoutInfo: WorkoutDayInfo;
  }> = [];

  // Get number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    days.push({
      date,
      dateStr: formatDate(date),
      day,
      workoutInfo: getWorkoutForDate(date),
    });
  }

  return days;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Get the week number in the year for a date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
