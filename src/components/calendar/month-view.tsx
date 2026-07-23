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
const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-0.5 md:gap-2">
        {DAY_NAMES.map((day, index) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-muted-foreground py-2 tracking-wider uppercase"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAY_NAMES_SHORT[index]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 md:gap-2">
        {paddedDays.map((day, index) =>
          day ? (
            <DayCell
              key={day.date}
              day={day}
              onClick={onDayClick}
              showWeekday={false}
            />
          ) : (
            <div
              key={`empty-${index}`}
              className="aspect-square border border-border/30 bg-background"
            />
          )
        )}
      </div>
    </div>
  );
}
