
import React from "react";
import { usePublicRelatedRecords } from "@/hooks/usePublicRecord";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedRecordsTabProps {
  token: string;
  recordId: string;
  relatedObjectTypeId: string;
  relationshipId: string;
  objectTypeName: string;
}

export function RelatedRecordsTab({
  token,
  recordId,
  relatedObjectTypeId,
  relationshipId,
  objectTypeName
}: RelatedRecordsTabProps) {
  const { data: relatedRecords, isLoading, error } = usePublicRelatedRecords(
    token,
    recordId,
    relatedObjectTypeId,
    relationshipId
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="grid grid-cols-3 gap-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full col-span-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={`${getAlertVariantClass("destructive")} mb-4`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load related {objectTypeName} records.
        </AlertDescription>
      </Alert>
    );
  }

  if (!relatedRecords || relatedRecords.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No related {objectTypeName} records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Related {objectTypeName} ({relatedRecords.length})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedRecords.map((record: any) => {
          // Find a good display value for the record card
          let displayName = record.id;
          if (record.field_values) {
            const nameField = 
              record.field_values.name || 
              record.field_values.title || 
              record.field_values.subject ||
              record.field_values.first_name && record.field_values.last_name 
                ? `${record.field_values.first_name} ${record.field_values.last_name}`
                : null;
                
            if (nameField) displayName = nameField;
          }
          
          return (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-base truncate">{displayName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {Object.entries(record.field_values || {}).slice(0, 3).map(([field, value]) => (
                    <div key={field} className="grid grid-cols-3 gap-1">
                      <div className="text-sm text-muted-foreground">{field}:</div>
                      <div className="text-sm col-span-2 truncate">{value || "-"}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
