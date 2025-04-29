
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { FieldsConfigDialog } from "./FieldsConfigDialog";
import { RelatedRecordsTable } from "./RelatedRecordsTable";
import { RelatedSection } from "@/hooks/useRelatedRecords";

interface RelatedRecordsSectionProps {
  section: RelatedSection;
}

export function RelatedRecordsSection({ section }: RelatedRecordsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{section.relationship.name} - {section.objectType.name}</CardTitle>
        <FieldsConfigDialog
          objectTypeId={section.objectType.id}
          defaultVisibleFields={section.fields.map(f => f.api_name)}
        />
      </CardHeader>
      <CardContent>
        <RelatedRecordsTable section={section} />
      </CardContent>
    </Card>
  );
}
