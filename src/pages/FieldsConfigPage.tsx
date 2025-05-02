
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useUserFieldSettings, ViewMode } from "@/hooks/useUserFieldSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Table, 
  KanbanSquare, 
  Save, 
  Loader2 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FieldsConfigPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { 
    visibleFields, 
    viewMode, 
    kanbanField, 
    updateVisibleFields, 
    updateViewMode, 
    updateKanbanField 
  } = useUserFieldSettings(objectTypeId);
  
  const [localVisibleFields, setLocalVisibleFields] = useState<string[]>([]);
  const [localViewMode, setLocalViewMode] = useState<ViewMode>('table');
  const [localKanbanField, setLocalKanbanField] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  // System fields definition 
  const systemFields = [
    { api_name: "created_at", name: "Created At", is_system: true },
    { api_name: "updated_at", name: "Last Modified", is_system: true },
    { api_name: "record_id", name: "Record ID", is_system: true },
  ];
  
  const picklistFields = fields?.filter(field => field.data_type === 'picklist') || [];
  
  // Initialize local state
  useEffect(() => {
    setLocalVisibleFields(visibleFields || []);
    setLocalViewMode(viewMode || 'table');
    setLocalKanbanField(kanbanField);
  }, [visibleFields, viewMode, kanbanField]);

  // Select all functionality
  const [selectAll, setSelectAll] = useState(false);
  
  const allFields = [...(fields || []), ...systemFields];
  
  useEffect(() => {
    if (allFields.length > 0) {
      setSelectAll(localVisibleFields.length === allFields.length);
    }
  }, [localVisibleFields, allFields]);
  
  const handleSelectAll = (checked: boolean) => {
    const newVisibleFields = checked ? allFields.map(f => f.api_name) : [];
    setSelectAll(checked);
    setLocalVisibleFields(newVisibleFields);
  };

  const handleFieldToggle = (fieldApiName: string, checked: boolean) => {
    setLocalVisibleFields(prev => {
      const newVisibleFields = checked
        ? [...prev, fieldApiName]
        : prev.filter(f => f !== fieldApiName);
      setSelectAll(newVisibleFields.length === allFields.length);
      return newVisibleFields;
    });
  };
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Save view mode
    updateViewMode(localViewMode);
    
    // Save visible fields
    updateVisibleFields(localVisibleFields);
    
    // Save kanban field if kanban view is selected
    if (localViewMode === 'kanban' && localKanbanField) {
      updateKanbanField(localKanbanField);
    }
    
    toast.success("Settings saved successfully", {
      description: "Your view configuration has been updated."
    });
    
    setIsSaving(false);
    
    // Navigate back to the records list
    navigate(`/objects/${objectTypeId}`);
  };
  
  if (!objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Configure ${objectType.name} View`}
        description="Customize how records are displayed"
        backTo={`/objects/${objectTypeId}`}
        actions={
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        }
      />
      
      <Card className="p-6">
        <Tabs 
          defaultValue={localViewMode} 
          onValueChange={(value) => setLocalViewMode(value as ViewMode)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="table">
              <Table className="mr-2 h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <KanbanSquare className="mr-2 h-4 w-4" />
              Kanban View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="space-y-4">
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={checked => handleSelectAll(checked as boolean)}
              />
              <Label htmlFor="select-all" className="font-medium">Select All Fields</Label>
            </div>
            
            <Separator className="my-4" />
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground">Custom Fields</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {fields?.map((field) => (
                    <div key={field.api_name} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={field.api_name}
                        checked={localVisibleFields.includes(field.api_name)}
                        onCheckedChange={(checked) => 
                          handleFieldToggle(field.api_name, checked as boolean)
                        }
                      />
                      <Label htmlFor={field.api_name} className="cursor-pointer">
                        {field.name}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />
                
                <Label className="text-sm font-semibold text-muted-foreground">System Fields</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {systemFields.map((field) => (
                    <div key={field.api_name} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={field.api_name}
                        checked={localVisibleFields.includes(field.api_name)}
                        onCheckedChange={(checked) => 
                          handleFieldToggle(field.api_name, checked as boolean)
                        }
                      />
                      <Label htmlFor={field.api_name} className="cursor-pointer">
                        {field.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="kanban" className="space-y-4">
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="kanban-field" className="text-sm font-semibold">
                  Select Picklist Field for Kanban Columns
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Choose a picklist field to organize your records into columns
                </p>
                
                <Select
                  value={localKanbanField}
                  onValueChange={setLocalKanbanField}
                  disabled={picklistFields.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a picklist field" />
                  </SelectTrigger>
                  <SelectContent>
                    {picklistFields.length > 0 ? (
                      picklistFields.map(field => (
                        <SelectItem key={field.api_name} value={field.api_name}>
                          {field.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-fields" disabled>
                        No picklist fields available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {picklistFields.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    No picklist fields found. Create a picklist field to use Kanban view.
                  </p>
                )}
              </div>
              
              <div className="pt-4">
                <Label className="text-sm font-semibold mb-2 block">
                  Visible Fields in Cards
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select fields to display on Kanban cards
                </p>
                
                <div className="space-y-2">
                  {fields?.map((field) => (
                    <div key={field.api_name} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={`kanban-${field.api_name}`}
                        checked={localVisibleFields.includes(field.api_name)}
                        onCheckedChange={(checked) => 
                          handleFieldToggle(field.api_name, checked as boolean)
                        }
                      />
                      <Label htmlFor={`kanban-${field.api_name}`} className="cursor-pointer">
                        {field.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
