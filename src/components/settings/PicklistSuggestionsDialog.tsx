
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUnusedPicklistValues } from "@/hooks/useUnusedPicklistValues";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

interface PicklistSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  objectTypeId: string;
  fieldId: string;
}

export function PicklistSuggestionsDialog({
  isOpen,
  onClose,
  objectTypeId,
  fieldId
}: PicklistSuggestionsDialogProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isAddingValues, setIsAddingValues] = useState(false);
  
  const { unusedValues, isLoading, refetch } = useUnusedPicklistValues(objectTypeId, fieldId);
  const { addBatchPicklistValues } = usePicklistCreation(fieldId);
  
  const handleToggleValue = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedValues.length === unusedValues.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues([...unusedValues]);
    }
  };
  
  const handleAddValues = async () => {
    if (selectedValues.length === 0) {
      toast.error("Please select at least one value to add");
      return;
    }
    
    setIsAddingValues(true);
    try {
      const success = await addBatchPicklistValues(null, selectedValues);
      if (success) {
        toast.success(`Added ${selectedValues.length} values to picklist`);
        onClose();
      } else {
        toast.error("Failed to add some values");
      }
    } catch (error) {
      console.error("Error adding picklist values:", error);
      toast.error("Failed to add values");
    } finally {
      setIsAddingValues(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Suggested Picklist Values
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : unusedValues.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No additional values found in existing records.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Found {unusedValues.length} values in existing records
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSelectAll}
                >
                  {selectedValues.length === unusedValues.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                {unusedValues.map((value, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 p-3 hover:bg-muted/50"
                  >
                    <Checkbox 
                      id={`value-${index}`}
                      checked={selectedValues.includes(value)}
                      onCheckedChange={() => handleToggleValue(value)}
                    />
                    <label 
                      htmlFor={`value-${index}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isAddingValues}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddValues} 
            disabled={selectedValues.length === 0 || isAddingValues || isLoading}
          >
            {isAddingValues && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Selected Values
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
