
import { Loader2 } from "lucide-react";
import { useRelatedRecords } from "@/hooks/useRelatedRecords";
import { RelatedRecordsSection } from "./RelatedRecordsSection";

interface RelatedRecordsListProps {
  objectTypeId: string;
  recordId: string;
}

export function RelatedRecordsList({ objectTypeId, recordId }: RelatedRecordsListProps) {
  const { data: relatedSections, isLoading } = useRelatedRecords(objectTypeId, recordId);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!relatedSections || relatedSections.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Keine verknüpften Datensätze gefunden
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {relatedSections.map((section) => (
        <RelatedRecordsSection key={section.relationship.id} section={section} />
      ))}
    </div>
  );
}
