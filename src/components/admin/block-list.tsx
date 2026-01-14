"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockSummary, BLOCK_CATEGORIES } from "@/types/workout";

export function BlockList() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    name: "",
    category: "strength",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBlocks();
  }, []);

  async function loadBlocks() {
    setLoading(true);
    try {
      const res = await fetch("/api/blocks");
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error("Failed to load blocks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createBlock() {
    if (!newBlock.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBlock),
      });

      if (res.ok) {
        const data = await res.json();
        setCreateDialogOpen(false);
        setNewBlock({ name: "", category: "strength", description: "" });
        // Navigate to the new block's edit page
        router.push(`/admin/blocks/${data.id}`);
      }
    } catch (error) {
      console.error("Failed to create block:", error);
    } finally {
      setCreating(false);
    }
  }

  async function deleteBlock(blockId: string) {
    if (!confirm("Are you sure you want to delete this block?")) return;

    try {
      const res = await fetch(`/api/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadBlocks();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete block");
      }
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  }

  // Group blocks by category
  const groupedBlocks: Record<string, BlockSummary[]> = {};
  for (const block of blocks) {
    const cat = block.category || "uncategorized";
    if (!groupedBlocks[cat]) {
      groupedBlocks[cat] = [];
    }
    groupedBlocks[cat].push(block);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Loading blocks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Block Library</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Block
        </Button>
      </div>

      {/* Blocks by category */}
      {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-medium capitalize text-muted-foreground">
            {category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryBlocks.map((block) => (
              <Card key={block.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{block.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/admin/blocks/${block.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{block.exerciseCount} exercises</Badge>
                    {block.daysUsed.length > 0 && (
                      <span className="truncate">
                        Used in: {block.daysUsed.slice(0, 2).join(", ")}
                        {block.daysUsed.length > 2 && "..."}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No blocks found. Create your first block to get started.
        </div>
      )}

      {/* Create Block Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newBlock.name}
                onChange={(e) =>
                  setNewBlock((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Push, Pull, Legs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newBlock.category}
                onChange={(e) =>
                  setNewBlock((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {BLOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBlock.description}
                onChange={(e) =>
                  setNewBlock((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={createBlock} disabled={creating || !newBlock.name.trim()}>
              {creating ? "Creating..." : "Create Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
