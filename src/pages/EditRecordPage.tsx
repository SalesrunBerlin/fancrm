
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
import type { RecordFormData } from "@/lib/types/records";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export default function EditRecordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const { record, isLoading: isLoadingRecord } = useRecordDetail(objectTypeId, recordId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();
  const isMobile = useIsMobile();

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

  if (!objectType) return null;

  const isLoading = isLoadingFields || isLoadingRecord;

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto px-4 sm:px-6">
      <Button variant="outline" asChild className="mb-4">
        <Link to={`/objects/${objectTypeId}/${recordId}`} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            Back to {isMobile ? "Detail" : `${objectType.name} Detail`}
          </span>
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <h1 className="text-xl sm:text-2xl font-bold">{isMobile ? "Edit" : `Edit ${objectType.name}`}</h1>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 px-4 sm:px-6">
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
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/objects/${objectTypeId}/${recordId}`)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
