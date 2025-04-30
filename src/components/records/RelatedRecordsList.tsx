
import { Loader2 } from "lucide-react";
import { useRelatedRecords } from "@/hooks/useRelatedRecords";
import { RelatedRecordsSection } from "./RelatedRecordsSection";
import { Card } from "@/components/ui/card";

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
      <Card className="p-6 text-center text-muted-foreground">
        Keine verknüpften Datensätze gefunden
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {relatedSections.map((section) => (
        <RelatedRecordsSection key={section.relationship.id + "-" + section.objectType.id} section={section} />
      ))}
    </div>
  );
}
