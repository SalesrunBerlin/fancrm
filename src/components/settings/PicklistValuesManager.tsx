
import { useState } from "react";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface PicklistValuesManagerProps {
  fieldId: string;
  onComplete?: () => void;
  initialValues?: string[];
}

export function PicklistValuesManager({ fieldId, onComplete, initialValues }: PicklistValuesManagerProps) {
  const [newValue, setNewValue] = useState("");
  const { picklistValues, isLoading } = useFieldPicklistValues(fieldId);
  const { addPicklistValue, removePicklistValue, addBatchPicklistValues, isAddingValues } = usePicklistCreation(fieldId);

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
  
  // Add initial values if provided when the component mounts
  const addInitialValues = async () => {
    if (initialValues && initialValues.length > 0) {
      try {
        const success = await addBatchPicklistValues(initialValues);
        if (success) {
          toast.success("Initial values added successfully");
          if (onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error("Error adding initial picklist values:", error);
        toast.error("Failed to add initial picklist values");
      }
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
            disabled={isAddingValues}
          >
            {isAddingValues ? (
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
