
import { useState, useEffect } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportField } from "@/types/report";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ensure we have a selected tab when objects change
  useEffect(() => {
    if (objectIds.length > 0 && (!activeTab || !objectIds.includes(activeTab))) {
      setActiveTab(objectIds[0]);
    }
  }, [objectIds, activeTab]);
  
  // Get fields for active object tab
  const { fields } = useObjectFields(activeTab || undefined);
  
  // Filter fields based on search term
  const filteredFields = searchTerm 
    ? fields.filter(field => 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.api_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : fields;
  
  // Check if a field is selected
  const isFieldSelected = (objectTypeId: string, fieldApiName: string) => {
    return selectedFields.some(
      field => field.objectTypeId === objectTypeId && field.fieldApiName === fieldApiName
    );
  };
  
  // Toggle field selection
  const toggleField = (field: {
    id: string;
    name: string;
    api_name: string;
    object_type_id: string;
  }) => {
    const objectTypeId = field.object_type_id;
    const fieldApiName = field.api_name;
    
    if (isFieldSelected(objectTypeId, fieldApiName)) {
      // Remove field
      onChange(
        selectedFields.filter(f => 
          !(f.objectTypeId === objectTypeId && f.fieldApiName === fieldApiName)
        )
      );
    } else {
      // Add field
      const newField: ReportField = {
        objectTypeId,
        fieldApiName,
        displayName: field.name,
        isVisible: true,
        order: selectedFields.length // Add to end
      };
      onChange([...selectedFields, newField]);
    }
  };
  
  // If no objects are selected, show a message
  if (objectIds.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Please select at least one object first.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
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
        
        {objectIds.map(objectId => (
          <TabsContent key={objectId} value={objectId}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fields..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Field Name</TableHead>
                        <TableHead>API Name</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFields.map(field => (
                        <TableRow 
                          key={field.id}
                          className="cursor-pointer"
                          onClick={() => toggleField(field)}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={isFieldSelected(field.object_type_id, field.api_name)}
                              onCheckedChange={() => toggleField(field)}
                            />
                          </TableCell>
                          <TableCell>{field.name}</TableCell>
                          <TableCell className="font-mono text-xs">{field.api_name}</TableCell>
                          <TableCell>{field.data_type}</TableCell>
                        </TableRow>
                      ))}
                      
                      {filteredFields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No fields found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-6">
        <h3 className="font-medium mb-4">Selected Fields ({selectedFields.length})</h3>
        {selectedFields.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Object</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Display Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedFields.map((field, index) => {
                    const objectType = objectTypes?.find(obj => obj.id === field.objectTypeId);
                    const fieldDef = fields.find(f => 
                      f.object_type_id === field.objectTypeId && f.api_name === field.fieldApiName
                    );
                    
                    return (
                      <TableRow key={`${field.objectTypeId}_${field.fieldApiName}`}>
                        <TableCell>
                          <Checkbox 
                            checked={field.isVisible}
                            onCheckedChange={(checked) => {
                              const updatedFields = [...selectedFields];
                              updatedFields[index] = {
                                ...updatedFields[index],
                                isVisible: !!checked
                              };
                              onChange(updatedFields);
                            }}
                          />
                        </TableCell>
                        <TableCell>{objectType?.name || "Unknown"}</TableCell>
                        <TableCell>{fieldDef?.name || field.fieldApiName}</TableCell>
                        <TableCell>
                          <Input 
                            value={field.displayName} 
                            onChange={(e) => {
                              const updatedFields = [...selectedFields];
                              updatedFields[index] = {
                                ...updatedFields[index],
                                displayName: e.target.value
                              };
                              onChange(updatedFields);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-4 text-muted-foreground border rounded-md">
            No fields selected. Select fields from the tabs above.
          </div>
        )}
      </div>
    </div>
  );
}
