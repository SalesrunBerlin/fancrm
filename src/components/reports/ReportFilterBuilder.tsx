
import { useState, useEffect, useMemo } from "react";
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
  
  // Memoize object IDs and filters to prevent unnecessary rerenders
  const memoizedObjectIds = useMemo(() => objectIds, [objectIds.join(',')]);
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  
  // Initialize active tab if needed
  useEffect(() => {
    if (memoizedObjectIds.length > 0 && (!activeTab || !memoizedObjectIds.includes(activeTab))) {
      setActiveTab(memoizedObjectIds[0]);
    }
  }, [memoizedObjectIds, activeTab]);
  
  // Initialize filters by object - only when inputs change
  useEffect(() => {
    // Group existing filters by object
    const groupedFilters: Record<string, FilterCondition[]> = {};
    
    memoizedObjectIds.forEach(objId => {
      groupedFilters[objId] = memoizedFilters.filter(filter => {
        // Just store filters based on objectId for now, 
        // we'll validate them when rendering each tab
        return true;
      });
    });
    
    setObjectFilters(groupedFilters);
  }, [memoizedObjectIds, memoizedFilters]);
  
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
          {memoizedObjectIds.map(objectId => {
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
        
        {memoizedObjectIds.map(objectId => (
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
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  return (
    <Card>
      <CardContent className="p-4">
        <ObjectRecordsFilter
          objectTypeId={objectId}
          fields={fields}
          onFilterChange={onFilterChange}
          activeFilters={memoizedFilters}
        />
      </CardContent>
    </Card>
  );
}
