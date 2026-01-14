"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DayTemplateSummary } from "@/types/workout";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DayList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<DayTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/day-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Loading day templates...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Day Templates</h2>
      </div>

      {/* Day template cards */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="hover:border-primary/50 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="text-sm font-medium">
                    {DAY_NAMES[template.dayNumber - 1]}
                  </Badge>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/days/${template.dayNumber}`)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {template.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {template.blocks.length > 0 ? (
                  template.blocks.map((block) => (
                    <Badge key={block.id} variant="secondary">
                      {block.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No blocks assigned
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No day templates found. Run the migration script to create templates.
        </div>
      )}
    </div>
  );
}
