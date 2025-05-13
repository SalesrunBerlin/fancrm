
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ObjectField } from "@/hooks/useObjectTypes";
import { FilterField } from "@/components/records/FilterField";
import { Plus, Save, Trash, X } from "lucide-react";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { debounce } from "lodash";
import { useUserFilterSettings } from "@/hooks/useUserFilterSettings";

interface ObjectRecordsFilterProps {
  objectTypeId: string;
  fields: ObjectField[];
  onFilterChange?: (filters: FilterCondition[]) => void;
  activeFilters?: FilterCondition[];
  onClose?: () => void;
}

export function ObjectRecordsFilter({ 
  objectTypeId, 
  fields,
  onFilterChange,
  activeFilters = [],
  onClose
}: ObjectRecordsFilterProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(activeFilters);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Use our user filter settings hook to access and update filters in the database
  const { settings, updateSettings, isLoading: isLoadingSettings } = useUserFilterSettings(objectTypeId);
  
  const [filterName, setFilterName] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("ObjectRecordsFilter mounted for objectTypeId:", objectTypeId);
    console.log("Active filters passed in props:", activeFilters);
    console.log("Settings from database:", settings);
  }, [objectTypeId, activeFilters, settings]);

  // Load filters from props
  useEffect(() => {
    if (activeFilters && activeFilters.length > 0) {
      console.log("Using active filters from props:", activeFilters);
      setFilters(activeFilters);
    } else if (filters.length === 0) {
      // Initialize with an empty filter if none exist
      console.log("Initializing with empty filter");
      addFilterCondition();
    }
  }, [activeFilters]);

  // Create a debounced apply function - only used when Apply button is clicked
  const debouncedApplyFilters = useCallback(
    debounce((filtersToApply: FilterCondition[]) => {
      if (onFilterChange) {
        // Remove empty filters before applying
        const validFilters = filtersToApply.filter(f => 
          (f.value !== undefined && 
          f.value !== null && 
          f.value !== "") || 
          f.operator === "isNull" || 
          f.operator === "isNotNull"
        );
        
        console.log("Applying debounced filters:", validFilters);
        
        // Update filters in database settings
        if (user) {
          const currentFilters = settings?.filters || [];
          updateSettings({
            ...settings,
            filters: validFilters,
            lastApplied: new Date().toISOString()
          });
        }
        
        setIsApplying(true);
        
        // Small delay to show loading state
        setTimeout(() => {
          onFilterChange(validFilters);
          setIsApplying(false);
          toast.success("Filter angewendet");
          
          // If onClose is provided, close the filter panel
          if (onClose) {
            onClose();
          }
        }, 100);
      }
    }, 250),
    [onFilterChange, objectTypeId, settings, updateSettings, user, onClose]
  );

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
      toast.error("Bitte geben Sie einen Namen für Ihren Filter ein");
      return;
    }

    const newSavedFilter = {
      id: crypto.randomUUID(),
      name: filterName,
      conditions: filters
    };

    // Get existing savedFilters array or initialize it
    const savedFilters = Array.isArray(settings?.savedFilters) 
      ? settings.savedFilters 
      : [];

    // Add new filter at the beginning of the array
    const updatedSavedFilters = [
      newSavedFilter,
      ...savedFilters
    ].slice(0, 10); // Keep only the 10 most recent saved filters

    // Save to database
    updateSettings({
      ...settings,
      savedFilters: updatedSavedFilters
    });

    setFilterName("");
    setShowSaveOptions(false);
    toast.success("Filter erfolgreich gespeichert");
  };

  // Update to automatically apply filter and close panel
  const loadSavedFilter = (savedFilter: {id: string, name: string, conditions: FilterCondition[]}) => {
    console.log("Loading saved filter:", savedFilter);
    setFilters(savedFilter.conditions);
    
    // Automatically apply the filter and close the panel
    debouncedApplyFilters(savedFilter.conditions);
  };

  const deleteSavedFilter = (filterId: string) => {
    if (!settings?.savedFilters) return;
    
    const updatedFilters = settings.savedFilters.filter(f => f.id !== filterId);
    
    updateSettings({
      ...settings,
      savedFilters: updatedFilters
    });
    toast.success("Filter gelöscht");
  };

  const clearFilters = () => {
    const emptyFilter: FilterCondition[] = [];
    setFilters(emptyFilter);
    
    // Update filters in database
    updateSettings({
      ...settings,
      filters: emptyFilter,
      lastApplied: new Date().toISOString()
    });
    
    // Apply empty filter immediately
    if (onFilterChange) {
      onFilterChange(emptyFilter);
      toast.success("Filter zurückgesetzt");
    }
    
    // Add a single empty condition after clearing
    setTimeout(() => {
      addFilterCondition();
    }, 0);
    
    // Close filter panel if onClose is provided
    if (onClose) {
      onClose();
    }
  };

  const applyFilters = () => {
    // Use the debounced function we defined earlier
    debouncedApplyFilters(filters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filter Records</h3>
        <div className="space-x-2">
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="p-0 h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
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
            placeholder="Filter-Namen eingeben"
            className="max-w-xs"
          />
          <Button size="sm" onClick={saveFilters}>Filter speichern</Button>
        </div>
      )}

      {/* Saved filters list */}
      {settings?.savedFilters?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.savedFilters.map(filter => (
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
          Filter hinzufügen
        </Button>
      </div>

      {/* Apply filters button */}
      <div className="pt-2">
        <Button 
          onClick={applyFilters} 
          disabled={isApplying}
          className="w-full"
        >
          {isApplying ? "Wird angewendet..." : "Filter anwenden"}
        </Button>
      </div>
    </div>
  );
}
