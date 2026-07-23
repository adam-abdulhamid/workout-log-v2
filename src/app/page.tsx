import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar, TrendingUp } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/calendar");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Dumbbell className="h-5 w-5" />
            Workout Log
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Track Your Training
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A 7-week training cycle tracker with progressive overload and deload weeks built in.
            Log your workouts, track your progress, and never miss a rep.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto text-left">
            <div className="space-y-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Weekly Calendar</h3>
              <p className="text-sm text-muted-foreground">
                View your training week at a glance with completion status and deload indicators.
              </p>
            </div>
            <div className="space-y-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Block Training</h3>
              <p className="text-sm text-muted-foreground">
                Organize workouts into reusable blocks with 6-week exercise progressions.
              </p>
            </div>
            <div className="space-y-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Log every set and view your exercise history to track progressive overload.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
