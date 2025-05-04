
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { RelatedRecordsTable } from "./RelatedRecordsTable";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { Badge } from "@/components/ui/badge";

interface RelatedRecordsSectionProps {
  section: RelatedSection;
}

export function RelatedRecordsSection({ section }: RelatedRecordsSectionProps) {
  // Add null checking to handle potential undefined values
  if (!section || !section.objectType) {
    return null; // Don't render anything if section or objectType is missing
  }

  return (
    <Card className="shadow-sm w-full max-w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">{section.objectType.name}</CardTitle>
            {section.relationship && (
              <Badge variant="outline" className="text-xs">
                {section.relationship.relationship_type}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {section.records ? section.records.length : 0} related records
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0 sm:px-2 md:px-4 overflow-hidden">
        <RelatedRecordsTable section={section} />
      </CardContent>
    </Card>
  );
}
