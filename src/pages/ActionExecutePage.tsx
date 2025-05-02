
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useActions, Action } from "@/hooks/useActions";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useActionFields } from "@/hooks/useActionFields";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { CreateRecordForm } from "@/components/actions/CreateRecordForm";
import { supabase } from "@/integrations/supabase/client";

export default function ActionExecutePage() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { fields: actionFields, isLoading: loadingActionFields } = useActionFields(actionId);
  const { fields: objectFields } = useObjectFields(action?.target_object_id);

  const targetObject = objectTypes?.find(obj => obj.id === action?.target_object_id);

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
          .select("*")
          .eq("id", actionId)
          .single();

        if (error) throw error;
        setAction(data as Action);
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

  const getActionTypeTitle = () => {
    switch (action.action_type) {
      case "new_record":
        return `Create New ${targetObject?.name || "Record"}`;
      default:
        return "Execute Action";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={getActionTypeTitle()}
        description={targetObject ? `Create a new ${targetObject.name} record` : "Create a new record"}
        backTo="/actions"
      />

      <Card>
        <CardContent className="pt-6">
          {action.action_type === "new_record" && objectFields && (
            <CreateRecordForm
              objectTypeId={action.target_object_id}
              objectFields={objectFields}
              actionFields={actionFields || []}
              onSuccess={handleSuccess}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
