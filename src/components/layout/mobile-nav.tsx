"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar, Blocks, CalendarDays, Settings, Dumbbell, LineChart, HeartPulse, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeedbackNavItem } from "@/components/feedback/feedback-nav-item";

const navigation = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Manage Days", href: "/admin/days", icon: CalendarDays },
  { name: "Block Library", href: "/admin/blocks", icon: Blocks },
  { name: "Weight Tracker", href: "/dashboard/weight-tracker", icon: LineChart },
  { name: "Injury Log", href: "/dashboard/injury-log", icon: HeartPulse },
  { name: "Health Docs", href: "/dashboard/health-documents", icon: FileText },
  { name: "Habits", href: "/dashboard/habits", icon: CheckSquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface MobileNavProps {
  isFeedbackUser?: boolean;
}

export function MobileNav({ isFeedbackUser = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
      return () => document.body.classList.remove("overflow-hidden");
    }
    document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="bg-background border-border md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isMounted &&
        createPortal(
          <>
            {/* Backdrop */}
            {isOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Slide-out menu */}
            <div
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border shadow-2xl transform transition-transform duration-200 ease-in-out md:hidden",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )}
              style={{ backgroundColor: "var(--background)" }}
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <div className="flex items-center justify-center w-7 h-7 bg-primary">
                  <Dumbbell className="h-4 w-4 text-background" />
                </div>
                <Link
                  href="/calendar"
                  className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Workout Log
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors border border-transparent",
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "border-border bg-card text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:border-border/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
                {isFeedbackUser && (
                  <FeedbackNavItem variant="mobile" onNavigate={() => setIsOpen(false)} />
                )}
              </nav>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
