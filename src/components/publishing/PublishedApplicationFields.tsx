
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { PublishedField } from '@/hooks/usePublishedApplications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface PublishedApplicationFieldsProps {
  objectTypeId: string;
  objectName: string;
  selectedFields: Record<string, boolean>;
  onFieldSelectionChange: (fieldId: string, isSelected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

export function PublishedApplicationFields({
  objectTypeId,
  objectName,
  selectedFields,
  onFieldSelectionChange,
  onSelectAll
}: PublishedApplicationFieldsProps) {
  const [fields, setFields] = useState<PublishedField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allSelected, setAllSelected] = useState(false);

  // Fetch fields for this object
  useEffect(() => {
    const fetchFields = async () => {
      setIsLoading(true);
      try {
        // Get all fields for this object
        const { data, error } = await supabase
          .from("object_fields")
          .select(`
            id,
            name,
            api_name,
            data_type,
            is_required,
            is_system
          `)
          .eq("object_type_id", objectTypeId);

        if (error) throw error;

        // Get publishing status for each field
        const { data: publishingData, error: publishingError } = await supabase
          .from("object_field_publishing")
          .select("*")
          .eq("object_type_id", objectTypeId);

        if (publishingError) throw publishingError;

        // Create a map of field_id to publishing status
        const publishingMap = publishingData.reduce((acc: Record<string, boolean>, item: any) => {
          acc[item.field_id] = item.is_included;
          return acc;
        }, {});

        // Format the fields with publishing status
        const formattedFields = data.map((field: any) => ({
          id: crypto.randomUUID(),
          object_type_id: objectTypeId,
          field_id: field.id,
          field_api_name: field.api_name,
          is_included: publishingMap[field.id] !== undefined ? publishingMap[field.id] : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          field: {
            id: field.id,
            name: field.name,
            api_name: field.api_name,
            data_type: field.data_type
          }
        }));

        setFields(formattedFields);

        // Update selectAll state
        updateSelectAllState(formattedFields, selectedFields);
      } catch (error) {
        console.error('Error fetching fields:', error);
        toast.error("Failed to load fields");
      } finally {
        setIsLoading(false);
      }
    };

    if (objectTypeId) {
      fetchFields();
    }
  }, [objectTypeId, selectedFields]);

  // Update selectAll state whenever selectedFields changes
  useEffect(() => {
    updateSelectAllState(fields, selectedFields);
  }, [selectedFields, fields]);

  const updateSelectAllState = (fieldsList: PublishedField[], selections: Record<string, boolean>) => {
    if (!fieldsList.length) return;
    
    const allFieldsSelected = fieldsList.every(field => 
      selections[field.field_id] !== false
    );
    
    setAllSelected(allFieldsSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    setAllSelected(checked);
    onSelectAll(checked);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4 h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!fields.length) {
    return (
      <div className="text-center p-4 border rounded-md">
        <p className="text-muted-foreground">No fields found for this object</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{objectName}</CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`select-all-${objectTypeId}`}
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor={`select-all-${objectTypeId}`} className="text-xs">
              Select All
            </label>
          </div>
        </div>
        <CardDescription>
          Select which fields to include from this object
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-64 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {fields.map((field) => (
              <div key={field.field_id} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox 
                  id={`field-${field.field_id}`}
                  checked={selectedFields[field.field_id] !== false}
                  onCheckedChange={(checked) => onFieldSelectionChange(field.field_id, !!checked)}
                />
                <div className="flex-1">
                  <label 
                    htmlFor={`field-${field.field_id}`} 
                    className="text-sm cursor-pointer"
                  >
                    {field.field?.name || field.field_api_name}
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">
                      {field.field_api_name}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {field.field?.data_type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
