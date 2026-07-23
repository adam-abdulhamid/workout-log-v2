import { BlockEditor } from "@/components/admin/block-editor";

interface BlockEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlockEditorPage({ params }: BlockEditorPageProps) {
  const { id } = await params;

  return (
    <div className="max-w-5xl mx-auto">
      <BlockEditor blockId={id} />
    </div>
  );
}
