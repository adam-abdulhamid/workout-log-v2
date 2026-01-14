"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Copy } from "lucide-react";
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
      const res = await fetch(`/api/blocks/${blockId}`);
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
      await fetch(`/api/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description }),
      });

      // Update each week's exercises
      for (let weekNum = 1; weekNum <= 6; weekNum++) {
        await fetch(`/api/blocks/${blockId}/week/${weekNum}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: weekNotes[weekNum] || "",
            exercises: weekExercises[weekNum] || [],
          }),
        });
      }

      // Reload to get updated data
      await loadBlock();
    } catch (error) {
      console.error("Failed to save block:", error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <h1 className="text-2xl font-bold">Edit Block: {block.name}</h1>
        </div>
        <Button onClick={saveBlock} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
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

                {/* Exercises table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Exercise</TableHead>
                      <TableHead className="w-16">Sets</TableHead>
                      <TableHead className="w-20">Reps</TableHead>
                      <TableHead className="w-20">Tempo</TableHead>
                      <TableHead className="w-24">Rest</TableHead>
                      <TableHead className="w-8"></TableHead>
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
    </div>
  );
}
