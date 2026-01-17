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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

type InjuryEntry = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateText(text: string, maxLength: number = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function InjuryLog() {
  const [entries, setEntries] = useState<InjuryEntry[]>([]);
  const [newContent, setNewContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<InjuryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/injury-entries");
      if (!res.ok) {
        throw new Error("Failed to load entries.");
      }
      const data = (await res.json()) as InjuryEntry[];
      setEntries(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = newContent.trim();
    if (!content) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/injury-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        throw new Error("Failed to save entry.");
      }
      const entry = (await res.json()) as InjuryEntry;
      setEntries((prev) => [entry, ...prev]);
      setNewContent("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selectedEntry) return;
    const content = editContent.trim();
    if (!content) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/injury-entries/${selectedEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        throw new Error("Failed to update entry.");
      }
      const updated = (await res.json()) as InjuryEntry;
      setEntries((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      setSelectedEntry(updated);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedEntry) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/injury-entries/${selectedEntry.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete entry.");
      }
      setEntries((prev) => prev.filter((e) => e.id !== selectedEntry.id));
      setSelectedEntry(null);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry.");
    } finally {
      setIsSaving(false);
    }
  }

  function openEntry(entry: InjuryEntry) {
    setSelectedEntry(entry);
    setEditContent(entry.content);
    setIsEditing(false);
  }

  function closeDialog() {
    setSelectedEntry(null);
    setIsEditing(false);
    setEditContent("");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Injury Log</CardTitle>
          <CardDescription>
            Track injuries and recovery progress over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                New Entry
              </label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Describe the injury, symptoms, or recovery progress..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isSaving || !newContent.trim()}>
              {isSaving ? "Saving..." : "Add Entry"}
            </Button>
          </form>

          {error && (
            <div className="text-xs uppercase tracking-wider text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              History
            </div>
            {isLoading ? (
              <div className="text-xs uppercase tracking-wider text-muted-foreground py-4">
                Loading entries...
              </div>
            ) : entries.length === 0 ? (
              <div className="text-xs uppercase tracking-wider text-muted-foreground py-4">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => openEntry(entry)}
                    className="w-full text-left p-3 rounded-lg border border-border bg-background/40 hover:bg-background/60 transition-colors"
                  >
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {formatDate(entry.createdAt)}
                    </div>
                    <div className="text-sm text-foreground">
                      {truncateText(entry.content)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedEntry && formatDate(selectedEntry.createdAt)}
              </span>
              {!isEditing && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(selectedEntry.content);
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={isSaving || !editContent.trim()}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {selectedEntry.content}
                </div>
              )}
              {selectedEntry.updatedAt !== selectedEntry.createdAt && (
                <div className="text-xs text-muted-foreground">
                  Edited {formatDate(selectedEntry.updatedAt)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
