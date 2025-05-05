import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RecordField } from "@/components/records/RecordField";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import type { RecordFormData } from "@/types";
import { Loader2, Plus, Save } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { generateAutoNumber } from "@/hooks/useAutoNumberFields";

export default function CreateRecordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading } = useEnhancedFields(objectTypeId);
  const { createRecord } = useObjectRecords(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();

  const onSubmit = async (data: RecordFormData) => {
    try {
      setIsSubmitting(true);
      
      // Für jedes Auto-Number-Feld einen Wert generieren
      const autoNumberFields = fields.filter(f => f.data_type === 'auto_number');
      
      for (const field of autoNumberFields) {
        try {
          const autoNumberValue = await generateAutoNumber(field.id);
          data[field.api_name] = autoNumberValue;
        } catch (error) {
          console.error(`Failed to generate auto-number for field ${field.api_name}:`, error);
        }
      }
      
      const record = await createRecord.mutateAsync({
        field_values: data
      });
      toast("Record created successfully");
      navigate(`/objects/${objectTypeId}/${record.id}`);
    } catch (error) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToCreateField = () => {
    if (objectTypeId) {
      navigate(`/settings/objects/${objectTypeId}/fields/new`);
    }
  };

  if (!objectType) return null;

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto px-4 sm:px-6">
      <PageHeader
        title={`New ${objectType.name}`}
        description={`Create a new ${objectType.name.toLowerCase()}`}
        className="mb-4"
        backTo={`/objects/${objectTypeId}`}
      />
      
      <Card className="shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
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
            <CardFooter className="flex justify-end border-t p-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create {objectType.name}
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
