"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const FEEDBACK_ENABLED_KEY = "feedback-enabled";

interface FeedbackNavItemProps {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function FeedbackNavItem({ variant, onNavigate }: FeedbackNavItemProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(FEEDBACK_ENABLED_KEY);
    setIsEnabled(stored !== "false");

    const handleToggle = (e: CustomEvent<boolean>) => {
      setIsEnabled(e.detail);
    };
    window.addEventListener("feedback-toggle", handleToggle as EventListener);
    return () => {
      window.removeEventListener("feedback-toggle", handleToggle as EventListener);
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted || !isEnabled) return null;

  const isActive = pathname === "/dashboard/feedback" || pathname.startsWith("/dashboard/feedback/");

  if (variant === "desktop") {
    return (
      <Link
        href="/dashboard/feedback"
        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors border border-transparent text-muted-foreground hover:text-foreground hover:border-border/50"
      >
        <MessageSquare className="w-4 h-4" />
        Feedback
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/feedback"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors border border-transparent",
        isActive
          ? "border-border bg-card text-foreground"
          : "text-muted-foreground hover:text-foreground hover:border-border/50"
      )}
    >
      <MessageSquare className="h-4 w-4" />
      Feedback
    </Link>
  );
}
