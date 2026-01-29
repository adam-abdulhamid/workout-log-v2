"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Save, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlockCard } from "./block-card";
import {
  WorkoutData,
  ExerciseLogEntry,
  BlockNoteEntry,
  WorkoutLogPayload,
} from "@/types/workout";

interface WorkoutPageProps {
  date: string;
}

export function WorkoutPage({ date }: WorkoutPageProps) {
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Exercise logs indexed by exercise ID
  const [exerciseLogs, setExerciseLogs] = useState<
    Record<string, ExerciseLogEntry[]>
  >({});

  // Block notes indexed by block ID
  const [blockNotes, setBlockNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadWorkout();
  }, [date]);

  async function loadWorkout() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workout/${date}`);
      if (res.ok) {
        const data: WorkoutData = await res.json();
        setWorkout(data);

        // Initialize block notes from existing data
        const notes: Record<string, string> = {};
        for (const block of data.blocks) {
          notes[block.id] = block.existingNote || "";
        }
        setBlockNotes(notes);

        // If workout is not completed, enable editing by default
        if (!data.isCompleted) {
          setIsEditing(true);
        }
      }
    } catch (error) {
      console.error("Failed to load workout:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleExerciseLogsChange = useCallback(
    (exerciseId: string, logs: ExerciseLogEntry[]) => {
      setExerciseLogs((prev) => ({
        ...prev,
        [exerciseId]: logs,
      }));
    },
    []
  );

  const handleBlockNoteChange = useCallback((blockId: string, note: string) => {
    setBlockNotes((prev) => ({
      ...prev,
      [blockId]: note,
    }));
  }, []);

  async function saveWorkout(markComplete: boolean) {
    if (!workout) return;

    setSaving(true);
    try {
      // Collect all exercise logs
      const allExerciseLogs: ExerciseLogEntry[] = [];
      for (const logs of Object.values(exerciseLogs)) {
        allExerciseLogs.push(...logs);
      }

      // Collect block notes
      const allBlockNotes: BlockNoteEntry[] = [];
      for (const [blockId, notes] of Object.entries(blockNotes)) {
        if (notes.trim()) {
          allBlockNotes.push({ blockId, notes: notes.trim() });
        }
      }

      const payload: WorkoutLogPayload = {
        exercises: allExerciseLogs,
        blockNotes: allBlockNotes,
        completed: markComplete,
      };

      const res = await fetch(`/api/workout/${date}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (markComplete) {
          // Reload workout to get updated state when completing
          await loadWorkout();
          setIsEditing(false);
        } else {
          // Show success indicator without reloading
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Loading workout...
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Workout not found for this date.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const disabled = workout.isCompleted && !isEditing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/calendar")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Calendar
          </Button>
          <h1 className="text-2xl font-bold">{workout.dayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {workout.isDeload && (
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                Deload Week
              </Badge>
            )}
            {workout.isCompleted && (
              <Badge className="bg-green-500/20 text-green-500">
                Completed
              </Badge>
            )}
          </div>
        </div>

        {/* Edit button for completed workouts */}
        {workout.isCompleted && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {workout.blocks.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            exerciseLogs={exerciseLogs}
            blockNote={blockNotes[block.id] || ""}
            onExerciseLogsChange={handleExerciseLogsChange}
            onBlockNoteChange={handleBlockNoteChange}
            disabled={disabled}
            defaultOpen={index === 0}
          />
        ))}
      </div>

      {/* Action Buttons */}
      {(isEditing || !workout.isCompleted) && (
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background p-4 border-t border-border -mx-4 mt-8">
          <Button
            variant="outline"
            onClick={() => saveWorkout(false)}
            disabled={saving}
            className={saveSuccess ? "border-green-500 text-green-500" : ""}
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Progress"}
              </>
            )}
          </Button>
          <Button
            onClick={() => saveWorkout(true)}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Mark Complete"}
          </Button>
        </div>
      )}
    </div>
  );
}
