
import { useState, useEffect } from "react";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface PicklistValuesManagerProps {
  fieldId: string;
  onComplete?: () => void;
  initialValues?: string[];
}

export function PicklistValuesManager({ fieldId, onComplete, initialValues }: PicklistValuesManagerProps) {
  const [newValue, setNewValue] = useState("");
  const { picklistValues, isLoading } = useFieldPicklistValues(fieldId);
  const { addPicklistValue, removePicklistValue, addBatchPicklistValues, isAddingValues } = usePicklistCreation(fieldId);
  const [isAddingInitialValues, setIsAddingInitialValues] = useState(false);

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!newValue.trim()) return;

    try {
      const success = await addPicklistValue(newValue.trim());
      if (success) {
        setNewValue("");
        toast.success("Value added successfully");
      }
    } catch (error) {
      console.error("Error adding picklist value:", error);
      toast.error("Failed to add picklist value");
    }
  };

  const handleRemoveValue = async (id: string) => {
    try {
      const success = await removePicklistValue(id);
      if (success) {
        toast.success("Value removed successfully");
      }
    } catch (error) {
      console.error("Error removing picklist value:", error);
      toast.error("Failed to remove picklist value");
    }
  };
  
  // Add initial values if provided and not already added
  const addInitialValues = async () => {
    if (!initialValues || initialValues.length === 0 || isAddingInitialValues) return;
    
    try {
      setIsAddingInitialValues(true);
      
      // Filter out values that already exist to prevent duplicates
      const existingValues = new Set(picklistValues?.map(pv => pv.value.toLowerCase()));
      const valuesToAdd = initialValues.filter(val => 
        !existingValues.has(val.toLowerCase())
      );
      
      if (valuesToAdd.length === 0) {
        toast.info("All predefined values already exist");
        return;
      }
      
      const success = await addBatchPicklistValues(null, valuesToAdd);
      if (success) {
        toast.success("Initial values added successfully");
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error("Error adding initial picklist values:", error);
      toast.error("Failed to add initial picklist values");
    } finally {
      setIsAddingInitialValues(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddValue} className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Enter new value"
        />
        <Button type="submit" disabled={!newValue.trim() || isAddingValues}>
          {isAddingValues ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Add Value
        </Button>
        
        {initialValues && initialValues.length > 0 && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={addInitialValues}
            disabled={isAddingValues || isAddingInitialValues}
          >
            {(isAddingValues || isAddingInitialValues) ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Predefined Values
          </Button>
        )}
      </form>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : picklistValues?.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No values added yet</p>
        ) : (
          picklistValues?.map((value) => (
            <div
              key={value.id}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <span>{value.label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveValue(value.id)}
                disabled={isAddingValues}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
