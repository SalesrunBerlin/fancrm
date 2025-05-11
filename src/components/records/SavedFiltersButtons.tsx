
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  recordCount?: number;
}

interface SavedFiltersButtonsProps {
  objectTypeId: string;
  maxToShow?: number;
}

export function SavedFiltersButtons({ objectTypeId, maxToShow = 3 }: SavedFiltersButtonsProps) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const navigate = useNavigate();
  const storageKey = `object-filters-${userId}`;
  const [savedFilters] = useLocalStorage<Record<string, SavedFilter[]>>(storageKey, {});
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (savedFilters && savedFilters[objectTypeId]) {
      // Show only the first maxToShow filters
      // On mobile, show fewer filters to prevent overcrowding
      const mobileMaxToShow = isMobile ? 2 : maxToShow;
      setFilters(savedFilters[objectTypeId].slice(0, mobileMaxToShow));
    } else {
      setFilters([]);
    }
  }, [savedFilters, objectTypeId, maxToShow, isMobile]);

  if (filters.length === 0) {
    return null;
  }

  const handleFilterClick = (filter: SavedFilter) => {
    // Store the selected filter to apply it when the page loads
    const lastAppliedStorageKey = `last-applied-filters-${userId}`;
    const currentLastApplied = localStorage.getItem(lastAppliedStorageKey);
    const lastApplied = currentLastApplied ? JSON.parse(currentLastApplied) : {};
    
    console.log("Saving filter to apply:", filter.conditions);
    lastApplied[objectTypeId] = filter.conditions;
    localStorage.setItem(lastAppliedStorageKey, JSON.stringify(lastApplied));
    
    // Pre-fetch filter results if possible
    queryClient.prefetchQuery({
      queryKey: ["object-records", objectTypeId, filter.conditions],
      staleTime: 1000 * 60, // 1 minute
    });
    
    // Navigate to the object list page with this filter applied
    navigate(`/objects/${objectTypeId}`);
  };

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3 w-full">
      <div className="w-full text-xs text-muted-foreground mb-0 sm:mb-1">Gespeicherte Filter:</div>
      {filters.map((filter) => (
        <FilterBadgeWithCount 
          key={filter.id} 
          filter={filter} 
          objectTypeId={objectTypeId}
          onClick={() => handleFilterClick(filter)}
        />
      ))}
    </div>
  );
}

// Component to display a filter badge with a count of matching records
function FilterBadgeWithCount({ 
  filter, 
  objectTypeId, 
  onClick 
}: { 
  filter: SavedFilter; 
  objectTypeId: string;
  onClick: () => void;
}) {
  const isMobile = useIsMobile();
  
  // Use React Query to fetch record counts efficiently
  const { data: recordCount, isLoading } = useQuery({
    queryKey: ["filter-record-count", objectTypeId, filter.id],
    queryFn: async (): Promise<number> => {
      try {
        // First check if we can use count-only query for efficiency
        const { count, error } = await supabase
          .from("object_records")
          .select("*", { count: 'exact', head: true })
          .eq("object_type_id", objectTypeId);
          
        if (error) throw error;
        
        // If no filter conditions or simple conditions, return the total count
        if (!filter.conditions || filter.conditions.length === 0) {
          return count || 0;
        }
        
        // For complex filtering, we need to do client-side filtering
        // Get all records and field values
        const { data: records } = await supabase
          .from("object_records")
          .select("id, field_values:object_field_values(field_api_name, value)")
          .eq("object_type_id", objectTypeId)
          .limit(200); // Reasonable limit to avoid excessive data transfer
          
        if (!records) return 0;
        
        // Process records into the format expected by the filter function
        const processedRecords = records.map(record => {
          const fieldValues: Record<string, any> = {};
          
          if (record.field_values) {
            (record.field_values as any[]).forEach((fv: any) => {
              if (fv.field_api_name && fv.value !== null) {
                fieldValues[fv.field_api_name] = fv.value;
              }
            });
          }
          
          return {
            ...record,
            field_values: fieldValues
          };
        });
        
        // Apply client-side filtering (simplified for efficiency)
        const filteredRecords = processedRecords.filter(record => {
          return filter.conditions.every(condition => {
            if (!condition.value && condition.value !== false) {
              return true;
            }
            
            const fieldValue = record.field_values?.[condition.fieldApiName];
            const filterValue = condition.value;
            
            switch (condition.operator) {
              case "equals":
              case "is":
                return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase();
              case "contains":
                return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
              // Add other common cases
              default:
                return true;
            }
          });
        });
        
        return filteredRecords.length;
      } catch (error) {
        console.error("Error counting filtered records:", error);
        return 0;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  });
  
  return (
    <Badge
      variant="outline"
      className={`cursor-pointer hover:bg-accent/20 text-wrap whitespace-normal text-xs sm:text-base leading-normal relative ${
        isMobile ? 'py-2 px-3 max-w-full' : 'py-3 px-4'
      }`}
      onClick={onClick}
    >
      {filter.name}
      <span className="absolute -top-2 -right-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[9px] sm:text-[10px] text-primary-foreground">
        {isLoading ? <Loader2 className="h-2 w-2 sm:h-3 sm:w-3 animate-spin" /> : recordCount || 0}
      </span>
    </Badge>
  );
}
