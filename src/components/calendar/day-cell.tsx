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
        isCompact ? "p-1 sm:p-2 min-h-[60px] sm:min-h-[80px]" : "p-2 sm:p-3 min-h-[80px] sm:min-h-[100px]",
        day.completed && "bg-green-500/20",
        day.isDeload && !day.completed && "bg-yellow-500/10",
        isToday && "ring-2 ring-primary"
      )}
    >
      {isCompact && (
        <div className="absolute top-0.5 left-0.5 right-0.5 rounded border border-border/60 bg-background/70 px-0.5 py-0.5 text-[8px] sm:text-[10px] text-muted-foreground leading-none text-center line-clamp-1 min-h-[12px]">
          {day.workoutName}
        </div>
      )}

      {/* Day number */}
      <span
        className={cn(
          "text-sm sm:text-lg font-semibold",
          isToday && "text-primary"
        )}
      >
        {day.day}
      </span>

      {/* Workout name - hidden on very small screens in compact mode */}
      {!isCompact && (
        <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
          {day.workoutName}
        </span>
      )}

      {/* Indicators */}
      <div className="absolute bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 flex gap-0.5 sm:gap-1">
        {day.completed && (
          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-green-500" title="Completed" />
        )}
        {day.isDeload && (
          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-yellow-500" title="Deload week" />
        )}
      </div>

      {/* Week indicator */}
      {!isCompact && (
        <span className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 text-[8px] sm:text-[10px] text-muted-foreground">
          W{day.prescriptionWeek}
        </span>
      )}
    </button>
  );
}
