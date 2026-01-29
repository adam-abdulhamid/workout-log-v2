"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BlockDetail, BLOCK_CATEGORIES, WorkoutExercise } from "@/types/workout";

interface BlockEditorProps {
  blockId: string;
}

export function BlockEditor({ blockId }: BlockEditorProps) {
  const router = useRouter();
  const [block, setBlock] = useState<BlockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeWeek, setActiveWeek] = useState("1");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMarkdown, setImportMarkdown] = useState("");
  const [importing, setImporting] = useState(false);
  const [deletedExercises, setDeletedExercises] = useState<Record<number, string[]>>({});

  // Edited values
  const [name, setName] = useState("");
  const [category, setCategory] = useState("strength");
  const [description, setDescription] = useState("");
  const [weekNotes, setWeekNotes] = useState<Record<number, string>>({});
  const [weekExercises, setWeekExercises] = useState<
    Record<number, WorkoutExercise[]>
  >({});

  useEffect(() => {
    loadBlock();
  }, [blockId]);

  async function loadBlock() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blocks/${blockId}`, { cache: "no-store" });
      if (res.ok) {
        const data: BlockDetail = await res.json();
        setBlock(data);
        setName(data.name);
        setCategory(data.category || "strength");
        setDescription(data.description || "");

        // Initialize week data
        const notes: Record<number, string> = {};
        const exercises: Record<number, WorkoutExercise[]> = {};
        for (const week of data.weeks) {
          notes[week.weekNumber] = week.notes || "";
          exercises[week.weekNumber] = week.exercises;
        }
        setWeekNotes(notes);
        setWeekExercises(exercises);
        setDeletedExercises({});
      }
    } catch (error) {
      console.error("Failed to load block:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveBlock() {
    setSaving(true);
    try {
      // Update block metadata
      const metaRes = await fetch(`/api/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description }),
      });
      if (!metaRes.ok) {
        const error = await metaRes.json();
        alert(`Failed to save block metadata: ${error.error || "Unknown error"}`);
        return;
      }

      // Update each week's exercises
      for (let weekNum = 1; weekNum <= 6; weekNum++) {
        // Strip IDs from new exercises so API creates them instead of trying to update
        const exercises = (weekExercises[weekNum] || []).map((ex) => ({
          ...ex,
          id: ex.id?.startsWith("new-") ? undefined : ex.id,
        }));
        const weekRes = await fetch(`/api/blocks/${blockId}/week/${weekNum}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: weekNotes[weekNum] || "",
            exercises,
            deletedExercises: deletedExercises[weekNum] || [],
          }),
        });
        if (!weekRes.ok) {
          const error = await weekRes.json();
          alert(`Failed to save week ${weekNum}: ${error.error || "Unknown error"}`);
          return;
        }
      }

      // Clear deleted exercises tracking and reload
      setDeletedExercises({});
      await loadBlock();
    } catch (error) {
      console.error("Failed to save block:", error);
      alert(`Failed to save block: ${error}`);
    } finally {
      setSaving(false);
    }
  }

  async function copyWeek() {
    if (copyTargets.length === 0) return;

    try {
      await fetch(`/api/blocks/${blockId}/copy-week`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWeek: parseInt(activeWeek),
          targetWeeks: copyTargets,
        }),
      });

      setCopyDialogOpen(false);
      setCopyTargets([]);
      await loadBlock();
    } catch (error) {
      console.error("Failed to copy week:", error);
    }
  }

  async function exportBlock() {
    try {
      const res = await fetch(`/api/blocks/${blockId}/export`);
      if (!res.ok) {
        const error = await res.json();
        alert(`Export failed: ${error.error || "Unknown error"}`);
        return;
      }
      const data = await res.json();

      // Try clipboard API first, fall back to download
      try {
        await navigator.clipboard.writeText(data.markdown);
        alert("Block exported to clipboard!");
      } catch (clipboardError) {
        // Clipboard failed (mobile, no focus, etc.) - download as file instead
        const blob = new Blob([data.markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.blockName || "block"}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export block:", error);
      alert("Failed to export block");
    }
  }

  async function importBlock() {
    if (!importMarkdown.trim()) return;

    setImporting(true);
    try {
      const res = await fetch(`/api/blocks/${blockId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: importMarkdown }),
      });

      if (res.ok) {
        const result = await res.json();
        setImportDialogOpen(false);
        setImportMarkdown("");
        await loadBlock();
        alert(`${result.message}`);
      } else {
        const error = await res.json();
        alert(`Import failed: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to import block:", error);
      alert("Failed to import block");
    } finally {
      setImporting(false);
    }
  }

  function addExercise(weekNum: number) {
    const exercises = weekExercises[weekNum] || [];
    const newExercise: WorkoutExercise = {
      id: `new-${Date.now()}`,
      order: exercises.length + 1,
      name: "",
      sets: 3,
      reps: "8-10",
      tempo: null,
      rest: null,
      weightGuidance: null,
      notes: null,
    };
    setWeekExercises((prev) => ({
      ...prev,
      [weekNum]: [...(prev[weekNum] || []), newExercise],
    }));
  }

  function updateExercise(
    weekNum: number,
    exerciseId: string,
    field: keyof WorkoutExercise,
    value: string | number | null
  ) {
    setWeekExercises((prev) => ({
      ...prev,
      [weekNum]: (prev[weekNum] || []).map((ex) =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      ),
    }));
  }

  function removeExercise(weekNum: number, exerciseId: string) {
    // Track deleted exercises (only if it's a real ID, not a new one)
    if (!exerciseId.startsWith("new-")) {
      setDeletedExercises((prev) => ({
        ...prev,
        [weekNum]: [...(prev[weekNum] || []), exerciseId],
      }));
    }
    setWeekExercises((prev) => ({
      ...prev,
      [weekNum]: (prev[weekNum] || []).filter((ex) => ex.id !== exerciseId),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Loading block...
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Block not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/blocks")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blocks
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            Edit Block: {block.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportBlock}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button onClick={saveBlock} disabled={saving} size="sm" className="ml-auto">
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save Changes"}</span>
            <span className="sm:hidden">{saving ? "..." : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Block Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Block Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {BLOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Week Exercises */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exercises by Week</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCopyDialogOpen(true)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Week {activeWeek}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeWeek} onValueChange={setActiveWeek}>
            <TabsList className="mb-4">
              {[1, 2, 3, 4, 5, 6].map((week) => (
                <TabsTrigger key={week} value={week.toString()}>
                  Week {week}
                </TabsTrigger>
              ))}
            </TabsList>

            {[1, 2, 3, 4, 5, 6].map((weekNum) => (
              <TabsContent key={weekNum} value={weekNum.toString()}>
                {/* Week notes */}
                <div className="mb-4 space-y-2">
                  <Label>Week Notes</Label>
                  <Textarea
                    value={weekNotes[weekNum] || ""}
                    onChange={(e) =>
                      setWeekNotes((prev) => ({
                        ...prev,
                        [weekNum]: e.target.value,
                      }))
                    }
                    placeholder="Notes for this week..."
                    rows={2}
                  />
                </div>

                {/* Exercises table - horizontally scrollable on mobile */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[150px]">Exercise</TableHead>
                        <TableHead className="w-16">Sets</TableHead>
                        <TableHead className="w-20">Reps</TableHead>
                        <TableHead className="w-20">Tempo</TableHead>
                        <TableHead className="w-24">Rest</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(weekExercises[weekNum] || []).map((exercise, index) => (
                        <TableRow key={exercise.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Input
                              value={exercise.name}
                              onChange={(e) =>
                                updateExercise(
                                  weekNum,
                                  exercise.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Exercise name"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={exercise.sets ?? ""}
                              onChange={(e) =>
                                updateExercise(
                                  weekNum,
                                  exercise.id,
                                  "sets",
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={exercise.reps ?? ""}
                              onChange={(e) =>
                                updateExercise(
                                  weekNum,
                                  exercise.id,
                                  "reps",
                                  e.target.value
                                )
                              }
                              placeholder="8-10"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={exercise.tempo ?? ""}
                              onChange={(e) =>
                                updateExercise(
                                  weekNum,
                                  exercise.id,
                                  "tempo",
                                  e.target.value
                                )
                              }
                              placeholder="3010"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={exercise.rest ?? ""}
                              onChange={(e) =>
                                updateExercise(
                                  weekNum,
                                  exercise.id,
                                  "rest",
                                  e.target.value
                                )
                              }
                              placeholder="2:00"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeExercise(weekNum, exercise.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addExercise(weekNum)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Copy Week Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Week {activeWeek} to...</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select which weeks to copy the exercises to:
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6]
                .filter((w) => w !== parseInt(activeWeek))
                .map((week) => (
                  <Button
                    key={week}
                    variant={copyTargets.includes(week) ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setCopyTargets((prev) =>
                        prev.includes(week)
                          ? prev.filter((w) => w !== week)
                          : [...prev, week]
                      )
                    }
                  >
                    Week {week}
                  </Button>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={copyWeek} disabled={copyTargets.length === 0}>
              Copy to {copyTargets.length} Week(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Block from Markdown</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Paste the markdown content below. This will replace the existing exercises in the block.
            </p>
            <Textarea
              value={importMarkdown}
              onChange={(e) => setImportMarkdown(e.target.value)}
              placeholder={`# Block: ${block.name}

**Category:** ${category}
**Description:** ${description}

## Week 1

| # | Exercise | Sets | Reps | Tempo | Rest | Notes |
|---|----------|------|------|-------|------|-------|
| 1 | Bench Press | 4 | 6-8 | 3010 | 2:00 | |`}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={importBlock} disabled={importing || !importMarkdown.trim()}>
              {importing ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
