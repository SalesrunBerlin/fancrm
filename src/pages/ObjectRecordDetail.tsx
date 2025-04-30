
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { RelatedRecordsList } from "@/components/records/RelatedRecordsList";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDeleteDialog } from "@/components/records/RecordDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const navigate = useNavigate();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { 
    record,
    fields,
    objectType,
    isLoading,
  } = useRecordDetail(objectTypeId, recordId);

  const handleEdit = () => {
    navigate(`/objects/${objectTypeId}/${recordId}/edit`);
  };

  const handleDelete = async () => {
    try {
      if (!recordId) return;
      
      // Use the Supabase client instead of direct fetch
      const { error } = await supabase
        .from("object_records")
        .delete()
        .eq("id", recordId);
      
      if (error) throw error;
      
      toast.success("Record deleted successfully");
      navigate(`/objects/${objectTypeId}`);
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast.error(`Failed to delete record: ${error.message || "Unknown error"}`);
      // No need to close dialog here, the RecordDeleteDialog component will handle it
    }
  };

  if (isLoading || !record) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={record.displayName || "Record Detail"} 
          description={objectType?.name || "Object"}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>Edit</Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <RecordDeleteDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />

      <div className="grid grid-cols-1 gap-6">
        {record && fields && (
          <RecordDetailForm
            record={record}
            fields={fields}
            editedValues={{}}
            onFieldChange={() => {}} // Pass empty function for read-only view
            isEditing={false}
          />
        )}
        
        {record && objectTypeId && recordId && (
          <RelatedRecordsList 
            objectTypeId={objectTypeId} 
            recordId={recordId} 
          />
        )}
      </div>
    </div>
  );
}
