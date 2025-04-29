
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RecordField } from "@/components/records/RecordField";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import type { RecordFormData } from "@/lib/types/records";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function CreateRecordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const { createRecord } = useObjectRecords(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const form = useForm<RecordFormData>();

  const onSubmit = async (data: RecordFormData) => {
    try {
      setIsSubmitting(true);
      // Only pass the form data - the hook will handle adding the object_type_id
      await createRecord.mutateAsync(data);
      form.reset();
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!objectType) return null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="outline" asChild>
        <Link to={`/objects/${objectTypeId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {objectType.name} List
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">New {objectType.name}</h1>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {isLoadingFields ? (
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
            <CardFooter className="flex justify-end gap-3 border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/objects/${objectTypeId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
