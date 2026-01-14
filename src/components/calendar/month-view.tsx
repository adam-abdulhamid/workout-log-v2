"use client";

import { CalendarDay } from "@/types/workout";
import { DayCell } from "./day-cell";

interface MonthViewProps {
  days: CalendarDay[];
  year: number;
  month: number;
  onDayClick: (date: string) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({ days, year, month, onDayClick }: MonthViewProps) {
  // Get the first day of the month
  const firstDay = new Date(year, month - 1, 1);
  // Get the day of week (0 = Sunday, adjust for Monday start)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  // Create empty cells for padding
  const paddedDays: (CalendarDay | null)[] = [
    ...Array(startOffset).fill(null),
    ...days,
  ];

  // Add padding at the end to complete the grid
  const remainingCells = (7 - (paddedDays.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    paddedDays.push(null);
  }

  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, index) =>
          day ? (
            <DayCell key={day.date} day={day} onClick={onDayClick} isCompact />
          ) : (
            <div key={`empty-${index}`} className="min-h-[80px]" />
          )
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Deload</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded ring-2 ring-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
