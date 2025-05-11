
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserFilterSettings } from "@/hooks/useUserFilterSettings";

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
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  
  // Use the user filter settings hook to get filters from database
  const { settings, isLoading: isLoadingSettings } = useUserFilterSettings(objectTypeId);
  
  useEffect(() => {
    // Get saved filters from database settings
    if (settings && settings.savedFilters && Array.isArray(settings.savedFilters)) {
      // Show only the first maxToShow filters
      setFilters(settings.savedFilters.slice(0, maxToShow));
    } else {
      setFilters([]);
    }
  }, [settings, maxToShow]);

  if (filters.length === 0 || isLoadingSettings) {
    return null;
  }

  const handleFilterClick = (filter: SavedFilter) => {
    try {
      if (!filter.conditions || filter.conditions.length === 0) {
        toast.error("Dieser Filter ist leer oder ungültig");
        return;
      }

      // Ensure each filter condition has proper structure
      const validatedConditions = filter.conditions.map(condition => {
        // Ensure ID is present
        if (!condition.id) {
          condition.id = crypto.randomUUID();
        }
        
        // Ensure required fields exist
        if (!condition.fieldApiName || !condition.operator) {
          throw new Error("Ungültige Filterbedingung erkannt");
        }
        
        return condition;
      });
      
      // Add a small toast notification before navigating
      toast.success(`Navigiere zu "${filter.name}" Filter`);
      
      // Navigate to the optimized object list page with this filter ID in the URL
      // The filter ID will be used to load the filter from settings
      navigate(`/objects/${objectTypeId}/optimized/${filter.id}`);
    } catch (error) {
      console.error("Fehler beim Anwenden des gespeicherten Filters:", error);
      toast.error("Filter konnte nicht angewendet werden. Bitte versuchen Sie es erneut.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <div className="w-full text-xs text-muted-foreground mb-1">Gespeicherte Filter:</div>
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

// Optimized component to display a filter badge with a count of matching records
function FilterBadgeWithCount({ 
  filter, 
  objectTypeId, 
  onClick 
}: { 
  filter: SavedFilter; 
  objectTypeId: string;
  onClick: () => void;
}) {
  const { records, isLoading } = useObjectRecords(objectTypeId, filter.conditions);
  const recordCount = records?.length || 0;
  
  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent/20 py-3 px-4 text-wrap whitespace-normal text-base leading-normal relative"
      onClick={onClick}
    >
      {filter.name}
      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : recordCount}
      </span>
    </Badge>
  );
}
