
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BatchFieldCreationProps {
  objectTypeId: string;
  columnNames: string[];
  onComplete: (createdFields: { columnName: string; fieldId: string }[]) => void;
  onCancel: () => void;
}

interface FieldConfig {
  columnName: string;
  name: string;
  apiName: string;
  dataType: string;
  isRequired: boolean;
  status: "pending" | "creating" | "success" | "error";
  error?: string;
}

export function BatchFieldCreation({ 
  objectTypeId,
  columnNames,
  onComplete,
  onCancel
}: BatchFieldCreationProps) {
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>(
    columnNames.map(name => ({
      columnName: name,
      name: name,
      apiName: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      dataType: "text",
      isRequired: false,
      status: "pending"
    }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createField } = useObjectFields(objectTypeId);
  const { objectTypes } = useObjectTypes();
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const handleFieldChange = (index: number, field: Partial<FieldConfig>) => {
    const newConfigs = [...fieldConfigs];
    newConfigs[index] = { ...newConfigs[index], ...field };
    
    // If name is updated, suggest an API name
    if (field.name) {
      newConfigs[index].apiName = field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
    
    setFieldConfigs(newConfigs);
  };

  const validateFields = () => {
    let valid = true;
    const newConfigs = [...fieldConfigs];
    const apiNames = new Set<string>();
    
    // Validate each field
    newConfigs.forEach((config, index) => {
      // Check for empty names
      if (!config.name.trim()) {
        newConfigs[index].status = "error";
        newConfigs[index].error = "Field name cannot be empty";
        valid = false;
      }
      
      // Check for empty API names
      else if (!config.apiName.trim()) {
        newConfigs[index].status = "error";
        newConfigs[index].error = "API name cannot be empty";
        valid = false;
      }
      
      // Check for duplicate API names
      else if (apiNames.has(config.apiName)) {
        newConfigs[index].status = "error";
        newConfigs[index].error = "API name must be unique";
        valid = false;
      }
      else {
        apiNames.add(config.apiName);
        newConfigs[index].status = "pending";
        newConfigs[index].error = undefined;
      }
    });
    
    setFieldConfigs(newConfigs);
    return valid;
  };

  const handleCreateFields = async () => {
    if (!validateFields()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    // Create fields one by one
    const createdFields: { columnName: string; fieldId: string }[] = [];
    const newConfigs = [...fieldConfigs];
    
    try {
      for (let i = 0; i < newConfigs.length; i++) {
        const config = newConfigs[i];
        newConfigs[i].status = "creating";
        setFieldConfigs([...newConfigs]);
        
        try {
          const field = await createField.mutateAsync({
            name: config.name,
            api_name: config.apiName,
            data_type: config.dataType,
            is_required: config.isRequired,
            object_type_id: objectTypeId
          });
          
          newConfigs[i].status = "success";
          createdFields.push({
            columnName: config.columnName,
            fieldId: field.id
          });
        } catch (error) {
          console.error("Error creating field:", error);
          newConfigs[i].status = "error";
          newConfigs[i].error = error instanceof Error ? error.message : "Unknown error";
          setFieldConfigs([...newConfigs]);
          
          // Show toast for the error
          toast({
            title: "Error",
            description: `Failed to create field '${config.name}'`,
            variant: "destructive",
          });
        }
      }
      
      // Check if we have any errors
      const hasErrors = newConfigs.some(config => config.status === "error");
      
      if (!hasErrors) {
        toast({
          title: "Success",
          description: `Created ${createdFields.length} fields for ${objectType?.name || 'object'}`,
        });
        onComplete(createdFields);
      }
    } finally {
      setIsCreating(false);
      setFieldConfigs([...newConfigs]);
    }
  };
  
  const dataTypeOptions = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Text Area" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "Date/Time" },
    { value: "checkbox", label: "Checkbox" },
    { value: "picklist", label: "Picklist" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Create Fields for {objectType?.name || 'Import'}</h2>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure the fields below before continuing with the import. All fields must be created first.
        </AlertDescription>
      </Alert>
      
      <Card>
        <div className="p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column Name</TableHead>
                <TableHead>Field Name</TableHead>
                <TableHead>API Name</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldConfigs.map((config, index) => (
                <TableRow key={index}>
                  <TableCell>{config.columnName}</TableCell>
                  <TableCell>
                    <Input
                      value={config.name}
                      onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                      disabled={isCreating || config.status === "success"}
                      className={config.error && config.error.includes("name") ? "border-destructive" : ""}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={config.apiName}
                      onChange={(e) => handleFieldChange(index, { apiName: e.target.value })}
                      disabled={isCreating || config.status === "success"}
                      className={config.error && config.error.includes("API name") ? "border-destructive" : ""}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={config.dataType}
                      onValueChange={(value) => handleFieldChange(index, { dataType: value })}
                      disabled={isCreating || config.status === "success"}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.isRequired}
                        onCheckedChange={(checked) => handleFieldChange(index, { isRequired: checked })}
                        disabled={isCreating || config.status === "success"}
                      />
                      <Label>Required</Label>
                    </div>
                  </TableCell>
                  <TableCell>
                    {config.status === "pending" && <span className="text-muted-foreground">Pending</span>}
                    {config.status === "creating" && (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    )}
                    {config.status === "success" && <span className="text-green-500">Created</span>}
                    {config.status === "error" && (
                      <div className="text-destructive text-sm">
                        Error: {config.error}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isCreating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateFields} 
          disabled={isCreating || fieldConfigs.length === 0}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Fields...
            </>
          ) : (
            <>
              Create {fieldConfigs.length} Fields
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
