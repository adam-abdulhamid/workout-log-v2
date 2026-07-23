"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const FEEDBACK_ENABLED_KEY = "feedback-enabled";

export function useFeedbackEnabled() {
  const [enabled, setEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FEEDBACK_ENABLED_KEY);
    // Default to true if not set
    setEnabled(stored !== "false");
    setIsLoaded(true);
  }, []);

  const setFeedbackEnabled = (value: boolean) => {
    localStorage.setItem(FEEDBACK_ENABLED_KEY, String(value));
    setEnabled(value);
    // Dispatch event so FeedbackButton can react
    window.dispatchEvent(new CustomEvent("feedback-toggle", { detail: value }));
  };

  return { enabled, setFeedbackEnabled, isLoaded };
}

export function FeedbackSettings() {
  const { enabled, setFeedbackEnabled, isLoaded } = useFeedbackEnabled();

  if (!isLoaded) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5 min-w-0 flex-1">
        <Label htmlFor="feedback-toggle" className="text-sm font-medium">
          Feedback Button
        </Label>
        <p className="text-xs text-muted-foreground">
          Show the floating feedback button on all pages
        </p>
      </div>
      <Switch
        id="feedback-toggle"
        checked={enabled}
        onCheckedChange={setFeedbackEnabled}
        className="shrink-0"
      />
    </div>
  );
}
