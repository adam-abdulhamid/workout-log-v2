"use client";

import { useState, memo } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetInput } from "./set-input";
import { HistoryModal } from "./history-modal";
import { WorkoutExercise, ExerciseLogEntry } from "@/types/workout";
import { cn } from "@/lib/utils";

interface ExerciseRowProps {
  exercise: WorkoutExercise;
  logs: ExerciseLogEntry[];
  onLogChange: (logs: ExerciseLogEntry[]) => void;
  disabled?: boolean;
}

export const ExerciseRow = memo(function ExerciseRow({
  exercise,
  logs,
  onLogChange,
  disabled = false,
}: ExerciseRowProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const numSets = exercise.sets || 1;

  function handleSetChange(
    setNumber: number,
    field: "reps" | "weight",
    value: number | null
  ) {
    const existingLog = logs.find((l) => l.setNumber === setNumber);
    let newLogs: ExerciseLogEntry[];

    if (existingLog) {
      newLogs = logs.map((l) =>
        l.setNumber === setNumber ? { ...l, [field]: value } : l
      );
    } else {
      newLogs = [
        ...logs,
        {
          exerciseId: exercise.id,
          setNumber,
          reps: field === "reps" ? value : null,
          weight: field === "weight" ? value : null,
        },
      ];
    }

    onLogChange(newLogs);
  }

  function getLogForSet(setNumber: number): ExerciseLogEntry | undefined {
    return logs.find((l) => l.setNumber === setNumber);
  }

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      {/* Exercise header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium">{exercise.name}</div>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
            {exercise.sets && <span>{exercise.sets} sets</span>}
            {exercise.reps && <span>× {exercise.reps} reps</span>}
            {exercise.tempo && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {exercise.tempo}
              </span>
            )}
            {exercise.rest && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                Rest: {exercise.rest}
              </span>
            )}
          </div>
          {exercise.weightGuidance && (
            <div className="text-sm text-primary mt-1">
              {exercise.weightGuidance}
            </div>
          )}
          {exercise.notes && (
            <div className="text-sm text-muted-foreground mt-1 italic">
              {exercise.notes}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </div>

      {/* Set inputs */}
      <div className={cn("space-y-2", disabled && "opacity-60")}>
        {Array.from({ length: numSets }, (_, i) => i + 1).map((setNumber) => {
          const log = getLogForSet(setNumber);
          return (
            <SetInput
              key={setNumber}
              setNumber={setNumber}
              reps={log?.reps ?? null}
              weight={log?.weight ?? null}
              onRepsChange={(reps) => handleSetChange(setNumber, "reps", reps)}
              onWeightChange={(weight) =>
                handleSetChange(setNumber, "weight", weight)
              }
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* History Modal */}
      <HistoryModal
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
});
