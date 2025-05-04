
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useFieldMappings } from "@/hooks/useFieldMappings";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function FieldMappingPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { objectTypes } = useObjectTypes();
  const { mappings, saveFieldMappings } = useFieldMappings();
  
  const [selectedObjectTypeId, setSelectedObjectTypeId] = useState<string | null>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch share details
  const { data: shareDetails, isLoading: isLoadingShare } = useQuery({
    queryKey: ["share-details", shareId],
    queryFn: async () => {
      if (!shareId || !user) return null;
      
      // Get the record share details
      const { data, error } = await supabase
        .from('record_shares')
        .select(`
          *,
          shared_by:shared_by_user_id(id, first_name, last_name, screen_name),
          record:record_id(object_type_id)
        `)
        .eq('id', shareId)
        .eq('shared_with_user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching share details:', error);
        throw error;
      }
      
      // Get the source object fields
      const sourceObjectTypeId = data?.record?.object_type_id;
      
      if (sourceObjectTypeId) {
        const { data: fieldsData } = await supabase
          .from('object_fields')
          .select('*')
          .eq('object_type_id', sourceObjectTypeId);
          
        // Get shared fields
        const { data: shareFields } = await supabase
          .from('record_share_fields')
          .select('*')
          .eq('record_share_id', shareId);
          
        return {
          ...data,
          sourceObjectTypeId,
          sourceFields: fieldsData || [],
          sharedFields: shareFields || []
        };
      }
      
      return data;
    },
    enabled: !!shareId && !!user
  });
  
  // Fetch fields for the selected object type
  const { fields: targetFields, isLoading: isLoadingFields } = useObjectFields(selectedObjectTypeId || undefined);
  
  // Get existing mappings
  useEffect(() => {
    const fetchExistingMappings = async () => {
      if (!shareDetails?.sourceObjectTypeId || !shareDetails.shared_by?.id || !user) return;
      
      try {
        const { data } = await supabase
          .from('user_field_mappings')
          .select('*')
          .eq('target_user_id', user.id)
          .eq('source_user_id', shareDetails.shared_by.id)
          .eq('source_object_id', shareDetails.sourceObjectTypeId);
        
        if (data && data.length > 0) {
          // If target object is already selected in mappings, use it
          const targetObjectId = data[0].target_object_id;
          setSelectedObjectTypeId(targetObjectId);
          
          // Set up field mappings from existing data
          const mappings = data.reduce((acc, mapping) => {
            acc[mapping.source_field_api_name] = mapping.target_field_api_name;
            return acc;
          }, {} as Record<string, string>);
          
          setFieldMappings(mappings);
        }
      } catch (error) {
        console.error("Error fetching existing mappings:", error);
      }
    };
    
    fetchExistingMappings();
  }, [shareDetails, user]);

  const handleSaveMappings = async () => {
    if (!shareDetails?.sourceObjectTypeId || !shareDetails.shared_by?.id || !selectedObjectTypeId) {
      toast.error("Please select a target object type");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Check if we have at least some mappings
      const mappingEntries = Object.entries(fieldMappings).filter(([_, target]) => target);
      
      if (mappingEntries.length === 0) {
        toast.error("Please map at least one field");
        setIsSaving(false);
        return;
      }
      
      // Prepare mapping objects
      const mappingsToSave = mappingEntries.map(([sourceField, targetField]) => ({
        source_user_id: shareDetails.shared_by.id,
        target_user_id: user!.id,
        source_object_id: shareDetails.sourceObjectTypeId,
        target_object_id: selectedObjectTypeId,
        source_field_api_name: sourceField,
        target_field_api_name: targetField,
      }));
      
      await saveFieldMappings.mutateAsync(mappingsToSave);
      
      // Redirect back to shared records page or to the specific record
      if (shareDetails.record_id) {
        navigate(`/shared-record/${shareDetails.record_id}`);
      } else {
        navigate('/shared-records');
      }
      
    } catch (error) {
      console.error("Error saving mappings:", error);
      toast.error("Failed to save mappings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingShare) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!shareDetails) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Share Not Found</h2>
        <p className="mb-4">The shared record you're trying to map doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link to="/shared-records">Back to Shared Records</Link>
        </Button>
      </div>
    );
  }

  const sourceName = shareDetails?.shared_by?.screen_name || 
                    `${shareDetails?.shared_by?.first_name || ''} ${shareDetails?.shared_by?.last_name || ''}`.trim() || 
                    "Another user";

  // Get the source object name
  const sourceObjectType = objectTypes?.find(ot => ot.id === shareDetails.sourceObjectTypeId);
  const sourceObjectName = sourceObjectType?.name || "Object";
  
  // Filter visible fields based on what's been shared
  const visibleSourceFields = shareDetails.sourceFields?.filter(field => 
    shareDetails.sharedFields?.some(sf => sf.field_api_name === field.api_name)
  ) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Map Fields for Shared Record"
        description={`Map fields from ${sourceName}'s ${sourceObjectName} to your objects to view the shared record.`}
      />
      
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/shared-records">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shared Records
        </Link>
      </Button>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Step 1: Select Your Object Type</h3>
          <p className="text-sm text-muted-foreground">
            Select which of your objects will receive data from {sourceName}'s {sourceObjectName}.
          </p>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedObjectTypeId || undefined}
            onValueChange={(value) => {
              setSelectedObjectTypeId(value);
              // Reset field mappings when object type changes
              setFieldMappings({});
            }}
          >
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="Select an object type" />
            </SelectTrigger>
            <SelectContent>
              {objectTypes?.map((objectType) => (
                <SelectItem key={objectType.id} value={objectType.id}>
                  {objectType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedObjectTypeId && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Step 2: Map Fields</h3>
            <p className="text-sm text-muted-foreground">
              Match each field from {sourceName}'s {sourceObjectName} to your corresponding fields.
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingFields ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {visibleSourceFields.map(sourceField => (
                  <div key={sourceField.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium mb-1">{sourceField.name}</label>
                      <div className="text-sm text-muted-foreground">
                        Data type: {sourceField.data_type}
                      </div>
                    </div>
                    <Select 
                      value={fieldMappings[sourceField.api_name] || undefined}
                      onValueChange={(value) => {
                        setFieldMappings(prev => ({
                          ...prev,
                          [sourceField.api_name]: value
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Skip this field --</SelectItem>
                        {targetFields?.map((targetField) => (
                          <SelectItem 
                            key={targetField.id} 
                            value={targetField.api_name}
                            disabled={targetField.data_type !== sourceField.data_type}
                          >
                            {targetField.name} {targetField.data_type !== sourceField.data_type && '(incompatible type)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSaveMappings}
              disabled={isSaving || !selectedObjectTypeId}
              className="flex items-center"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Mappings
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
