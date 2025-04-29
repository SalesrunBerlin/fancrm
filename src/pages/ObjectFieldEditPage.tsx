
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectFieldEdit } from "@/hooks/useObjectFieldEdit";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";
import { ObjectFieldEditFields } from "@/components/settings/ObjectFieldEditFields";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useEffect } from "react";

export default function ObjectFieldEditPage() {
  const navigate = useNavigate();
  const { objectTypeId, fieldId } = useParams<{ objectTypeId: string; fieldId: string }>();
  const { fields, isLoading } = useObjectFields(objectTypeId);
  
  const field = fields?.find(f => f.id === fieldId);
  
  const handleClose = () => {
    navigate(`/settings/objects/${objectTypeId}`);
  };
  
  // Initialize the hook with a safe default when field is not available
  const { form, isSubmitting, onSubmit } = useObjectFieldEdit({
    field: field || {
      id: '',
      name: '',
      api_name: '',
      object_type_id: objectTypeId || '',
      data_type: 'text',
      is_system: false,
      is_required: false,
      display_order: 0,
    },
    onClose: handleClose,
  });
  
  useEffect(() => {
    if (!isLoading && !field) {
      navigate(`/settings/objects/${objectTypeId}`);
    }
  }, [isLoading, field, navigate, objectTypeId]);

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
          <form onSubmit={onSubmit}>
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
