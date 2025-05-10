
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Loader2 } from "lucide-react";

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
  
  useEffect(() => {
    if (savedFilters && savedFilters[objectTypeId]) {
      // Show only the first maxToShow filters
      setFilters(savedFilters[objectTypeId].slice(0, maxToShow));
    } else {
      setFilters([]);
    }
  }, [savedFilters, objectTypeId, maxToShow]);

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
    
    // Navigate to the object list page with this filter applied
    navigate(`/objects/${objectTypeId}`);
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
