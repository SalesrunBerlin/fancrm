
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ObjectField } from "@/hooks/useObjectTypes";
import { FilterField } from "@/components/records/FilterField";
import { Plus, Save, Trash } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface FilterCondition {
  id: string;
  fieldApiName: string;
  operator: string;
  value: any;
}

interface ObjectRecordsFilterProps {
  objectTypeId: string | undefined;
  fields: ObjectField[];
}

export function ObjectRecordsFilter({ objectTypeId, fields }: ObjectRecordsFilterProps) {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [savedFilters, setSavedFilters] = useLocalStorage<Record<string, FilterCondition[]>>(
    `object-filters`,
    {}
  );

  // Load saved filters for this object type
  useEffect(() => {
    if (objectTypeId && savedFilters[objectTypeId]) {
      setFilters(savedFilters[objectTypeId]);
    } else {
      setFilters([]);
    }
  }, [objectTypeId, savedFilters]);

  const addFilterCondition = () => {
    if (fields.length > 0) {
      const newFilter: FilterCondition = {
        id: crypto.randomUUID(),
        fieldApiName: fields[0].api_name,
        operator: "equals",
        value: ""
      };
      setFilters([...filters, newFilter]);
    }
  };

  const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(prevFilters =>
      prevFilters.map(filter =>
        filter.id === id ? { ...filter, ...updates } : filter
      )
    );
  };

  const removeFilterCondition = (id: string) => {
    setFilters(prevFilters => prevFilters.filter(filter => filter.id !== id));
  };

  const saveFilters = () => {
    if (objectTypeId) {
      setSavedFilters({
        ...savedFilters,
        [objectTypeId]: filters
      });
    }
  };

  const clearFilters = () => {
    setFilters([]);
    if (objectTypeId) {
      setSavedFilters({
        ...savedFilters,
        [objectTypeId]: []
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filter Records</h3>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear
          </Button>
          <Button size="sm" variant="default" onClick={saveFilters}>
            <Save className="h-3 w-3 mr-1" />
            Save Filters
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filters.map(filter => (
          <div key={filter.id} className="flex items-start gap-2">
            <FilterField
              filter={filter}
              fields={fields}
              onChange={updateFilterCondition}
            />
            <Button
              size="sm"
              variant="ghost"
              className="mt-1"
              onClick={() => removeFilterCondition(filter.id)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={addFilterCondition}
          className="mt-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Filter
        </Button>
      </div>
    </div>
  );
}
