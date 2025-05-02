
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { FieldsConfigDialog } from "./FieldsConfigDialog";
import { RelatedRecordsTable } from "./RelatedRecordsTable";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { Badge } from "@/components/ui/badge";

interface RelatedRecordsSectionProps {
  section: RelatedSection;
}

export function RelatedRecordsSection({ section }: RelatedRecordsSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle>{section.objectType.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{section.records.length} related records</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {section.relationship.relationship_type}
          </Badge>
          <FieldsConfigDialog
            objectTypeId={section.objectType.id}
            defaultVisibleFields={section.fields.map(f => f.api_name)}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0 sm:px-4">
        <RelatedRecordsTable section={section} />
      </CardContent>
    </Card>
  );
}
