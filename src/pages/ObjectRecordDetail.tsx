
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { RelatedRecordsList } from "@/components/records/RelatedRecordsList";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDeleteDialog } from "@/components/records/RecordDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const navigate = useNavigate();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
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
    }
  };

  const handleBack = () => {
    navigate(`/objects/${objectTypeId}`);
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
      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="mb-2 pl-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {objectType?.name || "Objects"}
      </Button>

      <div className="flex items-center justify-between">
        <PageHeader 
          title={record.displayName || "Record Detail"} 
          description={`ID: ${recordId?.substring(0, 8)}...`}
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

      <Tabs 
        defaultValue="details" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card className="p-6">
            {record && fields && (
              <RecordDetailForm
                record={record}
                fields={fields}
                editedValues={{}}
                onFieldChange={() => {}} // Pass empty function for read-only view
                isEditing={false}
              />
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="related" className="space-y-4">
          {record && objectTypeId && recordId && (
            <RelatedRecordsList 
              objectTypeId={objectTypeId} 
              recordId={recordId} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
