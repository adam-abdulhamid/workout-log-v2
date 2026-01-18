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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, ExternalLink } from "lucide-react";

type FeedbackUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type FeedbackEntry = {
  id: string;
  userId: string;
  description: string | null;
  screenshot: string;
  url: string;
  userAgent: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  status: "open" | "fixed" | "wont_fix";
  createdAt: string;
  updatedAt: string;
  user: FeedbackUser;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge variant="outline">Open</Badge>;
    case "fixed":
      return <Badge variant="default">Fixed</Badge>;
    case "wont_fix":
      return <Badge variant="secondary">Won&apos;t Fix</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getUserName(user: FeedbackUser) {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.email;
}

export function FeedbackPanel() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FeedbackEntry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) {
        throw new Error("Failed to load feedback.");
      }
      const data = (await res.json()) as FeedbackEntry[];
      setEntries(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  async function updateStatus(id: string, status: string) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error("Failed to update status.");
      }
      const updated = (await res.json()) as FeedbackEntry;
      setEntries((prev) =>
        prev.map((e) => (e.id === updated.id ? { ...e, status: updated.status, updatedAt: updated.updatedAt } : e))
      );
      if (selectedEntry?.id === id) {
        setSelectedEntry((prev) => prev ? { ...prev, status: updated.status, updatedAt: updated.updatedAt } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteEntry(id: string) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete feedback.");
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete feedback.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            Review and manage user feedback submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-xs uppercase tracking-wider text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-xs uppercase tracking-wider text-muted-foreground py-4">
              Loading feedback...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-xs uppercase tracking-wider text-muted-foreground py-4">
              No feedback yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="text-left p-3 rounded-lg border border-border bg-background/40 hover:bg-background/60 transition-colors space-y-2"
                >
                  <div className="aspect-video rounded overflow-hidden border border-border/50 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.screenshot}
                      alt="Screenshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                      {formatDate(entry.createdAt)}
                    </span>
                    {getStatusBadge(entry.status)}
                  </div>
                  {entry.description && (
                    <p className="text-sm text-foreground line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between gap-2">
              <span className="truncate">
                {selectedEntry && formatDate(selectedEntry.createdAt)}
              </span>
              {selectedEntry && getStatusBadge(selectedEntry.status)}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              <div className="rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedEntry.screenshot}
                  alt="Screenshot"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">From:</span>
                  <span>{getUserName(selectedEntry.user)}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">URL:</span>
                  <a
                    href={selectedEntry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {selectedEntry.url}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>

                {selectedEntry.screenWidth && selectedEntry.screenHeight && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Screen:</span>
                    <span>{selectedEntry.screenWidth} x {selectedEntry.screenHeight}</span>
                  </div>
                )}

                {selectedEntry.description && (
                  <div className="pt-2 border-t border-border">
                    <span className="font-medium text-muted-foreground">Description:</span>
                    <p className="mt-1 text-foreground whitespace-pre-wrap">
                      {selectedEntry.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {selectedEntry.status !== "fixed" && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(selectedEntry.id, "fixed")}
                    disabled={isUpdating}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark Fixed
                  </Button>
                )}
                {selectedEntry.status !== "wont_fix" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(selectedEntry.id, "wont_fix")}
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Won&apos;t Fix
                  </Button>
                )}
                {selectedEntry.status !== "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(selectedEntry.id, "open")}
                    disabled={isUpdating}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteEntry(selectedEntry.id)}
                  disabled={isUpdating}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
