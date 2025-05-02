
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { FieldsConfigDialog } from "./FieldsConfigDialog";
import { RelatedRecordsTable } from "./RelatedRecordsTable";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RelatedRecordsSectionProps {
  section: RelatedSection;
}

export function RelatedRecordsSection({ section }: RelatedRecordsSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>{section.objectType.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {section.relationship.relationship_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{section.records.length} related records</p>
        </div>
        <div className="flex items-center">
          <FieldsConfigDialog
            objectTypeId={section.objectType.id}
            defaultVisibleFields={section.fields.map(f => f.api_name)}
            triggerComponent={
              <Button variant="ghost" size="icon" title="Configure Fields">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0 sm:px-4">
        <RelatedRecordsTable section={section} />
      </CardContent>
    </Card>
  );
}
