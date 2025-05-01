
import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { AlertCircle, Loader2, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Reorganize props to match the component usage
export interface BatchFieldCreationProps {
  objectTypeId: string;
  data: any[]; // Renamed from importData
  onComplete: (createdFields: any[]) => void; // Changed from onFieldCreation
  onBack: () => void;
}

interface FieldConfig {
  columnName: string;
  name: string;
  apiName: string;
  dataType: string;
  isRequired: boolean;
  status: "pending" | "creating" | "success" | "error";
  error?: string;
  uniqueValues?: string[];
  createPicklistValues?: boolean;
  picklistValuesStatus?: "pending" | "creating" | "success" | "error";
}

export function BatchFieldCreation({ 
  objectTypeId,
  data,
  onComplete,
  onBack
}: BatchFieldCreationProps) {
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createField } = useObjectFields(objectTypeId);
  const { objectTypes } = useObjectTypes();
  const { addBatchPicklistValues } = usePicklistCreation(null);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  // Extract column names and unique values from the data
  useEffect(() => {
    if (!data || data.length === 0) {
      console.warn("No data available for field creation");
      return;
    }
    
    try {
      // Extract column names from the first record
      const firstRecord = data[0];
      const columnNames = Object.keys(firstRecord);
      
      // Create a map of column names to their unique values
      const columnDataMap: { [columnName: string]: string[] } = {};
      
      // Collect all unique values per column
      columnNames.forEach(columnName => {
        const valuesSet = new Set<string>();
        data.forEach(item => {
          if (item[columnName] && typeof item[columnName] === 'string' && item[columnName].trim() !== '') {
            valuesSet.add(item[columnName].trim());
          }
        });
        columnDataMap[columnName] = Array.from(valuesSet);
      });
      
      // Initialize field configs
      const configs = columnNames.map(name => {
        // Get unique values for this column
        const uniqueValues = columnDataMap[name] || [];
        
        // Create properly typed field config
        const config: FieldConfig = {
          columnName: name,
          name: name,
          apiName: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          dataType: "text",
          isRequired: false,
          status: "pending",
          uniqueValues,
          createPicklistValues: uniqueValues.length > 0
        };
        
        return config;
      });
      
      setFieldConfigs(configs);
    } catch (error) {
      console.error("Error initializing field configs:", error);
      toast({
        title: "Error",
        description: "Failed to process import data for field creation",
        variant: "destructive",
      });
    }
  }, [data, toast]);

  const handleFieldChange = (index: number, field: Partial<FieldConfig>) => {
    const newConfigs = [...fieldConfigs];
    newConfigs[index] = { ...newConfigs[index], ...field };
    
    // If name is updated, suggest an API name
    if (field.name) {
      newConfigs[index].apiName = field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }
    
    // Reset picklist values creation flag when data type changes
    if (field.dataType && field.dataType !== 'picklist') {
      newConfigs[index].createPicklistValues = false;
    } else if (field.dataType === 'picklist') {
      // Enable picklist values creation by default if there are unique values
      newConfigs[index].createPicklistValues = newConfigs[index].uniqueValues && 
        newConfigs[index].uniqueValues.length > 0;
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
    const createdFields: any[] = [];
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
          createdFields.push(field);
          
          // If it's a picklist field and we need to create picklist values
          if (config.dataType === "picklist" && 
              config.createPicklistValues && 
              config.uniqueValues && 
              config.uniqueValues.length > 0) {
            
            // Update status for picklist values creation
            newConfigs[i].picklistValuesStatus = "creating";
            setFieldConfigs([...newConfigs]);
            
            try {
              // Create picklist values for this field
              const success = await addBatchPicklistValues(field.id, config.uniqueValues);
              
              if (success) {
                newConfigs[i].picklistValuesStatus = "success";
                toast({
                  title: "Success",
                  description: `Created ${config.uniqueValues.length} picklist values for '${config.name}'`,
                });
              } else {
                newConfigs[i].picklistValuesStatus = "error";
                toast({
                  title: "Warning",
                  description: `Some picklist values for '${config.name}' could not be created`,
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Error creating picklist values:", error);
              newConfigs[i].picklistValuesStatus = "error";
              toast({
                title: "Error",
                description: `Failed to create picklist values for '${config.name}'`,
                variant: "destructive",
              });
            }
            
            setFieldConfigs([...newConfigs]);
          }
          
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

  // Function to render picklist values preview and toggle
  const renderPicklistValuesSection = (config: FieldConfig, index: number) => {
    if (config.dataType !== "picklist" || !config.uniqueValues || config.uniqueValues.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.createPicklistValues || false}
              onCheckedChange={(checked) => 
                handleFieldChange(index, { createPicklistValues: checked })}
              disabled={isCreating || config.status === "success"}
            />
            <Label>Create picklist values automatically</Label>
          </div>
          <Badge variant="outline">
            {config.uniqueValues.length} unique values found
          </Badge>
        </div>
        
        {config.createPicklistValues && (
          <div className="border rounded-md p-2 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Preview of values:</p>
            <ScrollArea className="h-20">
              <div className="flex flex-wrap gap-1">
                {config.uniqueValues.map((value, i) => (
                  <Badge key={i} variant="outline" className="bg-background">
                    {value}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Status indicator for picklist values creation */}
        {config.status === "success" && config.picklistValuesStatus && (
          <div className="text-sm">
            {config.picklistValuesStatus === "creating" && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Creating picklist values...</span>
              </div>
            )}
            {config.picklistValuesStatus === "success" && (
              <div className="flex items-center space-x-2 text-green-500">
                <Check className="h-3 w-3" />
                <span>Picklist values created</span>
              </div>
            )}
            {config.picklistValuesStatus === "error" && (
              <div className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span>Error creating some picklist values</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Show loading message if we're waiting for data to process
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <p>No data available to create fields. Please go back and try again.</p>
        <Button onClick={onBack} variant="outline" className="ml-2">
          Back
        </Button>
      </div>
    );
  }

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
                    <div className="space-y-2">
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
                      
                      {/* Render picklist values section if applicable */}
                      {renderPicklistValuesSection(config, index)}
                    </div>
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
        <Button variant="outline" onClick={onBack} disabled={isCreating}>
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
