"use client";

import { CalendarDay } from "@/types/workout";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  days: CalendarDay[];
  onDayClick: (date: string) => void;
}

const dayColors = [
  "bg-[#1a1f1e]",
  "bg-[#1e2423]",
  "bg-[#1c2120]",
  "bg-[#1f2625]",
  "bg-[#1d2221]",
  "bg-[#1a1e1d]",
  "bg-[#1e2322]",
];

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

export function WeekView({ days, onDayClick }: WeekViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {days.map((day) => {
          const dateLabel = dayFormatter.format(new Date(`${day.date}T00:00:00`));
          return (
            <div
              key={`label-${day.date}`}
              className="text-center text-[10px] font-medium text-muted-foreground tracking-wider uppercase"
            >
              {dateLabel}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {days.map((day, index) => (
          <button
            key={day.date}
            onClick={() => onDayClick(day.date)}
            className={cn(
              "relative flex flex-col items-center border border-border p-2 md:p-4 transition-all hover:border-muted-foreground focus:outline-none focus:border-primary",
              dayColors[index % dayColors.length],
              day.isToday && "border-primary"
            )}
          >
            <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground tracking-wider uppercase text-center line-clamp-1">
              {day.workoutName}
            </span>

            <span
              className={cn(
                "text-2xl md:text-4xl lg:text-5xl font-bold",
                day.isToday ? "text-primary" : "text-foreground"
              )}
            >
              {day.day}
            </span>

            <div className="flex items-center gap-1 mt-2 md:mt-4">
              {day.completed && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary" />
              )}
              {day.isDeload && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 border border-accent" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
