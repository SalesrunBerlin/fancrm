
import { useState, useEffect, useMemo, useCallback } from "react";
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
  
  // Stable reference for objectIds
  const stableObjectIds = useMemo(() => objectIds, [objectIds.join(',')]);
  
  // Stable reference for filters
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  
  // Initialize active tab if needed
  useEffect(() => {
    if (stableObjectIds.length > 0 && (!activeTab || !stableObjectIds.includes(activeTab))) {
      setActiveTab(stableObjectIds[0]);
    }
  }, [stableObjectIds, activeTab]);
  
  // Initialize filters by object - only when inputs change
  useEffect(() => {
    // Group existing filters by object
    const groupedFilters: Record<string, FilterCondition[]> = {};
    
    stableObjectIds.forEach(objId => {
      groupedFilters[objId] = stableFilters.filter(filter => {
        // Just store filters based on objectId for now, 
        // we'll validate them when rendering each tab
        return true;
      });
    });
    
    setObjectFilters(groupedFilters);
  }, [stableObjectIds, stableFilters]);
  
  // Handle filter changes for a specific object
  const handleFilterChange = useCallback((objectTypeId: string, newFilters: FilterCondition[]) => {
    // Update filters for this object
    setObjectFilters(prevFilters => {
      const updatedObjectFilters = {
        ...prevFilters,
        [objectTypeId]: newFilters
      };
      
      // Combine all filters and update parent
      const allFilters = Object.values(updatedObjectFilters).flat();
      onChange(allFilters);
      
      return updatedObjectFilters;
    });
  }, [onChange]);
  
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
          {stableObjectIds.map(objectId => {
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
        
        {stableObjectIds.map(objectId => (
          <TabsContent key={objectId} value={objectId}>
            {activeTab === objectId && (
              <FilterTabContent 
                objectId={objectId}
                filters={objectFilters[objectId] || []}
                onFilterChange={(newFilters) => handleFilterChange(objectId, newFilters)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// This separate component allows us to use hooks for each tab
function FilterTabContent({ 
  objectId,
  filters,
  onFilterChange
}: { 
  objectId: string;
  filters: FilterCondition[];
  onFilterChange: (filters: FilterCondition[]) => void;
}) {
  // Use useMemo to prevent unnecessary rerendering
  const { fields } = useObjectFields(objectId);

  // Memoize filters to prevent unnecessary rerenders
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  return (
    <Card>
      <CardContent className="p-4">
        <ObjectRecordsFilter
          objectTypeId={objectId}
          fields={fields}
          onFilterChange={onFilterChange}
          activeFilters={stableFilters}
        />
      </CardContent>
    </Card>
  );
}
