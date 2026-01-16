"use client";

import { cn } from "@/lib/utils";
import { CalendarDay } from "@/types/workout";

interface DayCellProps {
  day: CalendarDay;
  onClick: (date: string) => void;
  showWeekday?: boolean;
}

export function DayCell({ day, onClick, showWeekday = true }: DayCellProps) {
  const isToday = day.isToday;
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(`${day.date}T00:00:00`));

  return (
    <button
      onClick={() => onClick(day.date)}
      className={cn(
        "relative aspect-square flex flex-col items-center justify-center p-0.5 md:p-2 transition-all border",
        "hover:border-muted-foreground focus:outline-none focus:border-primary",
        "bg-card border-border text-card-foreground",
        isToday && "border-primary"
      )}
    >
      {showWeekday && (
        <span className="absolute top-1 left-1 text-[9px] font-medium text-muted-foreground tracking-wider uppercase">
          {weekday}
        </span>
      )}
      <span className="text-[8px] md:text-[9px] font-medium text-muted-foreground tracking-wider uppercase text-center line-clamp-1 max-w-[90%] mb-1">
        {day.workoutName}
      </span>
      <span
        className={cn(
          "text-xs md:text-base font-semibold",
          isToday && "text-primary"
        )}
      >
        {day.day}
      </span>

      {(day.completed || day.isDeload) && (
        <div className="flex items-center gap-1 mt-0.5 md:mt-1">
          {day.completed && (
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />
          )}
          {day.isDeload && (
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 border border-accent" />
          )}
        </div>
      )}
    </button>
  );
}
