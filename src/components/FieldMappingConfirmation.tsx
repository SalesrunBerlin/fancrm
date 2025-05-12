
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export interface FieldMappingItem {
  sourceField: string;
  sourceValue: string;
  targetObject: "companies" | "persons";
  targetField: string;
}

export interface FieldMappingConfirmationProps {
  data: {
    company: string;
    address: string;
    phone: string | null;
    email: string | null;
    ceos: string[];
    source?: string; 
  };
  onBack: () => void;
  onSubmit: (mappings: FieldMappingItem[], customFields: CustomField[]) => Promise<void>;
  isLoading?: boolean;
}

export interface CustomField {
  targetObject: "companies" | "persons";
  targetField: string;
  value: string;
}

export interface AvailableField {
  name: string;
  api_name: string;
  data_type: string;
  object_id: string;
}

export const FieldMappingConfirmation: React.FC<FieldMappingConfirmationProps> = ({
  data,
  onBack,
  onSubmit,
  isLoading = false,
}) => {
  const [mappings, setMappings] = useState<FieldMappingItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [companyFields, setCompanyFields] = useState<AvailableField[]>([]);
  const [personFields, setPersonFields] = useState<AvailableField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);

  // Fetch available fields for companies and persons
  useEffect(() => {
    const fetchFields = async () => {
      setIsLoadingFields(true);
      try {
        // Fetch company fields
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .limit(0);

        if (companyError) throw companyError;

        // Get column information for companies
        const companyColumns = Object.keys(companyData?.length ? companyData[0] : {})
          .filter(col => !['id', 'created_at', 'updated_at', 'owner_id'].includes(col))
          .map(col => ({
            name: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '),
            api_name: col,
            data_type: 'text',
            object_id: 'companies'
          }));

        // Fetch person fields
        const { data: personData, error: personError } = await supabase
          .from('persons')
          .select('*')
          .limit(0);

        if (personError) throw personError;

        // Get column information for persons
        const personColumns = Object.keys(personData?.length ? personData[0] : {})
          .filter(col => !['id', 'created_at', 'updated_at', 'owner_id', 'company_id'].includes(col))
          .map(col => ({
            name: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '),
            api_name: col,
            data_type: 'text',
            object_id: 'persons'
          }));

        setCompanyFields(companyColumns);
        setPersonFields(personColumns);

        // Setup initial mappings based on data
        const initialMappings: FieldMappingItem[] = [];

        if (data.company) {
          initialMappings.push({
            sourceField: 'company',
            sourceValue: data.company,
            targetObject: 'companies',
            targetField: 'name',
          });
        }

        if (data.address) {
          initialMappings.push({
            sourceField: 'address',
            sourceValue: data.address,
            targetObject: 'companies',
            targetField: 'address',
          });
        }

        if (data.phone) {
          initialMappings.push({
            sourceField: 'phone',
            sourceValue: data.phone,
            targetObject: 'companies',
            targetField: 'phone',
          });
        }

        if (data.email) {
          initialMappings.push({
            sourceField: 'email',
            sourceValue: data.email,
            targetObject: 'companies',
            targetField: 'email',
          });
        }

        // For CEOs, we'll add them as person mappings
        if (data.ceos && data.ceos.length > 0) {
          data.ceos.forEach((ceo, index) => {
            initialMappings.push({
              sourceField: `ceo-${index}`,
              sourceValue: ceo,
              targetObject: 'persons',
              targetField: 'full_name',
            });
          });
        }

        setMappings(initialMappings);

        // Add website field as a custom field if website is in company fields
        if (companyColumns.some(f => f.api_name === 'website') && data.source) {
          setCustomFields([{
            targetObject: 'companies',
            targetField: 'website',
            value: data.source
          }]);
        }

      } catch (error) {
        console.error("Error fetching available fields:", error);
        toast({
          title: "Error",
          description: "Failed to load available fields",
          variant: "destructive"
        });
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchFields();
  }, [data]);

  const handleMappingChange = (index: number, field: keyof FieldMappingItem, value: string) => {
    const newMappings = [...mappings];
    
    if (field === 'targetObject') {
      newMappings[index][field] = value as "companies" | "persons";
      // Reset target field when object type changes
      newMappings[index].targetField = '';
    } else {
      (newMappings[index][field] as string) = value;
    }
    
    setMappings(newMappings);
  };

  const handleCustomFieldChange = (index: number, field: keyof CustomField, value: string) => {
    const newCustomFields = [...customFields];
    
    if (field === 'targetObject') {
      newCustomFields[index][field] = value as "companies" | "persons";
      // Reset target field when object type changes
      newCustomFields[index].targetField = '';
    } else {
      (newCustomFields[index][field] as string) = value;
    }
    
    setCustomFields(newCustomFields);
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { targetObject: 'companies', targetField: '', value: '' }
    ]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate mappings
    const invalidMappings = mappings.filter(m => !m.targetField);
    
    if (invalidMappings.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select a target field for all mappings",
        variant: "destructive"
      });
      return;
    }

    // Validate custom fields
    const invalidCustomFields = customFields.filter(f => !f.targetField || !f.value.trim());
    
    if (invalidCustomFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please complete all custom fields or remove them",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(mappings, customFields);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  };

  const getAvailableFields = (targetObject: "companies" | "persons") => {
    return targetObject === "companies" ? companyFields : personFields;
  };

  if (isLoadingFields) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading available fields...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Extracted Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mappings">
          <TabsList className="mb-4">
            <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
            <TabsTrigger value="additional">Additional Fields</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mappings" className="space-y-6">
            <div className="space-y-2">
              <Label className="text-md font-semibold">Map Extracted Fields to Database</Label>
              <p className="text-sm text-muted-foreground">
                Specify how each extracted field should be stored in your database
              </p>
            </div>

            {mappings.map((mapping, index) => (
              <div key={`mapping-${index}`} className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Source Field</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {mapping.sourceField === 'company' ? 'Company Name' : 
                         mapping.sourceField === 'address' ? 'Address' : 
                         mapping.sourceField === 'phone' ? 'Phone Number' :
                         mapping.sourceField === 'email' ? 'Email Address' :
                         mapping.sourceField.startsWith('ceo') ? 'Managing Director' : mapping.sourceField}
                      </Badge>
                      <span className="text-sm">{mapping.sourceValue}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`mapping-object-${index}`}>Target Object</Label>
                    <Select
                      value={mapping.targetObject}
                      onValueChange={(value) => handleMappingChange(index, 'targetObject', value)}
                    >
                      <SelectTrigger id={`mapping-object-${index}`} className="w-full mt-1">
                        <SelectValue placeholder="Select object" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="companies">Company</SelectItem>
                        <SelectItem value="persons">Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`mapping-field-${index}`}>Target Field</Label>
                    <Select
                      value={mapping.targetField}
                      onValueChange={(value) => handleMappingChange(index, 'targetField', value)}
                    >
                      <SelectTrigger id={`mapping-field-${index}`} className="w-full mt-1">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFields(mapping.targetObject).map((field) => (
                          <SelectItem key={field.api_name} value={field.api_name}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="additional" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-md font-semibold">Additional Fields</Label>
                <p className="text-sm text-muted-foreground">
                  Add more fields that were not automatically detected
                </p>
              </div>
              <Button 
                onClick={addCustomField} 
                type="button" 
                variant="outline" 
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Field
              </Button>
            </div>

            {customFields.map((field, index) => (
              <div key={`custom-${index}`} className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Additional Field #{index + 1}</Label>
                  <Button 
                    onClick={() => removeCustomField(index)} 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <Minus className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`custom-object-${index}`}>Target Object</Label>
                    <Select
                      value={field.targetObject}
                      onValueChange={(value) => handleCustomFieldChange(index, 'targetObject', value)}
                    >
                      <SelectTrigger id={`custom-object-${index}`} className="w-full mt-1">
                        <SelectValue placeholder="Select object" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="companies">Company</SelectItem>
                        <SelectItem value="persons">Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`custom-field-${index}`}>Target Field</Label>
                    <Select
                      value={field.targetField}
                      onValueChange={(value) => handleCustomFieldChange(index, 'targetField', value)}
                    >
                      <SelectTrigger id={`custom-field-${index}`} className="w-full mt-1">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFields(field.targetObject).map((availField) => (
                          <SelectItem key={availField.api_name} value={availField.api_name}>
                            {availField.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`custom-value-${index}`}>Value</Label>
                    <Input
                      id={`custom-value-${index}`}
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}

            {customFields.length === 0 && (
              <div className="text-center py-8 border rounded-md bg-gray-50 text-gray-500">
                No additional fields defined. Click "Add Field" to add one.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-4 border-t flex justify-between">
          <Button 
            onClick={onBack} 
            type="button" 
            variant="outline"
          >
            Back
          </Button>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Records'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
