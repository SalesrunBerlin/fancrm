
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
  
  // Laden des Quell-Datensatzes für verknüpfte Aktionen
  const { record: sourceRecord } = useRecordDetail(sourceObjectId, sourceRecordId);

  const targetObject = objectTypes?.find(obj => obj.id === action?.target_object_id);

  console.log("ActionExecutePage: Current params:", { actionId, sourceRecordId });
  console.log("ActionExecutePage: Source object ID:", sourceObjectId);
  
  // Aktion laden
  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId) {
        setError("Action ID is required");
        setLoading(false);
        return;
      }

      try {
        console.log("ActionExecutePage: Fetching action with ID:", actionId);
        
        const { data, error } = await supabase
          .from("actions")
          .select("*, object_fields(options)")
          .eq("id", actionId)
          .single();

        if (error) {
          console.error("ActionExecutePage: Error fetching action:", error);
          throw error;
        }
        
        const actionData = data as Action & { 
          object_fields?: { options: any } 
        };
        
        console.log("ActionExecutePage: Action data loaded:", actionData);
        setAction(actionData);
        
        // Wenn es sich um eine verknüpfte Aktion handelt, müssen wir die Quell-Objekttyp-ID abrufen
        if (actionData.action_type === "linked_record" && actionData.source_field_id && sourceRecordId) {
          console.log("ActionExecutePage: Linked action detected, fetching source field details");
          try {
            const { data: fieldData, error: fieldError } = await supabase
              .from("object_fields")
              .select("options, api_name, name")
              .eq("id", actionData.source_field_id)
              .single();
              
            if (fieldError) {
              console.error("ActionExecutePage: Error fetching source field:", fieldError);
              throw fieldError;
            }
            
            console.log("ActionExecutePage: Source field data:", fieldData);
            
            let targetObjectTypeId: string = '';
            
            if (fieldData && fieldData.options) {
              console.log("ActionExecutePage: Processing field options:", 
                typeof fieldData.options, fieldData.options);
                
              // Handle options as string
              if (typeof fieldData.options === 'string') {
                try {
                  const parsedOptions = JSON.parse(fieldData.options);
                  console.log("ActionExecutePage: Parsed options:", parsedOptions);
                  if (parsedOptions && typeof parsedOptions === 'object' && 'target_object_type_id' in parsedOptions) {
                    targetObjectTypeId = String(parsedOptions.target_object_type_id);
                    console.log("ActionExecutePage: Found target object type ID in parsed options:", targetObjectTypeId);
                  }
                } catch (e) {
                  console.error("ActionExecutePage: Error parsing field options:", e);
                }
              } 
              // Handle options as object
              else if (typeof fieldData.options === 'object' && fieldData.options !== null) {
                const options = fieldData.options as Record<string, any>;
                if ('target_object_type_id' in options) {
                  targetObjectTypeId = String(options.target_object_type_id);
                  console.log("ActionExecutePage: Found target object type ID in options object:", targetObjectTypeId);
                }
              }
            }
            
            if (targetObjectTypeId) {
              console.log("ActionExecutePage: Setting source object ID to:", targetObjectTypeId);
              setSourceObjectId(targetObjectTypeId);
            } else {
              console.error("ActionExecutePage: Could not determine target object type ID from field options");
            }
          } catch (err) {
            console.error("ActionExecutePage: Error getting source field details:", err);
          }
        }
      } catch (err: any) {
        console.error("ActionExecutePage: Error fetching action:", err);
        setError(err.message || "Failed to load action");
      } finally {
        setLoading(false);
      }
    };

    fetchAction();
  }, [actionId, sourceRecordId]);

  // Warten, bis alle benötigten Daten geladen sind
  useEffect(() => {
    if (!loadingActionFields && actionFields && objectFields && action) {
      console.log("ActionExecutePage: All required data loaded");
      setLoading(false);
    }
  }, [actionFields, objectFields, loadingActionFields, action]);

  const handleSuccess = () => {
    // Nach erfolgreicher Erstellung zur Objektliste navigieren
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
          title="Aktionsfehler"
          description="Es gab ein Problem beim Laden dieser Aktion"
          backTo="/actions"
        />
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Aktion nicht gefunden"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Für verknüpfte Aktionen prüfen, ob der Quelldatensatz vorhanden ist
  if (action.action_type === "linked_record" && sourceRecordId && !sourceObjectId) {
    console.log("ActionExecutePage: Missing source object ID for linked record action");
    return (
      <div className="space-y-4">
        <PageHeader
          title="Aktionsfehler"
          description="Es gab ein Problem beim Laden des Quelldatensatzes"
          backTo="/actions"
        />
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Informationen zum Quellobjekt fehlen
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Für verknüpfte Aktionen prüfen, ob der Quelldatensatz geladen werden konnte
  if (action.action_type === "linked_record" && sourceRecordId && sourceObjectId && !sourceRecord) {
    console.log("ActionExecutePage: Source record not loaded for linked action");
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Lade Quelldatensatz...</span>
        </div>
      );
    }
  }

  const getActionTypeTitle = () => {
    switch (action.action_type) {
      case "new_record":
        return `Neuen ${targetObject?.name || "Datensatz"} erstellen`;
      case "linked_record":
        return `Verknüpften ${targetObject?.name || "Datensatz"} erstellen`;
      default:
        return "Aktion ausführen";
    }
  };

  // Standardwerte für verknüpfte Datensätze vorbereiten
  const initialValues: Record<string, any> = {};
  
  // Wenn es sich um einen verknüpften Datensatz handelt und wir die Quellfeld-ID haben, setzen wir den Standardwert
  if (action.action_type === "linked_record" && action.source_field_id && sourceRecordId) {
    // Das entsprechende Objektfeld finden
    const sourceField = objectFields?.find(field => field.id === action.source_field_id);
    if (sourceField) {
      console.log(`ActionExecutePage: Setting initial value for ${sourceField.api_name} to ${sourceRecordId}`);
      initialValues[sourceField.api_name] = sourceRecordId;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={getActionTypeTitle()}
        description={targetObject 
          ? action.action_type === "linked_record" 
            ? `Erstellen Sie einen neuen ${targetObject.name}, der mit dem aktuellen Datensatz verknüpft ist` 
            : `Erstellen Sie einen neuen ${targetObject.name} Datensatz`
          : "Erstellen Sie einen neuen Datensatz"
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
