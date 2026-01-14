"use client";

import { CalendarDay } from "@/types/workout";
import { DayCell } from "./day-cell";

interface WeekViewProps {
  days: CalendarDay[];
  onDayClick: (date: string) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekView({ days, onDayClick }: WeekViewProps) {
  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
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
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <DayCell key={day.date} day={day} onClick={onDayClick} />
        ))}
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
