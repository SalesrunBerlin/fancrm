
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Grip, ArrowDown, ArrowUp } from "lucide-react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ReportField } from "@/types/report";
import { cn } from "@/lib/utils";

interface ReportFieldSelectorProps {
  objectIds: string[];
  selectedFields: ReportField[];
  onChange: (fields: ReportField[]) => void;
}

export function ReportFieldSelector({
  objectIds,
  selectedFields,
  onChange
}: ReportFieldSelectorProps) {
  const { objectTypes } = useObjectTypes();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Initialize active tab if needed
  useEffect(() => {
    if (objectIds.length > 0 && (!activeTab || !objectIds.includes(activeTab))) {
      setActiveTab(objectIds[0]);
    }
  }, [objectIds, activeTab]);

  // Move field up in order
  const moveFieldUp = (fieldIndex: number) => {
    if (fieldIndex <= 0) return;
    
    const newFields = [...selectedFields];
    const currentOrder = newFields[fieldIndex].order;
    
    // Swap order with the field above
    newFields[fieldIndex].order = newFields[fieldIndex - 1].order;
    newFields[fieldIndex - 1].order = currentOrder;
    
    // Sort by order and update
    onChange([...newFields].sort((a, b) => a.order - b.order));
  };
  
  // Move field down in order
  const moveFieldDown = (fieldIndex: number) => {
    if (fieldIndex >= selectedFields.length - 1) return;
    
    const newFields = [...selectedFields];
    const currentOrder = newFields[fieldIndex].order;
    
    // Swap order with the field below
    newFields[fieldIndex].order = newFields[fieldIndex + 1].order;
    newFields[fieldIndex + 1].order = currentOrder;
    
    // Sort by order and update
    onChange([...newFields].sort((a, b) => a.order - b.order));
  };

  // Toggle field visibility
  const toggleFieldVisibility = (field: ReportField) => {
    const updatedFields = selectedFields.map(f => {
      if (f.objectTypeId === field.objectTypeId && f.fieldApiName === field.fieldApiName) {
        return { ...f, isVisible: !f.isVisible };
      }
      return f;
    });
    
    onChange(updatedFields);
  };
  
  // Update field display name
  const updateFieldDisplayName = (field: ReportField, newName: string) => {
    const updatedFields = selectedFields.map(f => {
      if (f.objectTypeId === field.objectTypeId && f.fieldApiName === field.fieldApiName) {
        return { ...f, displayName: newName };
      }
      return f;
    });
    
    onChange(updatedFields);
  };

  // Handle toggling a field
  const toggleField = (objectTypeId: string, fieldApiName: string, fieldName: string) => {
    const fieldExists = selectedFields.some(
      f => f.objectTypeId === objectTypeId && f.fieldApiName === fieldApiName
    );
    
    if (fieldExists) {
      // Remove field
      onChange(selectedFields.filter(
        f => !(f.objectTypeId === objectTypeId && f.fieldApiName === fieldApiName)
      ));
    } else {
      // Add field with next order number
      const nextOrder = selectedFields.length > 0 
        ? Math.max(...selectedFields.map(f => f.order)) + 1 
        : 0;
        
      onChange([
        ...selectedFields, 
        {
          objectTypeId,
          fieldApiName,
          displayName: fieldName,
          isVisible: true,
          order: nextOrder
        }
      ]);
    }
  };
  
  if (objectIds.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Please select at least one object first.
      </div>
    );
  }

  // Sort fields by order for display
  const sortedSelectedFields = [...selectedFields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Selected Fields</h3>
          {sortedSelectedFields.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No fields selected. Select fields from the tabs below.
            </p>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {sortedSelectedFields.map((field, index) => {
                  const objectType = objectTypes?.find(obj => obj.id === field.objectTypeId);
                  
                  return (
                    <div 
                      key={`${field.objectTypeId}-${field.fieldApiName}`}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md",
                        "border border-border"
                      )}
                    >
                      <div className="cursor-move">
                        <Grip className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <Checkbox 
                        checked={field.isVisible} 
                        onCheckedChange={() => toggleFieldVisibility(field)}
                        id={`visibility-${field.objectTypeId}-${field.fieldApiName}`}
                      />
                      
                      <Input
                        value={field.displayName}
                        onChange={(e) => updateFieldDisplayName(field, e.target.value)}
                        className="h-8 flex-1"
                      />
                      
                      <div className="text-xs text-muted-foreground">
                        {objectType?.name || 'Unknown Object'}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => moveFieldUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => moveFieldDown(index)}
                          disabled={index === sortedSelectedFields.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Tabs value={activeTab || ""} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {objectIds.map(objectId => {
            const objectType = objectTypes?.find(obj => obj.id === objectId);
            return (
              <TabsTrigger key={objectId} value={objectId}>
                {objectType?.name || "Object"}
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {objectIds.map(objectId => {
          const { fields } = useObjectFields(objectId);
          const objectType = objectTypes?.find(obj => obj.id === objectId);
          
          return (
            <TabsContent key={objectId} value={objectId}>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {objectType?.name || "Unknown Object"} Fields
                  </h3>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {/* System fields first */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2">System Fields</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['id', 'created_at', 'updated_at', 'record_id'].map(fieldApiName => {
                            const isSelected = selectedFields.some(
                              f => f.objectTypeId === objectId && f.fieldApiName === fieldApiName
                            );
                            
                            return (
                              <div key={fieldApiName} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${objectId}-${fieldApiName}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleField(
                                    objectId, 
                                    fieldApiName, 
                                    fieldApiName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
                                  )}
                                />
                                <Label
                                  htmlFor={`${objectId}-${fieldApiName}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {fieldApiName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Custom fields */}
                      {fields.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Custom Fields</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {fields.map(field => {
                              const isSelected = selectedFields.some(
                                f => f.objectTypeId === objectId && f.fieldApiName === field.api_name
                              );
                              
                              return (
                                <div key={field.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${objectId}-${field.api_name}`}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleField(objectId, field.api_name, field.name)}
                                  />
                                  <Label
                                    htmlFor={`${objectId}-${field.api_name}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {field.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No custom fields found.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
