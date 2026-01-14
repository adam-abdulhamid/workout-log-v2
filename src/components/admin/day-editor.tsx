"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DayTemplateDetail, BlockSummary } from "@/types/workout";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface DayEditorProps {
  dayNum: number;
}

export function DayEditor({ dayNum }: DayEditorProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<DayTemplateDetail | null>(null);
  const [allBlocks, setAllBlocks] = useState<BlockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);

  // Edited values
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedBlocks, setAssignedBlocks] = useState<
    Array<{ id: string; name: string; category: string | null }>
  >([]);

  useEffect(() => {
    loadData();
  }, [dayNum]);

  async function loadData() {
    setLoading(true);
    try {
      const [templateRes, blocksRes] = await Promise.all([
        fetch(`/api/day-templates/${dayNum}`),
        fetch("/api/blocks"),
      ]);

      if (templateRes.ok) {
        const data: DayTemplateDetail = await templateRes.json();
        setTemplate(data);
        setName(data.name);
        setDescription(data.description || "");
        setAssignedBlocks(
          data.blocks.map((b) => ({
            id: b.id,
            name: b.name,
            category: b.category,
          }))
        );
      }

      if (blocksRes.ok) {
        const data = await blocksRes.json();
        setAllBlocks(data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate() {
    setSaving(true);
    try {
      // Update template metadata
      await fetch(`/api/day-templates/${dayNum}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      // Update block assignments
      await fetch(`/api/day-templates/${dayNum}/blocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: assignedBlocks.map((b, index) => ({
            id: b.id,
            order: index + 1,
          })),
        }),
      });

      // Reload
      await loadData();
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setSaving(false);
    }
  }

  function addBlock(block: BlockSummary) {
    if (assignedBlocks.some((b) => b.id === block.id)) {
      return; // Already assigned
    }
    setAssignedBlocks((prev) => [
      ...prev,
      { id: block.id, name: block.name, category: block.category },
    ]);
    setAddBlockDialogOpen(false);
  }

  function removeBlock(blockId: string) {
    setAssignedBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= assignedBlocks.length) return;

    const newBlocks = [...assignedBlocks];
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    setAssignedBlocks(newBlocks);
  }

  // Filter available blocks (not already assigned)
  const availableBlocks = allBlocks.filter(
    (block) => !assignedBlocks.some((b) => b.id === block.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Loading day template...
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Day template not found.</p>
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
            onClick={() => router.push("/admin/days")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Days
          </Button>
          <h1 className="text-2xl font-bold">
            Edit {DAY_NAMES[dayNum - 1]}: {template.name}
          </h1>
        </div>
        <Button onClick={saveTemplate} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Template Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Day Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Full Body Strength A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assigned Blocks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assigned Blocks</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddBlockDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignedBlocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No blocks assigned. Add blocks to build this day&apos;s workout.
            </div>
          ) : (
            <div className="space-y-2">
              {assignedBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <span className="font-medium">{block.name}</span>
                    {block.category && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {block.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === assignedBlocks.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeBlock(block.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Block Dialog */}
      <Dialog open={addBlockDialogOpen} onOpenChange={setAddBlockDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {availableBlocks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                All blocks are already assigned to this day.
              </div>
            ) : (
              availableBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => addBlock(block)}
                  className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div>
                    <span className="font-medium">{block.name}</span>
                    {block.category && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {block.category}
                      </Badge>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
