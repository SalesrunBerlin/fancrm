
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateObjectFromFieldValuesPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get the authenticated user
  const { objectTypeId, fieldApiName, fieldName } = useParams<{ 
    objectTypeId: string, 
    fieldApiName: string,
    fieldName: string
  }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);
  const [newObjectName, setNewObjectName] = useState("");
  const [newObjectDescription, setNewObjectDescription] = useState("");
  const [newObjectDefaultField, setNewObjectDefaultField] = useState("name");
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFieldName, setOriginalFieldName] = useState("");

  // Fetch the unique values when the component loads
  useEffect(() => {
    if (!objectTypeId || !fieldApiName) {
      toast.error("Missing required parameters");
      navigate(`/objects/${objectTypeId}`);
      return;
    }

    const fetchUniqueValues = async () => {
      setIsLoading(true);
      try {
        // Fetch all records for this object type
        const { data: recordsData, error: recordsError } = await supabase
          .from('object_records')
          .select('id')
          .eq('object_type_id', objectTypeId);
        
        if (recordsError) throw recordsError;
        
        // Get all field values
        const { data: fieldValues, error: fieldValuesError } = await supabase
          .from('object_field_values')
          .select('value')
          .eq('field_api_name', fieldApiName)
          .in('record_id', recordsData.map(r => r.id));
        
        if (fieldValuesError) throw fieldValuesError;
        
        // Extract unique non-empty values
        const uniqueValues = [...new Set(
          fieldValues
            .map(fv => fv.value)
            .filter(value => value !== null && value !== '')
        )];
        
        setUniqueValues(uniqueValues);
        setOriginalFieldName(fieldName || "");
        setNewObjectName(fieldName || "");
      } catch (error) {
        console.error("Error analyzing field values:", error);
        toast.error("Failed to analyze field values");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUniqueValues();
  }, [objectTypeId, fieldApiName, fieldName, navigate]);

  const handleCancel = () => {
    navigate(`/objects/${objectTypeId}`);
  };

  const createNewObjectFromValues = async () => {
    if (!objectTypeId || !fieldApiName || !user) {
      toast.error(!user ? "You must be logged in to create objects" : "Missing required parameters");
      return;
    }
    
    if (!newObjectName.trim() || !newObjectDefaultField.trim()) {
      toast.error("Object name and default field name are required");
      return;
    }
    
    setIsProcessing(true);
    try {
      const defaultFieldApiName = newObjectDefaultField.toLowerCase().replace(/\s+/g, '_');
      
      // 1. Create new object type
      const { data: newObjectType, error: objectError } = await supabase
        .from('object_types')
        .insert([{
          name: newObjectName,
          api_name: newObjectName.toLowerCase().replace(/\s+/g, '_'),
          description: newObjectDescription || `Auto-generated from ${originalFieldName} field values`,
          is_active: true,
          owner_id: user.id, // Add owner_id explicitly
          is_system: false,
          is_archived: false,
          show_in_navigation: true,
          default_field_api_name: defaultFieldApiName,
          is_published: false,
          is_template: false,
          source_object_id: null
        }])
        .select()
        .single();
      
      if (objectError) {
        console.error("Error creating object type:", objectError);
        throw objectError;
      }
      
      console.log("Created new object type:", newObjectType);
      
      // 2. Create the default field for the new object
      const { data: nameField, error: nameFieldError } = await supabase
        .from('object_fields')
        .insert([{
          object_type_id: newObjectType.id,
          name: newObjectDefaultField,
          api_name: defaultFieldApiName,
          data_type: 'text',
          is_required: true,
          is_system: false,
          display_order: 1,
          owner_id: user.id // Add owner_id explicitly
        }])
        .select()
        .single();
      
      if (nameFieldError) {
        console.error("Error creating field:", nameFieldError);
        throw nameFieldError;
      }
      
      console.log("Created default field:", nameField);
      
      // 3. Create records for each unique value
      let createdCount = 0;
      const totalRecords = uniqueValues.length;

      for (const value of uniqueValues) {
        // Create record
        const { data: newRecord, error: recordError } = await supabase
          .from('object_records')
          .insert([{ 
            object_type_id: newObjectType.id,
            owner_id: user.id // Add owner_id explicitly
          }])
          .select()
          .single();
        
        if (recordError) {
          console.error(`Error creating record for ${value}:`, recordError);
          continue;
        }
        
        // Add field value
        const { error: valueError } = await supabase
          .from('object_field_values')
          .insert([{
            record_id: newRecord.id,
            field_api_name: defaultFieldApiName,
            value: value
          }]);
        
        if (valueError) {
          console.error(`Error setting value for ${value}:`, valueError);
          continue;
        }
        
        createdCount++;
      }
      
      // 4. Create lookup field in the original object type
      const { data: lookupField, error: lookupFieldError } = await supabase
        .from('object_fields')
        .insert([{
          object_type_id: objectTypeId,
          name: `${newObjectName} Lookup`,
          api_name: `${newObjectName.toLowerCase().replace(/\s+/g, '_')}_lookup`,
          data_type: 'lookup',
          options: {
            target_object_type_id: newObjectType.id,
            display_field_api_name: defaultFieldApiName
          },
          is_required: false,
          display_order: 100, // Put at end
          owner_id: user.id // Add owner_id explicitly
        }])
        .select()
        .single();
      
      if (lookupFieldError) {
        console.error("Error creating lookup field:", lookupFieldError);
        throw lookupFieldError;
      }
      
      toast.success(`Successfully created new object "${newObjectName}" with ${createdCount} of ${totalRecords} records and added lookup field`);
      navigate(`/settings/objects/${newObjectType.id}`);
    } catch (error: any) {
      console.error("Error creating object:", error);
      toast.error(`Failed to create new object: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={`Create New Object from "${originalFieldName}" Values`}
        description="Create a new object based on the unique values in this field"
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium">Create New Object Type</h3>
                <p className="text-muted-foreground text-sm">
                  This will create a new object type with records for each unique value
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="objectName">Object Name</Label>
                  <Input
                    id="objectName"
                    value={newObjectName}
                    onChange={(e) => setNewObjectName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="defaultFieldName">Default Field Name</Label>
                  <Input
                    id="defaultFieldName"
                    value={newObjectDefaultField}
                    onChange={(e) => setNewObjectDefaultField(e.target.value)}
                    placeholder="Name"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be the primary field for identifying records
                  </p>
                </div>

                <div>
                  <Label htmlFor="objectDescription">Description (Optional)</Label>
                  <Textarea
                    id="objectDescription"
                    value={newObjectDescription}
                    onChange={(e) => setNewObjectDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Button 
                  onClick={createNewObjectFromValues} 
                  disabled={!newObjectName.trim() || !newObjectDefaultField.trim() || isProcessing}
                  className="mt-2"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Object
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Unique Values Preview</h3>
                <p className="text-muted-foreground text-sm">
                  Found {uniqueValues.length} unique values in the field
                </p>
              </div>
              
              <div className="bg-muted rounded-md p-4 max-h-96 overflow-y-auto">
                {uniqueValues.length === 0 ? (
                  <p className="text-muted-foreground">No unique values found</p>
                ) : (
                  uniqueValues.map((value, index) => (
                    <div key={index} className="py-1 border-b border-border last:border-0">
                      {value}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
