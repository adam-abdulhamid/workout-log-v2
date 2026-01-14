"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExerciseHistoryEntry } from "@/types/workout";

interface HistoryModalProps {
  exerciseId: string;
  exerciseName: string;
  open: boolean;
  onClose: () => void;
}

export function HistoryModal({
  exerciseId,
  exerciseName,
  open,
  onClose,
}: HistoryModalProps) {
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && exerciseId) {
      loadHistory();
    }
  }, [open, exerciseId]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercise/${exerciseId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load exercise history:", error);
    } finally {
      setLoading(false);
    }
  }

  // Group history by date
  const groupedHistory: Record<string, ExerciseHistoryEntry[]> = {};
  for (const entry of history) {
    if (!groupedHistory[entry.date]) {
      groupedHistory[entry.date] = [];
    }
    groupedHistory[entry.date].push(entry);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History: {exerciseName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading history...
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No history found for this exercise.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Set</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedHistory)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, entries]) =>
                  entries.map((entry, idx) => (
                    <TableRow key={`${date}-${entry.setNumber}`}>
                      {idx === 0 ? (
                        <TableCell
                          rowSpan={entries.length}
                          className="font-medium"
                        >
                          {new Date(date).toLocaleDateString()}
                        </TableCell>
                      ) : null}
                      <TableCell>{entry.setNumber}</TableCell>
                      <TableCell>{entry.reps ?? "-"}</TableCell>
                      <TableCell>
                        {entry.weight ? `${entry.weight} lbs` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {entry.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
