
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { RecordField } from "@/components/records/RecordField";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { generateAutoNumber } from "@/hooks/useAutoNumberFields";
import { toast } from "sonner";
import { RecordFormData } from "@/types"; // Fixed import path
import { ThemedButton } from "@/components/ui/themed-button";
import { useAuth } from "@/contexts/AuthContext";
import { ActionColor } from "@/hooks/useActions";
import { useObjectLayout } from "@/hooks/useObjectLayout";

export default function CreateRecordPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { favoriteColor } = useAuth();
  
  const { objectTypes } = useObjectTypes();
  const { fields: unsortedFields, isLoading: isLoadingFields } = useEnhancedFields(objectTypeId!);
  const { createRecord } = useObjectRecords(objectTypeId!);
  
  // Use layout configuration to order fields
  const { applyLayout, isLoading: isLoadingLayout } = useObjectLayout(objectTypeId);
  
  // Apply layout to field order
  const fields = applyLayout(unsortedFields || []);
  
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();
  
  if (!objectTypeId) {
    navigate("/dashboard");
    return null;
  }

  const onSubmit = async (data: RecordFormData) => {
    try {
      setIsSubmitting(true);
      
      // Process auto-number fields
      const autoNumberFields = fields.filter(f => f.data_type === 'auto_number');
      
      for (const field of autoNumberFields) {
        try {
          const autoNumberValue = await generateAutoNumber(field.id);
          // Add the auto-number value to the form data
          data[field.api_name] = autoNumberValue;
        } catch (error) {
          console.error(`Failed to generate auto-number for field ${field.api_name}:`, error);
          toast.error(`Failed to generate auto-number for field ${field.name}`);
        }
      }
      
      // Create the record
      const result = await createRecord.mutateAsync({
        field_values: data
      });
      
      toast.success(`${objectType?.name || 'Record'} created successfully`);
      
      if (result?.id) {
        navigate(`/objects/${objectTypeId}/${result.id}`);
      } else {
        navigate(`/objects/${objectTypeId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Failed to create ${objectType?.name || 'record'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`New ${objectType?.name || 'Record'}`}
        description={`Create a new ${objectType?.name || 'record'} by filling out the fields below.`}
      >
        <ThemedButton 
          variant="ghost" 
          size="sm" 
          className="gap-1" 
          onClick={() => navigate(`/objects/${objectTypeId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </ThemedButton>
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {isLoadingFields || isLoadingLayout ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {fields.map((field) => (
                    <RecordField
                      key={field.id}
                      field={field}
                      form={form}
                    />
                  ))}
                  
                  <div className="flex justify-end gap-3">
                    <ThemedButton 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate(`/objects/${objectTypeId}`)}
                    >
                      Cancel
                    </ThemedButton>
                    <ThemedButton 
                      type="submit" 
                      disabled={isSubmitting}
                      variant={(favoriteColor as ActionColor) || "default"}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </ThemedButton>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
