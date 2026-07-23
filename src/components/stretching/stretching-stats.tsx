"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  STRETCHES,
  StretchDurationMap,
  addDays,
  emptyStretchDurations,
  formatStretchDuration,
} from "@/lib/stretching";
import { cn } from "@/lib/utils";

type RangeWeeks = 4 | 12 | 26;

interface StretchStatsResponse {
  startDate: string;
  endDate: string;
  totalSeconds: number;
  byStretch: StretchDurationMap;
  daily: Array<{ date: string; totalSeconds: number; byStretch: StretchDurationMap }>;
  weekly: Array<{
    weekStart: string;
    weekEnd: string;
    totalSeconds: number;
    byStretch: StretchDurationMap;
  }>;
}

function localDateString() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function shortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function StretchingStats() {
  const [weeks, setWeeks] = useState<RangeWeeks>(12);
  const [data, setData] = useState<StretchStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stretch-time/stats?weeks=${weeks}&endDate=${localDateString()}`
      );
      if (!response.ok) throw new Error("Failed to load stretching statistics.");
      setData((await response.json()) as StretchStatsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stretching statistics.");
    } finally {
      setIsLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const maxWeeklySeconds = useMemo(
    () => Math.max(1, ...(data?.weekly.map((week) => week.totalSeconds) ?? [1])),
    [data]
  );
  const recentDaily = useMemo(() => {
    if (!data) return [];
    const dailyMap = new Map(data.daily.map((day) => [day.date, day]));
    return Array.from({ length: 14 }, (_, index) => {
      const date = addDays(data.endDate, index - 13);
      return (
        dailyMap.get(date) ?? {
          date,
          totalSeconds: 0,
          byStretch: emptyStretchDurations(),
        }
      );
    });
  }, [data]);
  const maxDailySeconds = useMemo(
    () => Math.max(1, ...recentDaily.map((day) => day.totalSeconds)),
    [recentDaily]
  );
  const maxStretchSeconds = useMemo(
    () => Math.max(1, ...(data ? STRETCHES.map((stretch) => data.byStretch[stretch.id]) : [1])),
    [data]
  );
  const averageWeeklySeconds = data?.weekly.length
    ? Math.round(data.weekly.reduce((sum, week) => sum + week.totalSeconds, 0) / data.weekly.length)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stretching Statistics</CardTitle>
          <CardDescription>Review cumulative time and consistency across all five stretches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {([4, 12, 26] as RangeWeeks[]).map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                onClick={() => setWeeks(value)}
                className={cn(
                  "text-xs uppercase tracking-wider",
                  weeks === value && "border-primary bg-card text-foreground"
                )}
              >
                {value} weeks
              </Button>
            ))}
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading stretch time...</div>
          ) : data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Range total</div>
                  <div className="mt-2 text-2xl font-semibold">{formatStretchDuration(data.totalSeconds)}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Weekly average</div>
                  <div className="mt-2 text-2xl font-semibold">{formatStretchDuration(averageWeeklySeconds)}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Days recorded</div>
                  <div className="mt-2 text-2xl font-semibold">{data.daily.length}</div>
                </div>
              </div>

              <section className="space-y-3">
                <div>
                  <h2 className="font-semibold">Weekly trend</h2>
                  <p className="text-sm text-muted-foreground">Total saved stretch time per Monday–Sunday week.</p>
                </div>
                <div className="flex h-56 items-end gap-2 overflow-x-auto rounded-lg border border-border bg-muted/10 p-4">
                  {data.weekly.map((week) => (
                    <div key={week.weekStart} className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2">
                      <div className="text-[10px] text-muted-foreground">{formatStretchDuration(week.totalSeconds)}</div>
                      <div className="flex h-36 w-full items-end rounded-sm bg-muted/30">
                        <div
                          className="w-full rounded-sm bg-primary transition-all"
                          style={{ height: `${Math.max(week.totalSeconds ? 4 : 0, (week.totalSeconds / maxWeeklySeconds) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground">{shortDate(week.weekStart)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h2 className="font-semibold">Daily trend</h2>
                  <p className="text-sm text-muted-foreground">The most recent 14 calendar days, including days with no saved time.</p>
                </div>
                <div className="flex h-48 items-end gap-1.5 overflow-x-auto rounded-lg border border-border bg-muted/10 p-4">
                  {recentDaily.map((day) => (
                    <div key={day.date} className="flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-2">
                      <div className="flex h-28 w-full items-end rounded-sm bg-muted/30">
                        <div
                          className="w-full rounded-sm bg-orange-400 transition-all"
                          style={{ height: `${Math.max(day.totalSeconds ? 4 : 0, (day.totalSeconds / maxDailySeconds) * 100)}%` }}
                          title={`${shortDate(day.date)}: ${formatStretchDuration(day.totalSeconds)}`}
                        />
                      </div>
                      <div className="text-[9px] text-muted-foreground">{shortDate(day.date)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h2 className="font-semibold">Breakdown by stretch</h2>
                  <p className="text-sm text-muted-foreground">Cumulative time within the selected range.</p>
                </div>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  {STRETCHES.map((stretch) => {
                    const seconds = data.byStretch?.[stretch.id] ?? emptyStretchDurations()[stretch.id];
                    return (
                      <div key={stretch.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span>{stretch.name}</span>
                          <span className="font-mono text-muted-foreground">{formatStretchDuration(seconds)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-orange-400"
                            style={{ width: `${(seconds / maxStretchSeconds) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
