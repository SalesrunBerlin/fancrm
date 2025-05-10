import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ObjectField } from "@/hooks/useObjectTypes";
import { FilterField } from "@/components/records/FilterField";
import { Plus, Save, Trash } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

interface ObjectRecordsFilterProps {
  objectTypeId: string;
  fields: ObjectField[];
  onFilterChange?: (filters: FilterCondition[]) => void;
  activeFilters?: FilterCondition[];
}

export function ObjectRecordsFilter({ 
  objectTypeId, 
  fields,
  onFilterChange,
  activeFilters = []
}: ObjectRecordsFilterProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(activeFilters);
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const storageKey = `object-filters-${userId}`;
  
  const [savedFilters, setSavedFilters] = useLocalStorage<Record<string, SavedFilter[]>>(
    storageKey,
    {}
  );
  const [filterName, setFilterName] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const lastAppliedStorageKey = `last-applied-filters-${userId}`;
  const [lastAppliedFilter, setLastAppliedFilter] = useLocalStorage<Record<string, FilterCondition[]>>(
    lastAppliedStorageKey,
    {}
  );

  // Debug logging
  useEffect(() => {
    console.log("ObjectRecordsFilter mounted for objectTypeId:", objectTypeId);
    console.log("Last applied filters in storage:", lastAppliedFilter);
    console.log("Active filters passed in props:", activeFilters);
  }, []);

  // Load saved filters for this object type
  useEffect(() => {
    if (activeFilters && activeFilters.length > 0) {
      console.log("Using active filters from props:", activeFilters);
      setFilters(activeFilters);
    } else if (objectTypeId) {
      // Try to load last applied filter for this object
      const lastFilter = lastAppliedFilter?.[objectTypeId];
      
      if (lastFilter && lastFilter.length > 0) {
        console.log("Loading last applied filter:", lastFilter);
        setFilters(lastFilter);
        if (onFilterChange) {
          console.log("Applying last filter via onFilterChange");
          onFilterChange(lastFilter);
        }
      } else if (savedFilters?.[objectTypeId]?.length > 0) {
        // Otherwise try to load most recently saved filter
        const recentFilter = savedFilters[objectTypeId][0];
        console.log("Loading most recent saved filter:", recentFilter);
        setFilters(recentFilter.conditions);
        if (onFilterChange) {
          console.log("Applying recent filter via onFilterChange");
          onFilterChange(recentFilter.conditions);
        }
      } else if (filters.length === 0) {
        // Initialize with an empty filter if none exist
        console.log("Initializing with empty filter");
        addFilterCondition();
      }
    }
  }, [objectTypeId, user]);

  // Update parent component when filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

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
    if (!filterName.trim()) {
      toast.error("Please enter a name for your filter");
      return;
    }

    const newSavedFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: filterName,
      conditions: filters
    };

    const updatedSavedFilters = {
      ...savedFilters,
      [objectTypeId]: [
        newSavedFilter,
        ...(savedFilters[objectTypeId] || [])
      ].slice(0, 10) // Keep only the 10 most recent saved filters
    };

    setSavedFilters(updatedSavedFilters);
    setFilterName("");
    setShowSaveOptions(false);
    
    // Save as last applied filter too
    setLastAppliedFilter({
      ...lastAppliedFilter,
      [objectTypeId]: filters
    });
    
    toast.success("Filter saved successfully");
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    console.log("Loading saved filter:", savedFilter);
    setFilters(savedFilter.conditions);
    
    // Update last applied filter
    console.log("Updating last applied filter storage");
    setLastAppliedFilter({
      ...lastAppliedFilter,
      [objectTypeId]: savedFilter.conditions
    });
    
    if (onFilterChange) {
      console.log("Applying saved filter via onFilterChange");
      onFilterChange(savedFilter.conditions);
    }
  };

  const deleteSavedFilter = (filterId: string) => {
    const updatedFilters = savedFilters[objectTypeId].filter(f => f.id !== filterId);
    setSavedFilters({
      ...savedFilters,
      [objectTypeId]: updatedFilters
    });
    toast.success("Filter deleted");
  };

  const clearFilters = () => {
    const emptyFilter = [];
    setFilters(emptyFilter);
    
    // Clear the last applied filter
    const updatedLastApplied = { ...lastAppliedFilter };
    delete updatedLastApplied[objectTypeId];
    setLastAppliedFilter(updatedLastApplied);
    
    if (onFilterChange) {
      onFilterChange(emptyFilter);
    }
    
    // Add a single empty condition after clearing
    setTimeout(() => {
      addFilterCondition();
    }, 0);
  };

  const applyFilters = () => {
    if (onFilterChange) {
      // Remove empty filters before applying
      const validFilters = filters.filter(f => 
        f.value !== undefined && 
        f.value !== null && 
        f.value !== "" || 
        f.operator === "isNull" || 
        f.operator === "isNotNull"
      );
      
      console.log("Applying filters and saving to lastApplied:", validFilters);
      
      // Save as last applied filter
      setLastAppliedFilter({
        ...lastAppliedFilter,
        [objectTypeId]: validFilters
      });
      
      onFilterChange(validFilters);
      toast.success("Filters applied");
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
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowSaveOptions(!showSaveOptions)}
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {showSaveOptions && (
        <div className="flex items-center gap-2 mb-4">
          <Input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Enter filter name"
            className="max-w-xs"
          />
          <Button size="sm" onClick={saveFilters}>Save Filter</Button>
        </div>
      )}

      {/* Saved filters list */}
      {savedFilters[objectTypeId]?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {savedFilters[objectTypeId].map(filter => (
            <div 
              key={filter.id} 
              className="flex items-center bg-muted rounded-md px-2 py-1 text-sm"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-0 px-2 text-sm"
                onClick={() => loadSavedFilter(filter)}
              >
                {filter.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 text-red-500 hover:text-red-700"
                onClick={() => deleteSavedFilter(filter.id)}
              >
                <Trash className="h-3 w-3" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Filter conditions */}
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

      {/* Apply filters button */}
      <div className="pt-2">
        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
