
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";
import { ObjectFieldEditFields } from "@/components/settings/ObjectFieldEditFields";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define the form schema
const fieldEditSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  api_name: z.string().min(1, "API name is required"),
  target_object_type_id: z.string().optional(),
  display_field_api_name: z.string().optional(),
});

export type FieldEditFormData = z.infer<typeof fieldEditSchema>;

export default function ObjectFieldEditPage() {
  const navigate = useNavigate();
  const { objectTypeId, fieldId } = useParams<{ objectTypeId: string; fieldId: string }>();
  const { fields, isLoading } = useObjectFields(objectTypeId);
  
  const field = fields?.find(f => f.id === fieldId);
  
  const handleClose = () => {
    navigate(`/settings/objects/${objectTypeId}`);
  };
  
  // Initialize the form
  const form = useForm<FieldEditFormData>({
    resolver: zodResolver(fieldEditSchema),
    defaultValues: {
      name: field?.name || "",
      api_name: field?.api_name || "",
      target_object_type_id: field?.options?.target_object_type_id,
      display_field_api_name: field?.options?.display_field_api_name,
    },
    values: field ? {
      name: field.name,
      api_name: field.api_name,
      target_object_type_id: field.options?.target_object_type_id,
      display_field_api_name: field.options?.display_field_api_name,
    } : undefined,
  });
  
  useEffect(() => {
    if (!isLoading && !field) {
      navigate(`/settings/objects/${objectTypeId}`);
    }
    
    if (field) {
      form.reset({
        name: field.name,
        api_name: field.api_name,
        target_object_type_id: field.options?.target_object_type_id,
        display_field_api_name: field.options?.display_field_api_name,
      });
    }
  }, [isLoading, field, navigate, objectTypeId, form]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const onSubmit = async (data: FieldEditFormData) => {
    if (!field) return;
    setIsSubmitting(true);
    
    try {
      // Prepare field options based on field type
      let options = { ...field.options } || {};
      
      if (field.data_type === 'lookup') {
        options = {
          ...options,
          target_object_type_id: data.target_object_type_id,
          display_field_api_name: data.display_field_api_name
        };
      }
      
      const { data: updatedField, error } = await supabase
        .from("object_fields")
        .update({
          name: data.name,
          options
        })
        .eq("id", field.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Field updated successfully");
      handleClose();
    } catch (error: any) {
      toast.error("Failed to update field", {
        description: error?.message || "An error occurred while updating the field"
      });
      console.error("Error updating field:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link to={`/settings/objects/${objectTypeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Object
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Field not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="outline" asChild>
        <Link to={`/settings/objects/${objectTypeId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Object
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Edit Field: {field.name}</h1>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <ObjectFieldEditFields 
                form={form}
                field={field}
                targetFields={fields.filter(f => f.object_type_id === field.options?.target_object_type_id)}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
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
    </div>
  );
}
