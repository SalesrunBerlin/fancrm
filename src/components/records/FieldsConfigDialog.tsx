import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FieldsConfigDialogProps {
  objectTypeId: string;
  onVisibilityChange: (fieldApiNames: string[]) => void;
}

export function FieldsConfigDialog({ objectTypeId, onVisibilityChange }: FieldsConfigDialogProps) {
  const { fields, isLoading } = useEnhancedFields(objectTypeId);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [orderedFields, setOrderedFields] = useState<ObjectField[]>([]);
  const [open, setOpen] = useState(false);

  // System fields to be available for selection
  const systemFields = [
    { 
      id: "sys_created_at", 
      api_name: "created_at", 
      name: "Created At", 
      is_required: true, 
      is_system: true,
      data_type: "datetime",
      object_type_id: objectTypeId,
      display_order: 1000,
      owner_id: "",
      created_at: new Date().toISOString()
    },
    { 
      id: "sys_updated_at", 
      api_name: "updated_at", 
      name: "Last Modified", 
      is_required: true, 
      is_system: true,
      data_type: "datetime",
      object_type_id: objectTypeId,
      display_order: 1001,
      owner_id: "",
      created_at: new Date().toISOString()
    },
    { 
      id: "sys_record_id", 
      api_name: "record_id", 
      name: "Record ID", 
      is_required: true, 
      is_system: true,
      data_type: "text",
      object_type_id: objectTypeId,
      display_order: 1002,
      owner_id: "",
      created_at: new Date().toISOString()
    }
  ];

  // Load selected fields from local storage on initial load
  useEffect(() => {
    if (fields && fields.length > 0) {
      const savedFields = localStorage.getItem(`visible-fields-${objectTypeId}`);
      if (savedFields) {
        const parsedFields = JSON.parse(savedFields);
        setSelectedFields(parsedFields);
      } else {
        // Default to first 5 fields if no saved configuration
        const defaultFields = fields.slice(0, 5).map(field => field.api_name);
        setSelectedFields(defaultFields);
      }
    }
  }, [fields, objectTypeId]);

  // Update ordered fields when fields or selected fields change
  useEffect(() => {
    if (fields) {
      // Create a map of selected field API names to their order
      const selectedFieldOrder = new Map(
        selectedFields.map((apiName, index) => [apiName, index])
      );

      // Sort fields to put selected fields first, in selection order
      const allFields = [...fields, ...systemFields];
      const orderedFieldsList = [...allFields].sort((a, b) => {
        const aSelected = selectedFields.includes(a.api_name);
        const bSelected = selectedFields.includes(b.api_name);

        if (aSelected && bSelected) {
          return selectedFieldOrder.get(a.api_name)! - selectedFieldOrder.get(b.api_name)!;
        }
        if (aSelected) return -1;
        if (bSelected) return 1;
        return a.name.localeCompare(b.name);
      });

      setOrderedFields(orderedFieldsList);
    }
  }, [fields, selectedFields, systemFields]);

  // Toggle field visibility
  const toggleField = (apiName: string) => {
    let newSelectedFields: string[];

    if (selectedFields.includes(apiName)) {
      newSelectedFields = selectedFields.filter(name => name !== apiName);
    } else {
      newSelectedFields = [...selectedFields, apiName];
    }

    setSelectedFields(newSelectedFields);
    onVisibilityChange(newSelectedFields);
    localStorage.setItem(`visible-fields-${objectTypeId}`, JSON.stringify(newSelectedFields));
  };

  // Move field up in the order
  const moveFieldUp = (apiName: string) => {
    const index = selectedFields.indexOf(apiName);
    if (index > 0) {
      const newSelectedFields = [...selectedFields];
      [newSelectedFields[index - 1], newSelectedFields[index]] = [newSelectedFields[index], newSelectedFields[index - 1]];
      setSelectedFields(newSelectedFields);
      onVisibilityChange(newSelectedFields);
      localStorage.setItem(`visible-fields-${objectTypeId}`, JSON.stringify(newSelectedFields));
    }
  };

  // Move field down in the order
  const moveFieldDown = (apiName: string) => {
    const index = selectedFields.indexOf(apiName);
    if (index >= 0 && index < selectedFields.length - 1) {
      const newSelectedFields = [...selectedFields];
      [newSelectedFields[index], newSelectedFields[index + 1]] = [newSelectedFields[index + 1], newSelectedFields[index]];
      setSelectedFields(newSelectedFields);
      onVisibilityChange(newSelectedFields);
      localStorage.setItem(`visible-fields-${objectTypeId}`, JSON.stringify(newSelectedFields));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Columns</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Visible Fields</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="arrange" className="mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="arrange">Column Arrangement</TabsTrigger>
            <TabsTrigger value="select">Select Fields</TabsTrigger>
          </TabsList>
          
          <TabsContent value="arrange" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Drag and drop or use arrows to reorder visible columns. Toggle switch to show/hide fields.
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {orderedFields.map((field) => {
                  const isSelected = selectedFields.includes(field.api_name);
                  const index = selectedFields.indexOf(field.api_name);
                  return (
                    <div
                      key={field.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border",
                        isSelected ? "border-primary bg-muted/50" : "border-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected && (
                          <div className="flex flex-col space-y-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => moveFieldUp(field.api_name)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                              <span className="sr-only">Move up</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => moveFieldDown(field.api_name)}
                              disabled={index === selectedFields.length - 1 || index === -1}
                            >
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Move down</span>
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="font-medium">{field.name}</div>
                          <div className="text-xs text-muted-foreground">{field.api_name}</div>
                        </div>
                      </div>
                      
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleField(field.api_name)}
                        aria-label={`Toggle ${field.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="select">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {orderedFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center space-x-2"
                  >
                    <div
                      className={cn(
                        "flex flex-1 items-center rounded-md border p-2",
                        selectedFields.includes(field.api_name) 
                          ? "border-primary bg-primary/10" 
                          : "border-muted"
                      )}
                      onClick={() => toggleField(field.api_name)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{field.name}</div>
                        <div className="text-xs text-muted-foreground">{field.api_name}</div>
                      </div>
                      
                      {selectedFields.includes(field.api_name) && (
                        <CheckIcon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onVisibilityChange(selectedFields);
              setOpen(false);
            }}
          >
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
