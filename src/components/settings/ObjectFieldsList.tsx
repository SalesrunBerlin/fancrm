import { useState, useEffect } from "react";
import { useObjectFields } from "@/hooks/useObjectFields";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2, Save, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectField } from "@/hooks/useObjectTypes";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { ObjectFieldEdit } from "./ObjectFieldEdit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ObjectFieldsListProps {
  fields: ObjectField[];
  isLoading: boolean;
  objectTypeId: string;
}

export function ObjectFieldsList({ fields, isLoading, objectTypeId }: ObjectFieldsListProps) {
  const { deleteField } = useObjectFields(objectTypeId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<ObjectField | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<ObjectField | null>(null);
  const [defaultDisplayField, setDefaultDisplayField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempDisplayField, setTempDisplayField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentDefaultField = async () => {
    const { data, error } = await supabase
      .from('object_types')
      .select('default_field_api_name')
      .eq('id', objectTypeId)
      .single();
    
    if (data?.default_field_api_name) {
      console.log('Current default field:', data.default_field_api_name);
      setDefaultDisplayField(data.default_field_api_name);
      setTempDisplayField(data.default_field_api_name);
    }
  };

  const handleDefaultFieldChange = (value: string) => {
    const selectedField = fields.find(f => f.api_name === value);
    if (selectedField) {
      console.log('Setting default field:', { value, apiName: selectedField.api_name });
      setTempDisplayField(selectedField.api_name);
      setIsEditing(true);
      setError(null);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('Saving default field:', tempDisplayField);
      
      const { error: updateError } = await supabase
        .from('object_types')
        .update({ default_field_api_name: tempDisplayField })
        .eq('id', objectTypeId);

      if (updateError) throw updateError;

      setDefaultDisplayField(tempDisplayField);
      setIsEditing(false);

      // Optimistically update the cache
      queryClient.setQueryData(["object-types"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((type: any) => 
          type.id === objectTypeId 
            ? { ...type, default_field_api_name: tempDisplayField }
            : type
        );
      });

      // Then invalidate to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["object-record"] });
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      
      toast({
        title: "Success",
        description: "Default display field updated",
      });
    } catch (error) {
      console.error("Error updating default field:", error);
      setError("Failed to update default display field. Please try again.");
      toast({
        title: "Error",
        description: "Failed to update default display field",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempDisplayField(defaultDisplayField);
    setIsEditing(false);
    setError(null);
  };

  useEffect(() => {
    fetchCurrentDefaultField();
  }, [objectTypeId]);

  const handleDeleteField = async () => {
    if (!fieldToDelete) return;
    
    await deleteField.mutateAsync(fieldToDelete.id);
    setFieldToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No fields found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Fields</h3>
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={tempDisplayField || ''} 
                      onValueChange={handleDefaultFieldChange}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select default field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.api_name} value={field.api_name}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select the default display field for this object type</p>
                </TooltipContent>
              </Tooltip>

              {isEditing && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </TooltipProvider>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <DeleteDialog
        isOpen={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        onConfirm={handleDeleteField}
        title="Delete Field"
        description={`Are you sure you want to delete the field "${fieldToDelete?.name}"? This action cannot be undone.`}
      />

      {editingField && (
        <ObjectFieldEdit
          field={editingField}
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field Name</TableHead>
            <TableHead>API Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium">
                {field.name}
                {field.is_system && (
                  <Badge variant="outline" className="ml-2">
                    System
                  </Badge>
                )}
              </TableCell>
              <TableCell>{field.api_name}</TableCell>
              <TableCell>{field.data_type}</TableCell>
              <TableCell>{field.is_required ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingField(field)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFieldToDelete(field)}
                    disabled={field.is_system}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
