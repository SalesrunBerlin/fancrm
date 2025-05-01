
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RecordField } from "@/components/records/RecordField";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import type { RecordFormData } from "@/types";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { AddFieldSheet } from "@/components/records/AddFieldSheet";
import { toast } from "sonner";

export default function EditRecordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addFieldSheetOpen, setAddFieldSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const { record, isLoading: isLoadingRecord } = useRecordDetail(objectTypeId, recordId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();

  useEffect(() => {
    if (record && !isLoadingRecord) {
      // Populate form with existing record data
      const defaultValues: RecordFormData = {};
      Object.entries(record.fieldValues).forEach(([key, value]) => {
        defaultValues[key] = value;
      });
      form.reset(defaultValues);
    }
  }, [record, isLoadingRecord, form]);

  const onSubmit = async (data: RecordFormData) => {
    if (!recordId) return;
    
    try {
      setIsSubmitting(true);
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: data
      });
      navigate(`/objects/${objectTypeId}/${recordId}`);
    } catch (error) {
      console.error("Error updating record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldCreated = () => {
    toast.success("Field created successfully!");
    // Re-fetch fields to include the newly created field
    if (objectTypeId) {
      // The useRecordFields hook uses useQuery internally which will automatically
      // refetch when invalidated
      const event = new CustomEvent('refetch-fields', { detail: { objectTypeId } });
      window.dispatchEvent(event);
    }
  };

  if (!objectType) return null;

  const isLoading = isLoadingFields || isLoadingRecord;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="outline" asChild>
        <Link to={`/objects/${objectTypeId}/${recordId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {objectType.name} Detail
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Edit {objectType.name}</h1>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <RecordField
                      key={field.id}
                      field={field}
                      form={form}
                    />
                  ))}
                  
                  {/* Add New Field Button */}
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => setAddFieldSheetOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Field
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/objects/${objectTypeId}/${recordId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      {/* Add Field Sheet */}
      <AddFieldSheet
        open={addFieldSheetOpen}
        onOpenChange={setAddFieldSheetOpen}
        objectTypeId={objectTypeId}
        onFieldCreated={handleFieldCreated}
      />
    </div>
  );
}
