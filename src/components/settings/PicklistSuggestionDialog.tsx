
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useUnusedPicklistValues } from "@/hooks/useUnusedPicklistValues";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { toast } from "sonner";

interface PicklistSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  objectTypeId: string;
  fieldId: string;
}

export function PicklistSuggestionDialog({
  isOpen,
  onClose,
  objectTypeId,
  fieldId,
}: PicklistSuggestionDialogProps) {
  const { unusedValues, isLoading, refetch } = useUnusedPicklistValues(
    objectTypeId,
    fieldId
  );
  const { addBatchPicklistValues, isAddingValues } = usePicklistCreation(fieldId);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedValues.length === unusedValues.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues([...unusedValues]);
    }
  };

  const toggleValueSelection = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const handleAddValues = async () => {
    if (selectedValues.length === 0) {
      toast.error("No values selected");
      return;
    }

    try {
      const success = await addBatchPicklistValues(null, selectedValues);
      if (success) {
        toast.success(`Added ${selectedValues.length} new picklist values`);
        onClose();
      } else {
        toast.error("Failed to add some picklist values");
      }
    } catch (error) {
      console.error("Error adding picklist values:", error);
      toast.error("Failed to add picklist values");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggested Picklist Values</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : unusedValues.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No new values found in existing records.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedValues.length === unusedValues.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedValues.length} of {unusedValues.length} selected
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                {unusedValues.map((value) => (
                  <div
                    key={value}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-sm"
                  >
                    <Checkbox
                      checked={selectedValues.includes(value)}
                      onCheckedChange={() => toggleValueSelection(value)}
                      id={`value-${value}`}
                    />
                    <label
                      htmlFor={`value-${value}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddValues}
            disabled={selectedValues.length === 0 || isAddingValues}
          >
            {isAddingValues && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Selected Values
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
