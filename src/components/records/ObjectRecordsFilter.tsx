// Update import for FilterCondition
import React, { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { FilterField } from "./FilterField";
import { ObjectField } from "@/types/ObjectFieldTypes";
import { FilterCondition } from "@/types/FilterCondition";
import { v4 as uuidv4 } from "uuid";

interface ObjectRecordsFilterProps {
  objectTypeId: string;
  fields: ObjectField[];
  onFilterChange: (filters: FilterCondition[]) => void;
  activeFilters?: FilterCondition[];
}

export function ObjectRecordsFilter({
  objectTypeId,
  fields,
  onFilterChange,
  activeFilters = []
}: ObjectRecordsFilterProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(() => {
    return activeFilters.length > 0 ? activeFilters : [{
      id: uuidv4(),
      fieldApiName: "",
      operator: "equals",
      value: ""
    }];
  });
  
  // Use a stable ID for the filter list to avoid unnecessary rerenders
  const filterListId = useId();

  // Sync activeFilters with local state on change
  React.useEffect(() => {
    if (activeFilters) {
      setFilters(activeFilters);
    }
  }, [activeFilters]);

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: uuidv4(),
      fieldApiName: "",
      operator: "equals",
      value: ""
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    const newFilters = filters.filter(filter => filter.id !== id);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    const newFilters = filters.map(filter => {
      if (filter.id === id) {
        return { ...filter, ...updates };
      }
      return filter;
    });
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Filter Records</h4>
      
      <div id={filterListId} className="space-y-2">
        {filters.map((filter, index) => (
          <div key={filter.id} className="flex items-center space-x-2">
            <FilterField
              filter={filter}
              fields={fields}
              onChange={updateFilter}
            />
            {index > 0 ? (
              <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-10"></div>
            )}
          </div>
        ))}
      </div>
      
      <Button variant="outline" size="sm" onClick={addFilter}>
        <Plus className="mr-2 h-4 w-4" />
        Add Filter
      </Button>
    </div>
  );
}

