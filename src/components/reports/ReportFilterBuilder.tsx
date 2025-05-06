
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { ObjectRecordsFilter } from "@/components/records/ObjectRecordsFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReportFilterBuilderProps {
  objectIds: string[];
  filters: FilterCondition[];
  onChange: (filters: FilterCondition[]) => void;
}

export function ReportFilterBuilder({ 
  objectIds, 
  filters,
  onChange 
}: ReportFilterBuilderProps) {
  const { objectTypes } = useObjectTypes();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [objectFilters, setObjectFilters] = useState<Record<string, FilterCondition[]>>({});
  
  // Initialize active tab if needed
  useEffect(() => {
    if (objectIds.length > 0 && (!activeTab || !objectIds.includes(activeTab))) {
      setActiveTab(objectIds[0]);
    }
  }, [objectIds, activeTab]);
  
  // Initialize filters by object
  useEffect(() => {
    // Group existing filters by object
    const groupedFilters: Record<string, FilterCondition[]> = {};
    
    objectIds.forEach(objId => {
      // Get field definitions for this object
      const { fields } = useObjectFields(objId);
      
      // Find filters that belong to this object type's fields
      const objFilters = filters.filter(filter => {
        const filterField = fields.find(field => field.api_name === filter.fieldApiName);
        return !!filterField;
      });
      
      groupedFilters[objId] = objFilters;
    });
    
    setObjectFilters(groupedFilters);
  }, [objectIds, filters]);
  
  // Handle filter changes for a specific object
  const handleFilterChange = (objectTypeId: string, newFilters: FilterCondition[]) => {
    // Update filters for this object
    const updatedObjectFilters = {
      ...objectFilters,
      [objectTypeId]: newFilters
    };
    
    setObjectFilters(updatedObjectFilters);
    
    // Combine all filters and update parent
    const allFilters = Object.values(updatedObjectFilters).flat();
    onChange(allFilters);
  };
  
  if (objectIds.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Please select at least one object first.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Filter Report Data</h3>
      
      <Tabs value={activeTab || ""} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {objectIds.map(objectId => {
            const objectType = objectTypes?.find(obj => obj.id === objectId);
            const filterCount = objectFilters[objectId]?.length || 0;
            
            return (
              <TabsTrigger key={objectId} value={objectId}>
                {objectType?.name || "Object"}
                {filterCount > 0 && ` (${filterCount})`}
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {objectIds.map(objectId => {
          const { fields } = useObjectFields(objectId);
          
          return (
            <TabsContent key={objectId} value={objectId}>
              <Card>
                <CardContent className="p-4">
                  <ObjectRecordsFilter
                    objectTypeId={objectId}
                    fields={fields}
                    onFilterChange={(newFilters) => handleFilterChange(objectId, newFilters)}
                    activeFilters={objectFilters[objectId] || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
