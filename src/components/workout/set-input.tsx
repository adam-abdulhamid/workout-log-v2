"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SetInputProps {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  onRepsChange: (reps: number | null) => void;
  onWeightChange: (weight: number | null) => void;
  disabled?: boolean;
}

export function SetInput({
  setNumber,
  reps,
  weight,
  onRepsChange,
  onWeightChange,
  disabled = false,
}: SetInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground w-8">#{setNumber}</span>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          placeholder="Reps"
          value={reps ?? ""}
          onChange={(e) =>
            onRepsChange(e.target.value ? parseInt(e.target.value) : null)
          }
          disabled={disabled}
          className={cn("w-16 h-8 text-center", disabled && "bg-muted")}
        />
        <span className="text-muted-foreground">×</span>
        <Input
          type="number"
          step="0.5"
          placeholder="lbs"
          value={weight ?? ""}
          onChange={(e) =>
            onWeightChange(e.target.value ? parseFloat(e.target.value) : null)
          }
          disabled={disabled}
          className={cn("w-20 h-8 text-center", disabled && "bg-muted")}
        />
        <span className="text-xs text-muted-foreground">lbs</span>
      </div>
    </div>
  );
}
