"use client";

import { cn } from "@/lib/utils";
import { CalendarDay } from "@/types/workout";

interface DayCellProps {
  day: CalendarDay;
  onClick: (date: string) => void;
  isCompact?: boolean;
}

export function DayCell({ day, onClick, isCompact = false }: DayCellProps) {
  const isToday = day.isToday;

  return (
    <button
      onClick={() => onClick(day.date)}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg transition-colors",
        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isCompact ? "p-2 min-h-[80px]" : "p-3 min-h-[100px]",
        day.completed && "bg-green-500/20",
        day.isDeload && !day.completed && "bg-yellow-500/10",
        isToday && "ring-2 ring-primary"
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "text-lg font-semibold",
          isToday && "text-primary"
        )}
      >
        {day.day}
      </span>

      {/* Workout name */}
      <span
        className={cn(
          "text-xs text-muted-foreground text-center mt-1 line-clamp-2",
          isCompact && "text-[10px]"
        )}
      >
        {day.workoutName}
      </span>

      {/* Indicators */}
      <div className="absolute bottom-1 right-1 flex gap-1">
        {day.completed && (
          <span className="w-2 h-2 rounded-full bg-green-500" title="Completed" />
        )}
        {day.isDeload && (
          <span className="w-2 h-2 rounded-full bg-yellow-500" title="Deload week" />
        )}
      </div>

      {/* Week indicator */}
      {!isCompact && (
        <span className="absolute top-1 right-1 text-[10px] text-muted-foreground">
          W{day.prescriptionWeek}
        </span>
      )}
    </button>
  );
}
