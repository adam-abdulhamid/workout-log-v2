"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronDown, ChevronRight, Clock3, Play, Save, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  STRETCHES,
  StretchDurationMap,
  StretchId,
  emptyStretchDurations,
  formatStretchDuration,
  totalStretchSeconds,
} from "@/lib/stretching";
import { cn } from "@/lib/utils";

interface StretchSummaryResponse {
  date: string;
  weekStart: string;
  weekEnd: string;
  today: { totalSeconds: number; byStretch: StretchDurationMap };
  week: { totalSeconds: number; byStretch: StretchDurationMap };
}

interface StretchTimerBlockProps {
  date: string;
  title?: string;
}

export function StretchTimerBlock({ date, title = "Daily Stretching" }: StretchTimerBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [totals, setTotals] = useState<StretchDurationMap>(emptyStretchDurations);
  const [savedTodayTotal, setSavedTodayTotal] = useState(0);
  const [savedWeekTotal, setSavedWeekTotal] = useState(0);
  const [activeStretch, setActiveStretch] = useState<StretchId | null>(null);
  const [activeStartedAt, setActiveStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stretch-time?date=${date}`);
      if (!response.ok) throw new Error("Failed to load stretch time");
      const data = (await response.json()) as StretchSummaryResponse;
      setTotals(data.today.byStretch);
      setSavedTodayTotal(data.today.totalSeconds);
      setSavedWeekTotal(data.week.totalSeconds);
      setSaveState("idle");
    } catch {
      setSaveState("error");
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setActiveStretch(null);
    setActiveStartedAt(null);
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!activeStretch) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [activeStretch]);

  const currentTotals = useCallback(
    (at = now) => {
      const next = { ...totals };
      if (activeStretch && activeStartedAt !== null) {
        next[activeStretch] += Math.max(0, Math.floor((at - activeStartedAt) / 1000));
      }
      return next;
    },
    [activeStretch, activeStartedAt, now, totals]
  );

  const displayedTotals = useMemo(() => currentTotals(now), [currentTotals, now]);
  const displayedTodayTotal = totalStretchSeconds(displayedTotals);
  const displayedWeekTotal = Math.max(0, savedWeekTotal - savedTodayTotal + displayedTodayTotal);
  const hasUnsavedChanges = displayedTodayTotal !== savedTodayTotal;

  function toggleTimer(stretchId: StretchId) {
    const timestamp = Date.now();
    const committed = currentTotals(timestamp);
    setTotals(committed);
    setSaveState("idle");

    if (activeStretch === stretchId) {
      setActiveStretch(null);
      setActiveStartedAt(null);
      return;
    }

    setActiveStretch(stretchId);
    setActiveStartedAt(timestamp);
    setNow(timestamp);
  }

  async function saveTotals() {
    const timestamp = Date.now();
    const nextTotals = currentTotals(timestamp);
    setTotals(nextTotals);
    setActiveStretch(null);
    setActiveStartedAt(null);
    setIsSaving(true);
    setSaveState("idle");

    try {
      const response = await fetch("/api/stretch-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          entries: STRETCHES.map((stretch) => ({
            stretchId: stretch.id,
            durationSeconds: nextTotals[stretch.id],
          })),
        }),
      });
      if (!response.ok) throw new Error("Failed to save stretch time");
      const nextTodayTotal = totalStretchSeconds(nextTotals);
      setSavedWeekTotal((previous) => Math.max(0, previous - savedTodayTotal + nextTodayTotal));
      setSavedTodayTotal(nextTodayTotal);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden py-0 border-orange-500/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-6 transition-colors hover:bg-accent/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <Clock3 className="h-4 w-4 text-orange-400" />
                <CardTitle className="text-lg">{title.replace(/\s*\(Week \d+\)$/, "")}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
                <Badge variant="outline">Today {formatStretchDuration(displayedTodayTotal)}</Badge>
                <Badge variant="secondary">Week {formatStretchDuration(displayedWeekTotal)}</Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pb-6 pt-0">
            <div className="rounded-lg border border-border bg-muted/10 p-3 text-xs text-muted-foreground">
              Start one stretch at a time. Starting another automatically stops the current timer.
              Save when the stretching block is finished.
            </div>

            <div className="space-y-2">
              {STRETCHES.map((stretch) => {
                const isActive = activeStretch === stretch.id;
                return (
                  <div
                    key={stretch.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
                      isActive && "border-orange-500/60 bg-orange-500/5"
                    )}
                  >
                    <div>
                      <div className="font-medium">{stretch.name}</div>
                      <div className="mt-1 font-mono text-lg tabular-nums">
                        {formatStretchDuration(displayedTotals[stretch.id])}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={isActive ? "destructive" : "outline"}
                      onClick={() => toggleTimer(stretch.id)}
                      disabled={isLoading || isSaving}
                      className="sm:min-w-28"
                    >
                      {isActive ? (
                        <><Square className="mr-2 h-4 w-4" />Stop</>
                      ) : (
                        <><Play className="mr-2 h-4 w-4" />Start</>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {saveState === "saved" && "Stretch time saved."}
                {saveState === "error" && "Stretch time could not be loaded or saved. Try again."}
                {saveState === "idle" && hasUnsavedChanges && "You have unsaved stretch time."}
                {saveState === "idle" && !hasUnsavedChanges && !isLoading && "All stretch time is saved."}
              </div>
              <div className="flex gap-2">
                <Button asChild type="button" variant="ghost">
                  <Link href="/dashboard/stretching">
                    <BarChart3 className="mr-2 h-4 w-4" />View trends
                  </Link>
                </Button>
                <Button type="button" onClick={saveTotals} disabled={isLoading || isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save stretch time"}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
