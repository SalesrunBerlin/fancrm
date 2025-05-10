
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserFilterSettings } from "@/hooks/useUserFilterSettings";
import { Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterCondition } from "@/types/FilterCondition";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SavedFiltersButtonsProps {
  objectTypeId: string;
  activeFilters?: FilterCondition[];
  onFiltersChange?: (filters: FilterCondition[]) => void;
  maxToShow?: number;
}

export function SavedFiltersButtons({ objectTypeId, activeFilters = [], onFiltersChange, maxToShow = 3 }: SavedFiltersButtonsProps) {
  const [open, setOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const { 
    filters, 
    isLoading,
    updateFilters,
    saveFilter: saveUserFilter,
    deleteFilter: deleteUserFilter,
    error 
  } = useUserFilterSettings(objectTypeId);

  useEffect(() => {
    if (error) {
      console.error("Error fetching saved filters:", error);
    }
  }, [error]);

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      alert("Please enter a filter name.");
      return;
    }

    try {
      await saveUserFilter(filterName, activeFilters);
      toast.success("Filter saved successfully!");
      setOpen(false);
      setFilterName("");
    } catch (err) {
      console.error("Error saving filter:", err);
      alert("Failed to save filter.");
    }
  };

  const handleDeleteFilter = async () => {
    if (!selectedFilterId) return;
    
    try {
      await deleteUserFilter(selectedFilterId);
      toast.success("Filter deleted successfully!");
      setSelectedFilterId(null);
    } catch (err) {
      console.error("Error deleting filter:", err);
      alert("Failed to delete filter.");
    }
  };

  const applyFilter = (filterId: string) => {
    const selectedFilter = filters?.find(f => f.id === filterId);
    if (selectedFilter && onFiltersChange) {
      onFiltersChange(selectedFilter.conditions);
      setSelectedFilterId(filterId);
    }
  };

  const visibleFilters = filters?.slice(0, maxToShow) || [];

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Filter speichern
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aktuelle Filter speichern</DialogTitle>
            <DialogDescription>
              Geben Sie einen Namen für die aktuelle Filterauswahl ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Filtername
              </Label>
              <Input id="name" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" onClick={handleSaveFilter}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Filter laden
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Gespeicherte Filter</DropdownMenuLabel>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Laden...
            </div>
          ) : !visibleFilters.length ? (
            <div className="p-2 text-sm text-muted-foreground">
              Keine Filter gespeichert.
            </div>
          ) : (
            visibleFilters.map((filter) => (
              <DropdownMenuItem key={filter.id} onSelect={() => applyFilter(filter.id)}>
                {filter.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
