"use client";

import { CalendarDay } from "@/types/workout";
import { DayCell } from "./day-cell";

interface WeekViewProps {
  days: CalendarDay[];
  onDayClick: (date: string) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekView({ days, onDayClick }: WeekViewProps) {
  return (
    <div className="space-y-2">
      {/* Day headers - short on mobile */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {DAY_NAMES.map((day, index) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAY_NAMES_SHORT[index]}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => (
          <DayCell key={day.date} day={day} onClick={onDayClick} isCompact />
        ))}
      </div>

      {/* Legend - wrap on mobile */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Deload</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 sm:w-4 sm:h-4 rounded ring-2 ring-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
