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
    <div className="space-y-4">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
            className="sm:hidden"
          >
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <h2 className="text-base sm:text-xl font-semibold text-center sm:text-left order-first sm:order-none">
          {viewMode === "week"
            ? formatWeekRange()
            : `${MONTH_NAMES[month - 1]} ${year}`}
        </h2>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
          className="hidden sm:block"
        >
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
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
    </div>
  );
}
