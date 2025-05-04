
import { SharedRecordView } from "@/components/sharing/SharedRecordView";
import { PageHeader } from "@/components/ui/page-header";

export default function SharedRecordPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Geteilter Datensatz"
        description="Anzeige eines Datensatzes, der mit Ihnen geteilt wurde."
      />
      <SharedRecordView />
    </div>
  );
}
