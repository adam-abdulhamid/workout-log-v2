"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshot: string;
  url: string;
}

export function FeedbackModal({
  open,
  onOpenChange,
  screenshot,
  url,
}: FeedbackModalProps) {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          screenshot,
          url,
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        }),
      });

      if (response.ok) {
        setDescription("");
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold tracking-wider uppercase">
            Submit Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border border-border rounded overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshot}
              alt="Screenshot"
              className="w-full h-auto max-h-48 object-contain bg-muted"
            />
          </div>

          <div className="text-xs text-muted-foreground truncate">
            {url}
          </div>

          <Textarea
            placeholder="Describe the issue or feedback (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
