
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

interface PicklistValue {
  label: string;
  value: string;
}

interface PicklistValuesInputProps {
  values: PicklistValue[];
  onChange: (values: PicklistValue[]) => void;
}

export function PicklistValuesInput({ values, onChange }: PicklistValuesInputProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddValue = () => {
    if (!newLabel || !newValue) return;

    const updatedValues = [...values, { label: newLabel, value: newValue }];
    onChange(updatedValues);
    setNewLabel("");
    setNewValue("");
  };

  const handleRemoveValue = (index: number) => {
    const updatedValues = [...values];
    updatedValues.splice(index, 1);
    onChange(updatedValues);
  };

  const updateLabel = (index: number, newLabel: string) => {
    const updatedValues = [...values];
    updatedValues[index] = { ...updatedValues[index], label: newLabel };
    onChange(updatedValues);
  };

  const updateValue = (index: number, newValue: string) => {
    const updatedValues = [...values];
    updatedValues[index] = { ...updatedValues[index], value: newValue };
    onChange(updatedValues);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Picklist Values</h3>
        
        {values.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No values added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {values.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  className="flex-1"
                  placeholder="Label"
                  value={item.label}
                  onChange={(e) => updateLabel(index, e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Value"
                  value={item.value}
                  onChange={(e) => updateValue(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveValue(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center mt-2">
          <Input
            placeholder="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <Input
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddValue}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
