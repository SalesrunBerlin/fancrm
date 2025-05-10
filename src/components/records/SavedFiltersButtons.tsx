import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserFilterSettings } from "@/hooks/useUserFilterSettings";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterCondition } from "@/types/FilterCondition";

interface SavedFiltersButtonsProps {
  objectTypeId: string;
  activeFilters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}

export function SavedFiltersButtons({ objectTypeId, activeFilters, onFiltersChange }: SavedFiltersButtonsProps) {
  const [open, setOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const { 
    filters, 
    isLoading, 
    error, 
    saveFilter, 
    deleteFilter 
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
      await saveFilter(filterName, activeFilters);
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
      await deleteFilter(selectedFilterId);
      toast.success("Filter deleted successfully!");
      setSelectedFilterId(null);
    } catch (err) {
      console.error("Error deleting filter:", err);
      alert("Failed to delete filter.");
    }
  };

  const applyFilter = (filterId: string) => {
    const selectedFilter = filters?.find(f => f.id === filterId);
    if (selectedFilter) {
      onFiltersChange(selectedFilter.conditions);
      setSelectedFilterId(filterId);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Current Filters</DialogTitle>
            <DialogDescription>
              Give a name to the current set of filters to save it for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Filter name
              </Label>
              <Input id="name" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveFilter}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Load Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : !filters?.length ? (
            <div className="p-2 text-sm text-muted-foreground">
              No filters saved yet.
            </div>
          ) : (
            filters.map((filter) => (
              <DropdownMenuItem key={filter.id} onSelect={() => applyFilter(filter.id)}>
                {filter.name}
              </DropdownMenuItem>
            ))
          )}
          {filters?.length ? (
            <DropdownMenuSeparator />
          ) : null}
          <DropdownMenuItem disabled={!selectedFilterId} onClick={handleDeleteFilter} className="text-red-500">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
