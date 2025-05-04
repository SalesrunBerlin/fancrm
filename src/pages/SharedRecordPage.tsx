
import { SharedRecordView } from "@/components/sharing/SharedRecordView";
import { PageHeader } from "@/components/ui/page-header";
import { useParams } from "react-router-dom";

export default function SharedRecordPage() {
  const { recordId } = useParams<{ recordId: string }>();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Geteilter Datensatz"
        description="Anzeige eines Datensatzes, der mit Ihnen geteilt wurde."
      />
      <SharedRecordView />
    </div>
  );
}
