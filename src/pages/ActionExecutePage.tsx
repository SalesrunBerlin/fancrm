
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

  // Aktion laden
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
        
        // Wenn es sich um eine verknüpfte Aktion handelt, müssen wir die Quell-Objekttyp-ID abrufen
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
                  if (parsedOptions && typeof parsedOptions === 'object' && parsedOptions.target_object_type_id) {
                    targetObjectTypeId = String(parsedOptions.target_object_type_id);
                  }
                } catch (e) {
                  console.error("Error parsing field options:", e);
                }
              } else if (typeof fieldData.options === 'object') {
                if (fieldData.options.target_object_type_id) {
                  targetObjectTypeId = String(fieldData.options.target_object_type_id);
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

  // Warten, bis alle benötigten Daten geladen sind
  useEffect(() => {
    if (!loadingActionFields && actionFields && objectFields && action) {
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
  if (action.action_type === "linked_record" && sourceRecordId && !sourceRecord) {
    if (!sourceObjectId) {
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
