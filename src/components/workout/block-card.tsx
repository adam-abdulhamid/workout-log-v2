"use client";

import { useState, memo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExerciseRow } from "./exercise-row";
import { WorkoutBlock, ExerciseLogEntry } from "@/types/workout";
import { cn } from "@/lib/utils";

interface BlockCardProps {
  block: WorkoutBlock;
  exerciseLogs: Record<string, ExerciseLogEntry[]>;
  blockNote: string;
  onExerciseLogsChange: (exerciseId: string, logs: ExerciseLogEntry[]) => void;
  onBlockNoteChange: (blockId: string, note: string) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export const BlockCard = memo(function BlockCard({
  block,
  exerciseLogs,
  blockNote,
  onExerciseLogsChange,
  onBlockNoteChange,
  disabled = false,
  defaultOpen = false,
}: BlockCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden py-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <CardTitle className="text-lg">{block.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                {block.category && (
                  <Badge variant="secondary" className="text-xs">
                    {block.category}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {block.exercises.length} exercises
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            {block.exercises.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No exercises for this week.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Exercises */}
                {block.exercises.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    logs={exerciseLogs[exercise.id] || []}
                    onLogChange={(logs) => onExerciseLogsChange(exercise.id, logs)}
                    disabled={disabled}
                  />
                ))}

                {/* Block notes */}
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Block Notes
                  </label>
                  <Textarea
                    placeholder="Add notes for this block..."
                    value={blockNote}
                    onChange={(e) => onBlockNoteChange(block.id, e.target.value)}
                    disabled={disabled}
                    className={cn("resize-none", disabled && "opacity-60")}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});
