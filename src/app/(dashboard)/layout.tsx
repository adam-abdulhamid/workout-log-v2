import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Dumbbell, Blocks, CalendarDays, Settings } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";

const navigation = [
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Manage Days", href: "/admin/days", icon: CalendarDays },
  { name: "Block Library", href: "/admin/blocks", icon: Blocks },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen min-h-dvh">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-64 border-r bg-muted/30 flex-col fixed inset-y-0 left-0 z-30">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/calendar" className="flex items-center gap-2 font-semibold text-primary">
            <Dumbbell className="h-5 w-5" />
            Workout Log
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content - offset for sidebar on desktop */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
          <MobileNav />
          <Link href="/calendar" className="flex items-center gap-2 font-semibold text-primary md:hidden">
            <Dumbbell className="h-5 w-5" />
            Workout Log
          </Link>
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
