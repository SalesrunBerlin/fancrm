
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { useActions, Action } from "@/hooks/useActions";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useActionFields } from "@/hooks/useActionFields";
import { useObjectFields } from "@/hooks/useObjectFields";
import { PublicRecordForm } from "@/components/actions/PublicRecordForm";

export default function PublicActionPage() {
  const { token } = useParams<{ token: string }>();
  const { getActionByToken } = useActions();
  const { objectTypes } = useObjectTypes();
  
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFieldsData, setActionFieldsData] = useState<any[]>([]);
  const [objectFieldsData, setObjectFieldsData] = useState<any[]>([]);
  
  // Load action by token
  useEffect(() => {
    const fetchAction = async () => {
      if (!token) {
        setError("Invalid or missing token");
        setLoading(false);
        return;
      }

      try {
        const actionData = await getActionByToken(token);
        
        if (!actionData) {
          setError("This link is expired or invalid");
          setLoading(false);
          return;
        }
        
        if (actionData.action_type !== "new_record") {
          setError("This action type is not supported for public forms");
          setLoading(false);
          return;
        }
        
        setAction(actionData);
        
        // Now fetch the fields directly from Supabase since the hooks might not work for unauthenticated users
        await fetchActionFields(actionData.id);
        await fetchObjectFields(actionData.target_object_id);
      } catch (error: any) {
        console.error("Error fetching action by token:", error);
        setError("Failed to load form. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchAction();
  }, [token, getActionByToken]);

  // Fetch action fields directly from Supabase
  const fetchActionFields = async (actionId: string) => {
    try {
      const { data: fields, error } = await supabase
        .from("action_field_settings")
        .select(`
          *,
          object_fields:field_id (id, name, api_name, data_type, options, is_required)
        `)
        .eq("action_id", actionId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching action fields:", error);
        throw error;
      }

      const enhancedFields = fields.map(item => ({
        ...item,
        field_name: item.object_fields?.name,
        api_name: item.object_fields?.api_name,
        data_type: item.object_fields?.data_type,
        is_required: item.object_fields?.is_required,
        options: item.object_fields?.options,
      }));

      setActionFieldsData(enhancedFields);
    } catch (err) {
      console.error("Error in fetchActionFields:", err);
    }
  };

  // Fetch object fields directly from Supabase
  const fetchObjectFields = async (objectTypeId: string) => {
    try {
      const { data: fields, error } = await supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("display_order");

      if (error) {
        console.error("Error fetching object fields:", error);
        throw error;
      }

      // Enhance picklist fields with their values
      const enhancedFields = [...fields];
      
      const picklistFields = fields.filter(field => field.data_type === 'picklist');
      if (picklistFields.length > 0) {
        for (const field of picklistFields) {
          try {
            const { data } = await supabase
              .from("field_picklist_values")
              .select("*")
              .eq("field_id", field.id)
              .order("order_position");
              
            if (data && data.length > 0) {
              const fieldIndex = enhancedFields.findIndex(f => f.id === field.id);
              if (fieldIndex !== -1) {
                enhancedFields[fieldIndex] = {
                  ...enhancedFields[fieldIndex],
                  options: {
                    values: data.map(item => ({
                      value: item.value,
                      label: item.label
                    }))
                  }
                };
              }
            }
          } catch (err) {
            console.error(`Error fetching picklist values for field ${field.id}:`, err);
          }
        }
      }

      setObjectFieldsData(enhancedFields);
    } catch (err) {
      console.error("Error in fetchObjectFields:", err);
    }
  };

  // Import supabase client at the top of the file
  const { supabase } = await import("@/integrations/supabase/client");

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4">
        <div className="max-w-md w-full">
          <Alert className={getAlertVariantClass("destructive")}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Invalid form link"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isFullyLoaded = action && actionFieldsData.length > 0 && objectFieldsData.length > 0;

  return (
    <div className="min-h-screen flex justify-center items-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>{action.name}</CardTitle>
          {action.description && (
            <CardDescription>{action.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isFullyLoaded ? (
            <PublicRecordForm
              objectTypeId={action.target_object_id}
              objectFields={objectFieldsData.map(field => ({
                id: field.id,
                api_name: field.api_name,
                name: field.name,
                data_type: field.data_type,
                is_required: field.is_required || false,
                options: field.options,
                default_value: field.default_value
              }))}
              actionFields={actionFieldsData}
            />
          ) : (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading form fields...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
