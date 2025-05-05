
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicRecordForm } from "@/components/actions/PublicRecordForm";
import { Action } from "@/hooks/useActions";

interface PublicActionPageContentProps {
  action: Action;
}

export function PublicActionPageContent({ action }: PublicActionPageContentProps) {
  const [actionFieldsData, setActionFieldsData] = useState<any[]>([]);
  const [objectFieldsData, setObjectFieldsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchActionFields(action.id),
          fetchObjectFields(action.target_object_id)
        ]);
        setLoading(false);
      } catch (error: any) {
        console.error("Error loading form data:", error);
        setError("Error loading form data. Please try again later.");
        setLoading(false);
      }
    };

    loadData();
  }, [action]);

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
      throw err;
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
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading form fields...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <div className="text-destructive">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isFullyLoaded = actionFieldsData.length > 0 && objectFieldsData.length > 0;

  if (!isFullyLoaded) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">No form fields were found for this action.</p>
      </div>
    );
  }

  return (
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
  );
}
