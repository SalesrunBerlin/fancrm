
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RecordField } from "@/components/records/RecordField";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import type { RecordFormData } from "@/types";
import { Loader2, Plus, X, Save } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { generateAutoNumber } from "@/hooks/useAutoNumberFields";

export default function EditRecordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useEnhancedFields(objectTypeId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const { record, isLoading: isLoadingRecord } = useRecordDetail(objectTypeId, recordId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();

  // Initialize form with record data when it's loaded
  useEffect(() => {
    if (record && !isLoadingRecord) {
      console.log("Setting form values from record:", record);
      const defaultValues: RecordFormData = {};
      
      if (record.field_values) {
        Object.entries(record.field_values).forEach(([key, value]) => {
          console.log(`Setting field ${key} to value:`, value);
          defaultValues[key] = value;
        });
      }
      
      form.reset(defaultValues);
    }
  }, [record, isLoadingRecord, form]);

  const onSubmit = async (data: RecordFormData) => {
    if (!recordId || !objectTypeId) return;
    
    try {
      setIsSubmitting(true);
      console.log("Submitting form data:", data);
      
      // Process Auto-Number fields
      const autoNumberFields = fields.filter(field => field.data_type === 'auto_number');
      for (const field of autoNumberFields) {
        // If no value is present, generate a new one
        if (!data[field.api_name] || data[field.api_name] === 'undefined') {
          try {
            const autoNumberValue = await generateAutoNumber(field.id);
            data[field.api_name] = autoNumberValue as string;
          } catch (error) {
            console.error(`Failed to generate auto-number for field ${field.api_name}:`, error);
          }
        }
      }
      
      // Filter out any undefined values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as RecordFormData);
      
      console.log("Cleaned data for submission:", cleanedData);
      
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: cleanedData
      });
      
      toast.success("Record updated successfully");
      navigate(`/objects/${objectTypeId}/${recordId}`);
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldCreated = () => {
    toast("Field created successfully!");
    // Re-fetch fields to include the newly created field
    if (objectTypeId) {
      // The useRecordFields hook uses useQuery internally which will automatically
      // refetch when invalidated
      const event = new CustomEvent('refetch-fields', { detail: { objectTypeId } });
      window.dispatchEvent(event);
    }
  };

  const navigateToCreateField = () => {
    if (objectTypeId) {
      navigate(`/settings/objects/${objectTypeId}/fields/new`);
    }
  };

  const handleCancel = () => {
    navigate(`/objects/${objectTypeId}/${recordId}`);
  };

  if (!objectType) return null;

  const isLoading = isLoadingFields || isLoadingRecord;
  const recordName = record?.displayName || `${objectType.name} Record`;

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto px-4 sm:px-6">
      <PageHeader
        title={`Edit ${recordName}`}
        description={`Update the details for this ${objectType.name.toLowerCase()}`}
        className="mb-4"
        backTo={`/objects/${objectTypeId}/${recordId}`}
      />
      
      <Card className="shadow-sm w-full max-w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6 w-full max-w-full">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6 w-full max-w-full">
                  {fields.map((field) => (
                    <RecordField
                      key={field.id}
                      field={field}
                      form={form}
                    />
                  ))}
                  
                  {/* Add New Field Button */}
                  <div className="pt-4 border-t w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={navigateToCreateField}
                      className="w-full border-dashed flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Field
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t p-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
