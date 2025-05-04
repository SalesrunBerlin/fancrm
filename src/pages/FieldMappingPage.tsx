import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useFieldMappings } from "@/hooks/useFieldMappings";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRightIcon } from "lucide-react";
import { UserFieldMapping, ObjectTypeInfo } from "@/types/FieldMapping";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TargetObjectCreator } from "@/components/settings/TargetObjectCreator";

export default function FieldMappingPage() {
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
        // Get the share record
        const { data: share, error: shareError } = await supabase
          .from('record_shares')
          .select('*')
          .eq('id', shareId)
          .maybeSingle();
          
        if (shareError) throw shareError;
        if (!share) throw new Error('Share not found');
        
        setShareData(share);
        
        // Get source object info
        const { data: sourceRecord, error: recordError } = await supabase
          .from('object_records')
          .select('object_type_id')
          .eq('id', share.record_id)
          .maybeSingle();
          
        if (recordError) throw recordError;
        if (!sourceRecord) throw new Error('Source record not found');
        
        // Get source object details
        const { data: sourceObj, error: objError } = await supabase
          .from('object_types')
          .select('id, name, api_name')
          .eq('id', sourceRecord.object_type_id)
          .maybeSingle();
          
        if (objError) throw objError;
        if (!sourceObj) throw new Error('Source object type not found');
        
        // Get source fields
        const { data: sourceFields, error: fieldsError } = await supabase
          .from('object_fields')
          .select('id, name, api_name, data_type')
          .eq('object_type_id', sourceObj.id);
          
        if (fieldsError) throw fieldsError;
        
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
        setError(err instanceof Error ? err.message : 'Failed to load share data');
        toast.error('Failed to load mapping data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShareData();
  }, [shareId, user, objectTypes]);

  // Initialize mappings when target object is selected
  useEffect(() => {
    if (sourceObjectInfo && selectedTargetObjectId && targetFields) {
      // Create initial mappings based on matching field names
      const initialMappings = sourceObjectInfo.fields.map(sourceField => {
        const matchingTargetField = targetFields.find(tf => 
          tf.api_name.toLowerCase() === sourceField.api_name.toLowerCase()
        );
        
        return {
          source_field_api_name: sourceField.api_name,
          target_field_api_name: matchingTargetField?.api_name || ""
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
      toast.error('Missing required data for mapping');
      return;
    }
    
    // Filter out mappings with "do_not_map" value
    const validMappings = mappings.filter(m => m.target_field_api_name && m.target_field_api_name !== "do_not_map");
    
    if (validMappings.length === 0) {
      toast.error('Please map at least one field');
      return;
    }
    
    const mappingsToSave = validMappings.map(mapping => ({
      source_user_id: shareData.shared_by_user_id,
      target_user_id: user.id,
      source_object_id: sourceObjectInfo.id,
      target_object_id: selectedTargetObjectId,
      source_field_api_name: mapping.source_field_api_name,
      target_field_api_name: mapping.target_field_api_name
    }));
    
    saveFieldMappings.mutate(mappingsToSave);
  };

  const handleObjectCreated = (newObjectId: string) => {
    setSelectedTargetObjectId(newObjectId);
    setTargetObjectExists(true);
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
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto py-6">
      <PageHeader
        title="Field Mapping Configuration"
        description="Map fields between shared data and your objects"
      />

      {sourceObjectInfo && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Object Mapping</CardTitle>
              <CardDescription>
                Select the target object in your system that should receive data from {sourceObjectInfo.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {targetObjectExists === false ? (
                <TargetObjectCreator 
                  sourceObject={sourceObjectInfo}
                  onObjectCreated={handleObjectCreated}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Source Object</h3>
                      <div className="p-3 border rounded-md bg-muted">
                        {sourceObjectInfo.name}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Target Object</h3>
                      <Select 
                        value={selectedTargetObjectId || undefined} 
                        onValueChange={handleTargetObjectChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target object" />
                        </SelectTrigger>
                        <SelectContent>
                          {objectTypes?.map(obj => (
                            <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedTargetObjectId && (
                    <Tabs defaultValue="fields" className="mt-6">
                      <TabsList className="grid w-full grid-cols-1">
                        <TabsTrigger value="fields">Field Mappings</TabsTrigger>
                      </TabsList>
                      <TabsContent value="fields" className="mt-4 space-y-4">
                        {sourceObjectInfo.fields.map(sourceField => (
                          <div key={sourceField.id} className="grid grid-cols-5 items-center gap-4">
                            <div className="col-span-2">
                              <div className="font-medium">{sourceField.name}</div>
                              <div className="text-sm text-muted-foreground">{sourceField.api_name}</div>
                            </div>
                            <div className="flex justify-center">
                              <ArrowRightIcon className="h-4 w-4" />
                            </div>
                            <div className="col-span-2">
                              <Select
                                value={mappings.find(m => m.source_field_api_name === sourceField.api_name)?.target_field_api_name || "do_not_map"}
                                onValueChange={(value) => handleFieldMappingChange(sourceField.api_name, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="do_not_map">Do not map</SelectItem>
                                  {targetFields
                                    ?.filter(tf => tf.data_type === sourceField.data_type)
                                    .map(field => (
                                      <SelectItem key={field.id} value={field.api_name}>
                                        {field.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveMappings}
                disabled={!selectedTargetObjectId || targetObjectExists === false || saveFieldMappings.isPending}
              >
                {saveFieldMappings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Mappings
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
