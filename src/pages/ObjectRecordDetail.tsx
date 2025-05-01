
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, ArrowLeft, Edit, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatedRecordsList } from "@/components/records/RelatedRecordsList";
import { LookupValueDisplay } from "@/components/records/LookupValueDisplay";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ObjectRecordDetail() {
  const navigate = useNavigate();
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string, recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { record, isLoading } = useRecordDetail(objectTypeId, recordId);
  const { fields } = useRecordFields(objectTypeId);
  const { updateRecord } = useObjectRecords(objectTypeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Star functionality states
  const [starModeActive, setStarModeActive] = useState(false);
  const [selectedFieldData, setSelectedFieldData] = useState<{
    fieldName: string;
    fieldApiName: string;
    uniqueValues: string[];
  } | null>(null);
  const [createObjectDialogOpen, setCreateObjectDialogOpen] = useState(false);
  const [newObjectName, setNewObjectName] = useState("");
  const [newObjectDescription, setNewObjectDescription] = useState("");
  const [newObjectDefaultField, setNewObjectDefaultField] = useState("name"); // Add state for default field name
  const [isProcessing, setIsProcessing] = useState(false);

  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  const handleDelete = async () => {
    if (!recordId) return;
    try {
      // Direct API call to delete the record since we're not exposing this in the hook
      const { data, error } = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE'
      }).then(res => res.json());
      
      if (error) throw new Error(error.message);
      
      toast.success("Record deleted successfully");
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const toggleStarMode = () => {
    setStarModeActive(!starModeActive);
    if (starModeActive) {
      toast.info("Star mode deactivated");
    } else {
      toast.info("Star mode activated! Click on star next to a text field to analyze unique values.");
    }
  };

  const handleFieldStarClick = async (fieldName: string, fieldApiName: string) => {
    if (!objectTypeId) return;
    
    setIsProcessing(true);
    try {
      // Fetch all records for this object type to find unique values
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
      
      if (uniqueValues.length === 0) {
        toast.warning("No unique values found for this field");
        setIsProcessing(false);
        return;
      }
      
      setSelectedFieldData({
        fieldName,
        fieldApiName,
        uniqueValues: uniqueValues
      });
      
      setNewObjectName(fieldName);
      setNewObjectDefaultField("name"); // Reset to default value
      setCreateObjectDialogOpen(true);
    } catch (error) {
      console.error("Error analyzing field values:", error);
      toast.error("Failed to analyze field values");
    } finally {
      setIsProcessing(false);
    }
  };

  const createNewObjectFromValues = async () => {
    if (!selectedFieldData || !objectTypeId) return;
    
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
          description: newObjectDescription || `Auto-generated from ${selectedFieldData.fieldName} field values`,
          is_active: true,
          default_field_api_name: defaultFieldApiName,
          show_in_navigation: true
        }])
        .select()
        .single();
      
      if (objectError) throw objectError;
      
      // 2. Create the default field for the new object
      const { data: nameField, error: nameFieldError } = await supabase
        .from('object_fields')
        .insert([{
          object_type_id: newObjectType.id,
          name: newObjectDefaultField,
          api_name: defaultFieldApiName,
          data_type: 'text',
          is_required: true,
          display_order: 1
        }])
        .select()
        .single();
      
      if (nameFieldError) throw nameFieldError;
      
      // 3. Create records for each unique value
      for (const value of selectedFieldData.uniqueValues) {
        // Create record
        const { data: newRecord, error: recordError } = await supabase
          .from('object_records')
          .insert([{ object_type_id: newObjectType.id }])
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
        }
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
          display_order: 100 // Put at end
        }])
        .select()
        .single();
      
      if (lookupFieldError) throw lookupFieldError;
      
      toast.success(`Successfully created new object "${newObjectName}" with ${selectedFieldData.uniqueValues.length} records and added lookup field`);
      setCreateObjectDialogOpen(false);
      navigate(`/settings/objects/${newObjectType.id}`);
    } catch (error) {
      console.error("Error creating object:", error);
      toast.error("Failed to create new object");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link to={`/objects/${objectTypeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {objectType.name} List
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Record not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recordName = record.displayName || `${objectType.name} Record`;

  return (
    <div className="container mx-auto px-2 md:px-0 space-y-6 max-w-5xl">
      <PageHeader
        title={recordName}
        actions={
          <div className="flex items-center space-x-2">
            <Button 
              variant={starModeActive ? "secondary" : "outline"}
              onClick={toggleStarMode}
              title={starModeActive ? "Deactivate Star Mode" : "Activate Star Mode"}
            >
              <Star className={`mr-2 h-4 w-4 ${starModeActive ? "fill-yellow-400 text-yellow-500" : ""}`} />
              {starModeActive ? "Exit Star Mode" : "Star Mode"}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/objects/${objectTypeId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/objects/${objectTypeId}/${recordId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6 divide-y">
              {fields
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((field) => {
                  const value = record.fieldValues[field.api_name];
                  const isTextField = field.data_type === "text" || field.data_type === "textarea";
                  
                  return (
                    <div key={field.id} className="py-3 grid grid-cols-3">
                      <div className="font-medium text-muted-foreground">
                        {field.name}
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        {field.data_type === "lookup" && field.options ? (
                          <LookupValueDisplay
                            value={value}
                            fieldOptions={{
                              target_object_type_id: (field.options as { target_object_type_id?: string })?.target_object_type_id || ''
                            }}
                          />
                        ) : field.data_type === "picklist" && value ? (
                          <span>{value}</span>
                        ) : (
                          <span>
                            {value !== null && value !== undefined ? String(value) : "—"}
                          </span>
                        )}
                        
                        {/* Star icon for text fields when star mode is active */}
                        {starModeActive && isTextField && value && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleFieldStarClick(field.name, field.api_name)}
                            disabled={isProcessing}
                          >
                            <Star className="h-4 w-4 text-yellow-500 hover:fill-yellow-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="related" className="mt-4">
          {objectTypeId && recordId && (
            <RelatedRecordsList 
              objectTypeId={objectTypeId} 
              recordId={recordId} 
            />
          )}
        </TabsContent>
      </Tabs>

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${objectType.name}`}
        description={`Are you sure you want to delete this ${objectType.name.toLowerCase()}? This action cannot be undone.`}
      />

      {/* Dialog for creating new object from unique values */}
      <Dialog open={createObjectDialogOpen} onOpenChange={setCreateObjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Object from Unique Values</DialogTitle>
            <DialogDescription>
              {selectedFieldData && (
                <div className="mt-2">
                  <p>Found {selectedFieldData.uniqueValues.length} unique values in the "{selectedFieldData.fieldName}" field:</p>
                  <div className="mt-2 p-2 bg-muted rounded-md max-h-32 overflow-y-auto text-sm">
                    {selectedFieldData.uniqueValues.map((value, index) => (
                      <div key={index} className="mb-1">{value}</div>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-4">Create a new object type with these values as records?</p>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="objectName" className="text-right">
                Object Name
              </Label>
              <Input
                id="objectName"
                value={newObjectName}
                onChange={(e) => setNewObjectName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultFieldName" className="text-right">
                Default Field Name
              </Label>
              <Input
                id="defaultFieldName"
                value={newObjectDefaultField}
                onChange={(e) => setNewObjectDefaultField(e.target.value)}
                className="col-span-3"
                placeholder="Name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="objectDescription" className="text-right">
                Description
              </Label>
              <Input
                id="objectDescription"
                value={newObjectDescription}
                onChange={(e) => setNewObjectDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateObjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createNewObjectFromValues} 
              disabled={!newObjectName.trim() || !newObjectDefaultField.trim() || isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Object
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
