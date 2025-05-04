
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
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!relatedSections || relatedSections.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 bg-muted/10 rounded-md border border-dashed w-full">
        <p className="font-medium">Keine verknüpften Datensätze gefunden</p>
        <p className="text-sm mt-2">No related records found for this item</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-full">
      {relatedSections.map((section) => (
        section && <RelatedRecordsSection 
          key={`${section.relationship?.id || 'unknown'}-${section.objectType?.id || 'unknown'}`} 
          section={section} 
        />
      ))}
    </div>
  );
}
