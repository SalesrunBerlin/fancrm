
import { useMemo } from "react";
import { ReportDefinition, ReportField } from "@/types/report";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";

interface ReportPreviewProps {
  name: string;
  objectIds: string[];
  selectedFields: ReportField[];
  filters: FilterCondition[];
}

export function ReportPreview({
  name,
  objectIds,
  selectedFields,
  filters
}: ReportPreviewProps) {
  const { objectTypes } = useObjectTypes();
  
  // Since we only support single-object reports in preview for now
  const primaryObjectId = objectIds[0];
  const { fields } = useObjectFields(primaryObjectId);
  const { records, isLoading, error } = useObjectRecords(primaryObjectId, filters);
  
  const visibleFields = useMemo(() => 
    selectedFields.filter(f => f.isVisible && f.objectTypeId === primaryObjectId),
    [selectedFields, primaryObjectId]
  );
  
  if (objectIds.length === 0 || selectedFields.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-md">
        Please select objects and fields to preview report.
      </div>
    );
  }
  
  if (objectIds.length > 1) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        Multi-object report preview is not available. The full report will be shown after saving.
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleFields.map((field, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map(i => (
                <TableRow key={i}>
                  {visibleFields.map((field, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        Error loading report data: {String(error)}
      </div>
    );
  }
  
  if (!records || records.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-md">
        No data found for this report configuration.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleFields.map((field, index) => {
                const fieldDef = fields.find(f => f.api_name === field.fieldApiName);
                return (
                  <TableHead key={index}>
                    {field.displayName || fieldDef?.name || field.fieldApiName}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.slice(0, 5).map((record, rowIndex) => (
              <TableRow key={rowIndex}>
                {visibleFields.map((field, colIndex) => {
                  let value = null;
                  
                  // Handle system fields vs. custom fields
                  if (["id", "created_at", "updated_at", "record_id"].includes(field.fieldApiName)) {
                    value = record[field.fieldApiName as keyof typeof record];
                  } else {
                    value = record.field_values?.[field.fieldApiName];
                  }
                  
                  return (
                    <TableCell key={colIndex}>
                      {value !== undefined && value !== null 
                        ? String(value) 
                        : <span className="text-muted-foreground italic">empty</span>}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            
            {records.length > 5 && (
              <TableRow>
                <TableCell 
                  colSpan={visibleFields.length} 
                  className="text-center text-muted-foreground"
                >
                  {records.length - 5} more record(s) not shown in preview
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
