
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFieldMappings } from "@/hooks/useFieldMappings";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { ObjectTypeInfo } from "@/types/FieldMapping";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MappingStatusAlert } from "@/components/mapping/MappingStatusAlert";
import { MappingForm } from "@/components/mapping/MappingForm";

export default function FieldMappingPage() {
  const navigate = useNavigate();
  const { shareId } = useParams<{ shareId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareData, setShareData] = useState<any>(null);
  const [sourceObjectInfo, setSourceObjectInfo] = useState<ObjectTypeInfo | null>(null);
  const [selectedTargetObjectId, setSelectedTargetObjectId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<{
    source_field_api_name: string;
    target_field_api_name: string;
  }[]>([]);
  
  const { user } = useAuth();
  const { objectTypes } = useObjectTypes();
  const { fields: targetFields } = useObjectFields(selectedTargetObjectId || "");
  const { saveFieldMappings, checkObjectExists } = useFieldMappings();
  const [targetObjectExists, setTargetObjectExists] = useState<boolean | null>(null);

  // Fetch share data and source object information
  useEffect(() => {
    const fetchShareData = async () => {
      if (!shareId || !user) return;
      
      setIsLoading(true);
      setError("");
      
      try {
        console.log("Fetching data for share ID:", shareId);
        
        // Get the share record
        const { data: share, error: shareError } = await supabase
          .from('record_shares')
          .select('*')
          .eq('id', shareId)
          .maybeSingle();
          
        if (shareError) {
          console.error('Error fetching share:', shareError);
          throw new Error(`Fehler beim Laden der Freigabe: ${shareError.message}`);
        }
        
        if (!share) {
          throw new Error('Freigabe nicht gefunden. Die ID ist möglicherweise ungültig oder wurde gelöscht.');
        }
        
        console.log("Share data:", share);
        setShareData(share);
        
        // Get source object info
        const { data: sourceRecord, error: recordError } = await supabase
          .from('object_records')
          .select('object_type_id')
          .eq('id', share.record_id)
          .maybeSingle();
          
        if (recordError) {
          console.error('Error fetching record:', recordError);
          throw new Error(`Fehler beim Laden des Datensatzes: ${recordError.message}`);
        }
        
        if (!sourceRecord) {
          throw new Error('Quelldatensatz nicht gefunden. Der Datensatz wurde möglicherweise gelöscht.');
        }
        
        console.log("Source record:", sourceRecord);
        
        // Get source object details
        const { data: sourceObj, error: objError } = await supabase
          .from('object_types')
          .select('id, name, api_name')
          .eq('id', sourceRecord.object_type_id)
          .maybeSingle();
          
        if (objError) {
          console.error('Error fetching object type:', objError);
          throw new Error(`Fehler beim Laden des Objekttyps: ${objError.message}`);
        }
        
        if (!sourceObj) {
          throw new Error('Quellobjekttyp nicht gefunden. Der Objekttyp wurde möglicherweise gelöscht.');
        }
        
        console.log("Source object:", sourceObj);
        
        // Get source fields
        const { data: sourceFields, error: fieldsError } = await supabase
          .from('object_fields')
          .select('id, name, api_name, data_type')
          .eq('object_type_id', sourceObj.id);
          
        if (fieldsError) {
          console.error('Error fetching fields:', fieldsError);
          throw new Error(`Fehler beim Laden der Felder: ${fieldsError.message}`);
        }
        
        if (!sourceFields || sourceFields.length === 0) {
          throw new Error(`Keine Felder für den Objekttyp "${sourceObj.name}" gefunden.`);
        }
        
        console.log("Source fields:", sourceFields);
        
        const sourceObjInfo: ObjectTypeInfo = {
          id: sourceObj.id,
          name: sourceObj.name,
          api_name: sourceObj.api_name,
          fields: sourceFields
        };
        
        setSourceObjectInfo(sourceObjInfo);
        
        // Check if target object exists (first object with matching api_name)
        const matchingObject = objectTypes?.find(obj => 
          obj.api_name === sourceObj.api_name || 
          obj.api_name === `${sourceObj.api_name}_imported`
        );
        
        if (matchingObject) {
          setSelectedTargetObjectId(matchingObject.id);
          const exists = await checkObjectExists(matchingObject.id);
          setTargetObjectExists(exists);
        } else {
          setTargetObjectExists(false);
        }
        
      } catch (err) {
        console.error('Error fetching share data:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
        toast.error('Fehler beim Laden der Zuordnungsdaten');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShareData();
  }, [shareId, user, objectTypes, checkObjectExists]);

  // Initialize mappings when target object is selected
  useEffect(() => {
    if (sourceObjectInfo && selectedTargetObjectId && targetFields) {
      console.log("Initializing mappings with target fields:", targetFields);
      
      // Create initial mappings based on matching field names
      const initialMappings = sourceObjectInfo.fields.map(sourceField => {
        const matchingTargetField = targetFields.find(tf => 
          tf.api_name.toLowerCase() === sourceField.api_name.toLowerCase()
        );
        
        return {
          source_field_api_name: sourceField.api_name,
          target_field_api_name: matchingTargetField?.api_name || "do_not_map"
        };
      });
      
      setMappings(initialMappings);
    }
  }, [sourceObjectInfo, selectedTargetObjectId, targetFields]);

  const handleTargetObjectChange = (objectId: string) => {
    setSelectedTargetObjectId(objectId);
  };

  const handleFieldMappingChange = (sourceFieldApiName: string, targetFieldApiName: string) => {
    setMappings(prevMappings => 
      prevMappings.map(mapping => 
        mapping.source_field_api_name === sourceFieldApiName 
          ? { ...mapping, target_field_api_name: targetFieldApiName }
          : mapping
      )
    );
  };

  const handleSaveMappings = async () => {
    if (!shareData || !sourceObjectInfo || !selectedTargetObjectId || !user) {
      toast.error('Fehlende Daten für die Zuordnung');
      return;
    }
    
    // Filter out mappings with "do_not_map" value
    const validMappings = mappings.filter(m => m.target_field_api_name && m.target_field_api_name !== "do_not_map");
    
    if (validMappings.length === 0) {
      toast.error('Bitte ordnen Sie mindestens ein Feld zu');
      return;
    }

    console.log('Preparing field mappings to save');
    
    // Use the CreateFieldMapping type which doesn't require an 'id'
    const mappingsToSave = validMappings.map(mapping => ({
      source_user_id: shareData.shared_by_user_id,
      target_user_id: user.id,
      source_object_id: sourceObjectInfo.id,
      target_object_id: selectedTargetObjectId,
      source_field_api_name: mapping.source_field_api_name,
      target_field_api_name: mapping.target_field_api_name
    }));
    
    saveFieldMappings.mutate(mappingsToSave, {
      onSuccess: () => {
        toast.success("Feldzuordnung erfolgreich gespeichert");
        // Navigate to shared record page
        navigate(`/shared-record/${shareData.record_id}`);
      },
      onError: (error) => {
        toast.error("Fehler beim Speichern der Zuordnungen", {
          description: error instanceof Error ? error.message : "Unbekannter Fehler"
        });
      }
    });
  };

  const handleObjectCreated = (newObjectId: string) => {
    console.log("Object created with ID:", newObjectId);
    setSelectedTargetObjectId(newObjectId);
    setTargetObjectExists(true);
  };

  const handleGoBack = () => {
    navigate("/shared-records");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <MappingStatusAlert error={error} onGoBack={handleGoBack} />
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto py-6">
      <PageHeader
        title="Feldzuordnung konfigurieren"
        description="Ordnen Sie Felder zwischen geteilten Daten und Ihren Objekten zu"
      />

      {sourceObjectInfo && (
        <div className="grid gap-6 md:grid-cols-2">
          <MappingForm
            sourceObjectInfo={sourceObjectInfo}
            targetObjectExists={targetObjectExists}
            selectedTargetObjectId={selectedTargetObjectId}
            objectTypes={objectTypes || []}
            targetFields={targetFields || []}
            mappings={mappings}
            isSubmitting={saveFieldMappings.isPending}
            onTargetObjectChange={handleTargetObjectChange}
            onFieldMappingChange={handleFieldMappingChange}
            onObjectCreated={handleObjectCreated}
            onSubmit={handleSaveMappings}
            onGoBack={handleGoBack}
          />
        </div>
      )}
    </div>
  );
}
