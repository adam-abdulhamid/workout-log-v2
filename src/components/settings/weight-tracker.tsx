"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WeightEntry = {
  id: string;
  date: string;
  weightLb: number;
};

type RangeKey = "30d" | "90d" | "1y" | "all";

const RANGE_LABELS: Record<RangeKey, string> = {
  "30d": "30 days",
  "90d": "90 days",
  "1y": "1 year",
  all: "All",
};

const LB_PER_KG = 2.2;

function toKg(lb: number) {
  return lb / LB_PER_KG;
}

function toLb(kg: number) {
  return kg * LB_PER_KG;
}

function formatWeight(value: number, unit: "lb" | "kg") {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}`;
}

function formatWeightWithUnit(value: number, unit: "lb" | "kg") {
  return `${formatWeight(value, unit)} ${unit}`;
}

function getDaysForRange(range: RangeKey): number | null {
  if (range === "all") return null;
  return range === "30d" ? 30 : range === "90d" ? 90 : 365;
}

function getDateRange(range: RangeKey, entries: WeightEntry[]): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  const days = getDaysForRange(range);
  if (days !== null) {
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  
  // For "all", use the earliest entry date to today
  if (entries.length === 0) {
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return { start, end };
  }
  
  const sortedDates = entries
    .map((e) => new Date(e.date).getTime())
    .sort((a, b) => a - b);
  
  return { 
    start: new Date(sortedDates[0]), 
    end 
  };
}

function getCutoff(range: RangeKey, now: Date) {
  if (range === "all") return null;
  const days = getDaysForRange(range) ?? 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function WeightTracker() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [range, setRange] = useState<RangeKey>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weight-entries");
      if (!res.ok) {
        throw new Error("Failed to load weigh-ins.");
      }
      const data = (await res.json()) as WeightEntry[];
      setEntries(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weigh-ins.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const cutoff = getCutoff(range, now);
    return sortedEntries
      .filter((entry) => {
        if (!cutoff) return true;
        return new Date(entry.date) >= cutoff;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sortedEntries, range]);

  const stats = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    const weights = filteredEntries.map((entry) => entry.weightLb);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    // Add padding to the range (10 lb buffer on each side, or at least 5% of range)
    const weightRange = max - min;
    const padding = Math.max(5, weightRange * 0.1);
    return { 
      min, 
      max,
      paddedMin: min - padding,
      paddedMax: max + padding,
    };
  }, [filteredEntries]);

  // Calculate the date range for the x-axis based on selected range option
  const dateRange = useMemo(() => {
    return getDateRange(range, entries);
  }, [range, entries]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(weightInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const weightLb = unit === "lb" ? parsed : toLb(parsed);
    try {
      const res = await fetch("/api/weight-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightLb, date: new Date().toISOString() }),
      });
      if (!res.ok) {
        throw new Error("Failed to save weigh-in.");
      }
      const entry = (await res.json()) as WeightEntry;
      setEntries((prev) => [...prev, entry]);
      setWeightInput("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weigh-in.");
    }
  }

  // Horizontal padding for the chart (percentage of width on each side)
  const CHART_PADDING = 0.03; // 3% padding on each side

  const chartPoints = useMemo(() => {
    if (filteredEntries.length === 0 || !stats) return [];
    
    // Use the fixed date range based on selected option
    const minDate = dateRange.start.getTime();
    const maxDate = dateRange.end.getTime();
    const span = Math.max(maxDate - minDate, 1);
    
    const weightSpan = Math.max(stats.paddedMax - stats.paddedMin, 1);

    return filteredEntries.map((entry) => {
      // Calculate raw x position (0 to 1)
      const rawX = (new Date(entry.date).getTime() - minDate) / span;
      // Apply padding: map [0, 1] to [CHART_PADDING, 1 - CHART_PADDING]
      const x = CHART_PADDING + rawX * (1 - 2 * CHART_PADDING);
      const y = 1 - (entry.weightLb - stats.paddedMin) / weightSpan;
      return { x, y, weight: entry.weightLb, date: entry.date };
    });
  }, [filteredEntries, stats, dateRange]);

  const latestEntry = sortedEntries.length ? sortedEntries[sortedEntries.length - 1] : null;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>Weight Tracking</CardTitle>
          <CardDescription>Log weigh-ins and view your progress.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              Weigh-in
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                placeholder={unit === "lb" ? "180" : "82"}
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "px-3 text-xs uppercase tracking-wider",
                    unit === "lb" && "bg-card text-foreground border-border"
                  )}
                  onClick={() => setUnit("lb")}
                >
                  lb
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "px-3 text-xs uppercase tracking-wider",
                    unit === "kg" && "bg-card text-foreground border-border"
                  )}
                  onClick={() => setUnit("kg")}
                >
                  kg
                </Button>
              </div>
            </div>
          </div>
          <Button type="submit" className="sm:self-end">
            Log weigh-in
          </Button>
        </form>

        {error && (
          <div className="text-xs uppercase tracking-wider text-destructive">
            {error}
          </div>
        )}

        {latestEntry ? (
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Latest:{" "}
            <span className="text-foreground">
              {formatWeightWithUnit(unit === "lb" ? latestEntry.weightLb : toKg(latestEntry.weightLb), unit)}
            </span>{" "}
            on{" "}
            {new Date(latestEntry.date).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        ) : (
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            No weigh-ins yet.
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className={cn(
                  "text-xs uppercase tracking-wider",
                  range === key && "bg-card text-foreground border-border"
                )}
                onClick={() => setRange(key)}
              >
                {RANGE_LABELS[key]}
              </Button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-4">
            {isLoading ? (
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Loading weigh-ins...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                No data for this range.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Chart with Y-axis on the left */}
                <div className="flex gap-3">
                  {/* Y-axis labels */}
                  {stats && (
                    <div className="flex flex-col justify-between text-[10px] uppercase tracking-wider text-muted-foreground py-1 min-w-[3rem] text-right">
                      <span>
                        {formatWeight(
                          unit === "lb" ? stats.paddedMax : toKg(stats.paddedMax),
                          unit
                        )}
                      </span>
                      <span>
                        {formatWeight(
                          unit === "lb" 
                            ? (stats.paddedMax + stats.paddedMin) / 2 
                            : toKg((stats.paddedMax + stats.paddedMin) / 2),
                          unit
                        )}
                      </span>
                      <span>
                        {formatWeight(
                          unit === "lb" ? stats.paddedMin : toKg(stats.paddedMin),
                          unit
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Chart area */}
                  <div className="relative h-44 flex-1">
                    {/* SVG for grid lines and line chart */}
                    <svg 
                      viewBox="0 0 100 40" 
                      className="absolute inset-0 h-full w-full"
                      preserveAspectRatio="none"
                    >
                      {/* Horizontal grid lines */}
                      <g className="text-border">
                        {[0, 10, 20, 30, 40].map((y) => (
                          <line
                            key={`grid-h-${y}`}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="currentColor"
                            strokeWidth="1"
                            opacity="0.4"
                            vectorEffect="non-scaling-stroke"
                          />
                        ))}
                      </g>
                      
                      {/* Line chart */}
                      {chartPoints.length > 1 && (
                        <polyline
                          points={chartPoints
                            .map((point) => `${point.x * 100},${point.y * 40}`)
                            .join(" ")}
                          fill="none"
                          stroke="currentColor"
                          className="text-primary"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                    </svg>
                    
                    {/* Data points as HTML elements (to avoid SVG stretching) */}
                    {chartPoints.map((point, index) => (
                      <div
                        key={`point-${index}`}
                        className="absolute w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${point.x * 100}%`,
                          top: `${point.y * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* X-axis labels - show full range based on selected option */}
                <div className="flex gap-3">
                  {/* Spacer for y-axis alignment */}
                  <div className="min-w-[3rem]" />
                  
                  <div className="flex-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>
                      {dateRange.start.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-muted-foreground/60">
                      {range === "all" ? "All time" : RANGE_LABELS[range]}
                    </span>
                    <span>
                      {dateRange.end.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
      </CardContent>
    </Card>
  );
}
