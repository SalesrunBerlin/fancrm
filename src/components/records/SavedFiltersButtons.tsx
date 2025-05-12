
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
  const [isNavigating, setIsNavigating] = useState(false);
  
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
      // Prevent multiple clicks
      if (isNavigating) {
        return;
      }
      
      setIsNavigating(true);
      
      // Validate filter conditions
      if (!filter.conditions || !Array.isArray(filter.conditions) || filter.conditions.length === 0) {
        toast.error("Dieser Filter ist leer oder ungültig");
        setIsNavigating(false);
        return;
      }

      // Ensure each filter condition has proper structure
      const validatedConditions = filter.conditions.filter(condition => {
        // Check if condition has the minimum required fields
        return condition && condition.fieldApiName && condition.operator;
      });

      if (validatedConditions.length === 0) {
        toast.error("Ungültige Filterbedingungen erkannt");
        setIsNavigating(false);
        return;
      }
      
      // Add a success toast notification before navigating
      toast.success(`Navigiere zu "${filter.name}" Filter`);
      
      // Navigate to the optimized object list page with this filter ID in the URL
      // Fix: Use the filterId parameter to ensure proper navigation and filter loading
      navigate(`/objects/${objectTypeId}/optimized/${filter.id}`);
      
      // Set a timeout to reset the navigation state (safety measure)
      setTimeout(() => {
        setIsNavigating(false);
      }, 2000);
      
    } catch (error) {
      console.error("Fehler beim Anwenden des gespeicherten Filters:", error);
      toast.error("Filter konnte nicht angewendet werden. Bitte versuchen Sie es erneut.");
      setIsNavigating(false);
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
          isNavigating={isNavigating}
        />
      ))}
    </div>
  );
}

// Optimized component to display a filter badge with a count of matching records
function FilterBadgeWithCount({ 
  filter, 
  objectTypeId, 
  onClick,
  isNavigating
}: { 
  filter: SavedFilter; 
  objectTypeId: string;
  onClick: () => void;
  isNavigating?: boolean;
}) {
  const { records, isLoading } = useObjectRecords(objectTypeId, filter.conditions);
  const recordCount = records?.length || 0;
  
  return (
    <Badge
      variant="outline"
      className={`cursor-pointer hover:bg-accent/20 py-3 px-4 text-wrap whitespace-normal text-base leading-normal relative ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={onClick}
    >
      {filter.name}
      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : recordCount}
      </span>
    </Badge>
  );
}
