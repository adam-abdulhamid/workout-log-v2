import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold">App Starter</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your App Starter Kit
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A minimal, production-ready Next.js starter.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg">Get Started</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
