"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { CalendarDay } from "@/types/workout";
import { formatDate, isToday as checkIsToday, parseDate } from "@/lib/workout-cycle";

type ViewMode = "week" | "month";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarView() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [weekStart, setWeekStart] = useState<string>("");
  const [weekEnd, setWeekEnd] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  async function loadCalendarData() {
    setLoading(true);
    try {
      if (viewMode === "week") {
        const dateStr = formatDate(currentDate);
        const res = await fetch(`/api/calendar/week/${dateStr}`);
        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const daysWithToday = data.days.map((day: any) => ({
          ...day,
          workoutName: day.workoutDay || day.workoutName || "Rest",
          isToday: checkIsToday(parseDate(day.date)),
        }));

        setDays(daysWithToday);
        setWeekStart(data.weekStart);
        setWeekEnd(data.weekEnd);
      } else {
        const res = await fetch(`/api/calendar/${year}/${month}`);
        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const daysWithToday = data.map((day: any) => ({
          ...day,
          workoutName: day.workoutDay || day.workoutName || "Rest",
          isToday: checkIsToday(parseDate(day.date)),
        }));

        setDays(daysWithToday);
      }
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setLoading(false);
    }
  }

  function navigatePrevious() {
    if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(year, month - 2, 1);
      setCurrentDate(newDate);
    }
  }

  function navigateNext() {
    if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(year, month, 1);
      setCurrentDate(newDate);
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleDayClick(date: string) {
    router.push(`/workout/${date}`);
  }

  function formatWeekRange(): string {
    if (!weekStart || !weekEnd) return "";
    const start = parseDate(weekStart);
    const end = parseDate(weekEnd);
    const startMonth = MONTH_NAMES[start.getMonth()];
    const endMonth = MONTH_NAMES[end.getMonth()];

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-wider uppercase">
        Workout Calendar
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigatePrevious}
            className="w-9 h-9 border-border bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous {viewMode}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={navigateNext}
            className="w-9 h-9 border-border bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next {viewMode}</span>
          </Button>
          <Button
            variant="outline"
            onClick={goToToday}
            className="px-4 border-border text-xs tracking-wider uppercase bg-transparent"
          >
            Today
          </Button>
        </div>

        <h2 className="text-base font-medium text-muted-foreground text-center sm:text-left order-first sm:order-none tracking-wide">
          {viewMode === "week"
            ? formatWeekRange()
            : `${MONTH_NAMES[month - 1]} ${year}`}
        </h2>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="bg-transparent border border-border p-0.5">
            <TabsTrigger
              value="week"
              className="data-[state=active]:bg-card text-xs tracking-wider uppercase px-4"
            >
              Week
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="data-[state=active]:bg-card text-xs tracking-wider uppercase px-4"
            >
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-muted-foreground text-xs tracking-wider uppercase">
            Loading...
          </div>
        </div>
      ) : viewMode === "week" ? (
        <WeekView days={days} onDayClick={handleDayClick} />
      ) : (
        <MonthView
          days={days}
          year={year}
          month={month}
          onDayClick={handleDayClick}
        />
      )}

      <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 border border-accent" />
          <span>Deload</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
