
import React from "react";
import { useParams } from "react-router-dom";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { RecordDetailHeader } from "@/components/records/RecordDetailHeader";
import { RelatedRecordsTab } from "@/components/records/RelatedRecordsTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams();
  
  const { record, isLoading, refetch } = useRecordDetail(
    objectTypeId,
    recordId
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <RecordDetailHeader 
        displayName={record?.displayName} 
        objectName={record?.objectName || ''} 
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="related">Related Records</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="p-4 bg-white rounded-md shadow">
            <RecordDetailForm 
              objectTypeId={objectTypeId!} 
              recordId={recordId!} 
              onSuccess={() => refetch()}
            />
          </TabsContent>
          <TabsContent value="related">
            <RelatedRecordsTab 
              objectTypeId={objectTypeId!} 
              recordId={recordId!}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
