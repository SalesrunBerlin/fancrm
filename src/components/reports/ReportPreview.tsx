import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { ReportField } from "@/types/report";
import { FilterCondition } from "@/types/FilterCondition";

interface ReportPreviewProps {
  name: string;
  objectIds: string[];
  selectedFields: ReportField[];
  filters: FilterCondition[];
}

export function ReportPreview({ name, objectIds, selectedFields, filters }: ReportPreviewProps) {
  // Create a temporary report object for preview
  const previewReport = useMemo(() => ({
    id: "preview",
    name,
    objectIds,
    selectedFields,
    filters,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }), [name, objectIds, selectedFields, filters]);

  // Only render if we have at least one object and one field
  if (objectIds.length === 0 || selectedFields.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Please select at least one object and one field to preview the report.
        </p>
      </Card>
    );
  }

  return <ReportDisplay report={previewReport} />;
}
