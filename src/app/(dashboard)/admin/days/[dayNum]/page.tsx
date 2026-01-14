import { DayEditor } from "@/components/admin/day-editor";

interface DayEditorPageProps {
  params: Promise<{ dayNum: string }>;
}

export default async function DayEditorPage({ params }: DayEditorPageProps) {
  const { dayNum } = await params;
  const dayNumber = parseInt(dayNum);

  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 7) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Invalid day number.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <DayEditor dayNum={dayNumber} />
    </div>
  );
}
