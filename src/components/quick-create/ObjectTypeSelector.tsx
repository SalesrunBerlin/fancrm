
import { useState, useEffect } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ObjectTypeSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function ObjectTypeSelector({ value, onChange }: ObjectTypeSelectorProps) {
  const { objectTypes, isLoading } = useObjectTypes();
  const [selectedObjectTypeId, setSelectedObjectTypeId] = useState<string | undefined>(value);
  
  // Get published and active object types
  const availableObjectTypes = objectTypes?.filter(
    (obj) => obj.is_published && obj.is_active && !obj.is_archived
  ) || [];

  // Set initial value when object types load
  useEffect(() => {
    if (!value && availableObjectTypes.length > 0 && !selectedObjectTypeId) {
      const defaultObject = availableObjectTypes[0];
      setSelectedObjectTypeId(defaultObject.id);
      onChange(defaultObject.id);
    }
  }, [availableObjectTypes, value, onChange, selectedObjectTypeId]);

  const handleObjectTypeChange = (value: string) => {
    setSelectedObjectTypeId(value);
    onChange(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading object types...</span>
      </div>
    );
  }

  if (availableObjectTypes.length === 0) {
    return <div>No available object types found.</div>;
  }

  return (
    <Select
      value={selectedObjectTypeId}
      onValueChange={handleObjectTypeChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select object type" />
      </SelectTrigger>
      <SelectContent>
        {availableObjectTypes.map((objectType) => (
          <SelectItem key={objectType.id} value={objectType.id}>
            {objectType.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
