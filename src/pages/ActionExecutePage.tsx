
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useActions, Action } from "@/hooks/useActions";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useActionFields } from "@/hooks/useActionFields";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { CreateRecordForm } from "@/components/actions/CreateRecordForm";
import { supabase } from "@/integrations/supabase/client";

export default function ActionExecutePage() {
  const { actionId, sourceRecordId } = useParams<{ 
    actionId: string;
    sourceRecordId: string;
  }>();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceObjectId, setSourceObjectId] = useState<string | null>(null);
  
  const { fields: actionFields, isLoading: loadingActionFields } = useActionFields(actionId);
  const { fields: objectFields } = useObjectFields(action?.target_object_id);
  
  // Load source record if this is a linked action
  const { record: sourceRecord } = useRecordDetail(sourceObjectId, sourceRecordId);

  const targetObject = objectTypes?.find(obj => obj.id === action?.target_object_id);

  // Fetch the action
  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId) {
        setError("Action ID is required");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("actions")
          .select("*, object_fields(options)")
          .eq("id", actionId)
          .single();

        if (error) throw error;
        
        const actionData = data as Action & { 
          object_fields?: { options: any } 
        };
        
        setAction(actionData);
        
        // If this is a linked action, we need to get the source object type ID
        if (actionData.action_type === "linked_record" && actionData.source_field_id) {
          try {
            const { data: fieldData, error: fieldError } = await supabase
              .from("object_fields")
              .select("options")
              .eq("id", actionData.source_field_id)
              .single();
              
            if (fieldError) throw fieldError;
            
            let targetObjectTypeId = '';
            
            if (fieldData.options) {
              if (typeof fieldData.options === 'string') {
                try {
                  const parsedOptions = JSON.parse(fieldData.options);
                  if (parsedOptions && typeof parsedOptions === 'object' && 'target_object_type_id' in parsedOptions) {
                    targetObjectTypeId = parsedOptions.target_object_type_id || '';
                  }
                } catch (e) {
                  console.error("Error parsing field options:", e);
                }
              } else if (typeof fieldData.options === 'object') {
                if ('target_object_type_id' in fieldData.options) {
                  targetObjectTypeId = fieldData.options.target_object_type_id || '';
                }
              }
            }
            
            if (targetObjectTypeId) {
              setSourceObjectId(targetObjectTypeId);
            }
          } catch (err) {
            console.error("Error getting source field details:", err);
          }
        }
      } catch (err: any) {
        console.error("Error fetching action:", err);
        setError(err.message || "Failed to load action");
      } finally {
        setLoading(false);
      }
    };

    fetchAction();
  }, [actionId]);

  // Wait until we have all the data we need
  useEffect(() => {
    if (!loadingActionFields && actionFields && objectFields && action) {
      setLoading(false);
    }
  }, [actionFields, objectFields, loadingActionFields, action]);

  const handleSuccess = () => {
    // Navigate to the object's records list after successful creation
    if (action?.target_object_id) {
      navigate(`/objects/${action.target_object_id}`);
    } else {
      navigate("/actions");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Action Error"
          description="There was a problem loading this action"
          backTo="/actions"
        />
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Action not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // For linked actions, check if we have the source record
  if (action.action_type === "linked_record" && sourceRecordId && !sourceRecord) {
    if (!sourceObjectId) {
      return (
        <div className="space-y-4">
          <PageHeader
            title="Action Error"
            description="There was a problem loading the source record"
            backTo="/actions"
          />
          <Alert className={getAlertVariantClass("destructive")}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Source object information is missing
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  const getActionTypeTitle = () => {
    switch (action.action_type) {
      case "new_record":
        return `Create New ${targetObject?.name || "Record"}`;
      case "linked_record":
        return `Create Linked ${targetObject?.name || "Record"}`;
      default:
        return "Execute Action";
    }
  };

  // Prepare default values for linked records
  const initialValues: Record<string, any> = {};
  
  // If this is a linked record and we have the source field ID, set the default value
  if (action.action_type === "linked_record" && action.source_field_id && sourceRecordId) {
    // Find the corresponding object field
    const sourceField = objectFields?.find(field => field.id === action.source_field_id);
    if (sourceField) {
      initialValues[sourceField.api_name] = sourceRecordId;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={getActionTypeTitle()}
        description={targetObject 
          ? action.action_type === "linked_record" 
            ? `Create a new ${targetObject.name} linked to the current record` 
            : `Create a new ${targetObject.name} record`
          : "Create a new record"
        }
        backTo="/actions"
      />

      <Card>
        <CardContent className="pt-6">
          {(action.action_type === "new_record" || action.action_type === "linked_record") && objectFields && (
            <CreateRecordForm
              objectTypeId={action.target_object_id}
              objectFields={objectFields}
              actionFields={actionFields || []}
              initialValues={initialValues}
              onSuccess={handleSuccess}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
