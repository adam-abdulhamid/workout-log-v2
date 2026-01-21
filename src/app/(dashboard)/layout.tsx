import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Calendar, Dumbbell, Blocks, CalendarDays, Settings, LineChart, HeartPulse, CheckSquare } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { FeedbackNavItem } from "@/components/feedback/feedback-nav-item";

const navigation = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Manage Days", href: "/admin/days", icon: CalendarDays },
  { name: "Block Library", href: "/admin/blocks", icon: Blocks },
  { name: "Weight Tracker", href: "/dashboard/weight-tracker", icon: LineChart },
  { name: "Injury Log", href: "/dashboard/injury-log", icon: HeartPulse },
  { name: "Habits", href: "/dashboard/habits", icon: CheckSquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Query user from database to get isFeedbackUser flag
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });

  const isFeedbackUser = dbUser?.isFeedbackUser ?? false;

  return (
    <div className="flex min-h-screen min-h-dvh">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-background/95 backdrop-blur fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="flex items-center justify-center w-7 h-7 bg-primary">
            <Dumbbell className="w-4 h-4 text-background" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-primary">
            Workout Log
          </span>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors border border-transparent text-muted-foreground hover:text-foreground hover:border-border/50"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
          {isFeedbackUser && <FeedbackNavItem variant="desktop" />}
        </nav>
      </aside>

      {/* Main content - offset for sidebar on desktop */}
      <div className="flex flex-1 flex-col md:ml-56">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 md:px-6">
          <MobileNav isFeedbackUser={isFeedbackUser} />
          <Link
            href="/calendar"
            className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary md:hidden"
          >
            <Dumbbell className="h-5 w-5" />
            Workout Log
          </Link>
          <div className="rounded-full ring-1 ring-border p-0.5">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {/* Feedback button - only visible to feedback users */}
      {isFeedbackUser && <FeedbackButton />}
    </div>
  );
}
