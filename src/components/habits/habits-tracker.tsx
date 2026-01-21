"use client";

import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, X } from "lucide-react";

type Habit = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
};

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export function HabitsTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState("");

  const today = getTodayString();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [habitsRes, completionsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/habit-completions?date=${today}`),
      ]);

      if (!habitsRes.ok || !completionsRes.ok) {
        throw new Error("Failed to load habits.");
      }

      const habitsData = (await habitsRes.json()) as Habit[];
      const completionsData = (await completionsRes.json()) as HabitCompletion[];

      setHabits(habitsData ?? []);
      setCompletions(completionsData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load habits.");
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isCompleted = (habitId: string) => {
    return completions.some((c) => c.habitId === habitId);
  };

  const handleToggle = async (habitId: string) => {
    try {
      const res = await fetch("/api/habit-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today }),
      });

      if (!res.ok) {
        throw new Error("Failed to update habit.");
      }

      const data = await res.json();

      if (data.completed) {
        setCompletions((prev) => [...prev, data.completion]);
      } else {
        setCompletions((prev) => prev.filter((c) => c.habitId !== habitId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update habit.");
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error("Failed to add habit.");
      }

      const habit = (await res.json()) as Habit;
      setHabits((prev) => [...prev, habit]);
      setNewHabitName("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add habit.");
    }
  };

  const handleEditHabit = async () => {
    if (!editingHabit || !editName.trim()) return;

    try {
      const res = await fetch(`/api/habits/${editingHabit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to update habit.");
      }

      const updated = (await res.json()) as Habit;
      setHabits((prev) =>
        prev.map((h) => (h.id === updated.id ? updated : h))
      );
      setEditingHabit(null);
      setEditName("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update habit.");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete habit.");
      }

      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setCompletions((prev) => prev.filter((c) => c.habitId !== habitId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete habit.");
    }
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
  };

  const completedCount = completions.length;
  const totalCount = habits.length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Daily Habits</CardTitle>
              <CardDescription>
                {totalCount > 0
                  ? `${completedCount} of ${totalCount} completed today`
                  : "Track your daily habits"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs uppercase tracking-wider"
              onClick={() => setIsManaging(!isManaging)}
            >
              {isManaging ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <Pencil className="h-3 w-3 mr-1" />
                  Manage
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-xs uppercase tracking-wider text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Loading habits...
            </div>
          ) : habits.length === 0 ? (
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              No habits yet. Add one below.
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
                >
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <Checkbox
                      checked={isCompleted(habit.id)}
                      onCheckedChange={() => handleToggle(habit.id)}
                      disabled={isManaging}
                    />
                    <span
                      className={
                        isCompleted(habit.id)
                          ? "text-muted-foreground line-through"
                          : ""
                      }
                    >
                      {habit.name}
                    </span>
                  </label>

                  {isManaging && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(habit)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteHabit(habit.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isManaging && (
            <form onSubmit={handleAddHabit} className="flex gap-2">
              <Input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="New habit name..."
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingHabit !== null}
        onOpenChange={(open) => !open && setEditingHabit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditHabit();
            }}
            className="space-y-4"
          >
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Habit name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingHabit(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
