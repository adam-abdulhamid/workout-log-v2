import { WorkoutPage } from "@/components/workout/workout-page";

interface WorkoutPageProps {
  params: Promise<{ date: string }>;
}

export default async function WorkoutDatePage({ params }: WorkoutPageProps) {
  const { date } = await params;

  return (
    <div className="max-w-3xl mx-auto">
      <WorkoutPage date={date} />
    </div>
  );
}
