
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
  
  // Load action fields and object fields once we have the action
  const { fields: actionFields, isLoading: loadingActionFields } = useActionFields(action?.id);
  const { fields: objectFields, isLoading: loadingObjectFields } = useObjectFields(action?.target_object_id);
  
  const targetObject = objectTypes?.find(obj => obj.id === action?.target_object_id);
  
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
      } catch (error: any) {
        console.error("Error fetching action by token:", error);
        setError("Failed to load form. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchAction();
  }, [token, getActionByToken]);

  // Wait until all required data is loaded
  const isFullyLoaded = !loading && !loadingActionFields && !loadingObjectFields && action && actionFields && objectFields;

  if (loading || loadingActionFields || loadingObjectFields) {
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
          {isFullyLoaded && (
            <PublicRecordForm
              objectTypeId={action.target_object_id}
              objectFields={objectFields}
              actionFields={actionFields}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
