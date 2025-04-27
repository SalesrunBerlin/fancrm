
import { useState } from "react";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface PicklistValuesManagerProps {
  fieldId: string;
}

export function PicklistValuesManager({ fieldId }: PicklistValuesManagerProps) {
  const [newValue, setNewValue] = useState("");
  const { picklistValues, addValue, removeValue, isLoading } = useFieldPicklistValues(fieldId);

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    try {
      await addValue.mutateAsync({
        value: newValue.trim(),
        label: newValue.trim(),
      });
      setNewValue("");
    } catch (error) {
      console.error("Error adding picklist value:", error);
      toast.error("Failed to add picklist value");
    }
  };

  const handleRemoveValue = async (id: string) => {
    try {
      await removeValue.mutateAsync(id);
    } catch (error) {
      console.error("Error removing picklist value:", error);
      toast.error("Failed to remove picklist value");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddValue} className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Enter new value"
        />
        <Button type="submit" disabled={!newValue.trim()}>
          Add Value
        </Button>
      </form>

      <div className="space-y-2">
        {picklistValues?.map((value) => (
          <div
            key={value.id}
            className="flex items-center justify-between p-2 border rounded-md"
          >
            <span>{value.label}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveValue(value.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
