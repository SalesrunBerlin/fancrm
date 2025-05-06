
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicRelatedRecords } from "@/hooks/usePublicRecord";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { ObjectRecord } from "@/types/ObjectFieldTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  const { data: records, isLoading, error } = usePublicRelatedRecords(
    token,
    recordId,
    relatedObjectTypeId,
    relationshipId
  );
  
  const { fields: relatedFields, isLoading: fieldsLoading } = useObjectFields(relatedObjectTypeId);
  
  if (isLoading || fieldsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={`${getAlertVariantClass("destructive")} mb-4`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load related records"}
        </AlertDescription>
      </Alert>
    );
  }

  // Extract values for display
  const visibleFields = relatedFields?.filter(field => !field.is_system)
    .sort((a, b) => a.display_order - b.display_order)
    .slice(0, 5); // Just show first 5 fields to keep it clean

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{objectTypeName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No related records found
          </p>
        </CardContent>
      </Card>
    );
  }

  // Paginate records
  const startIndex = (page - 1) * pageSize;
  const paginatedRecords = records.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(records.length / pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <span>{objectTypeName}</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({records.length} {records.length === 1 ? "record" : "records"})
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleFields?.map(field => (
                  <TableHead key={field.id}>{field.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record: ObjectRecord) => (
                  <TableRow key={record.id}>
                    {visibleFields?.map(field => (
                      <TableCell key={`${record.id}-${field.api_name}`}>
                        {record.field_values?.[field.api_name] !== undefined && 
                         record.field_values?.[field.api_name] !== null 
                          ? String(record.field_values[field.api_name]) 
                          : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleFields?.length || 1} className="text-center">
                    No related records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
