
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectTypeInfo } from "@/types/FieldMapping";

interface ObjectMappingSelectorProps {
  sourceObject: ObjectTypeInfo;
  targetObjectId: string | null;
  objectTypes?: { id: string; name: string }[];
  onObjectChange: (objectId: string) => void;
}

export function ObjectMappingSelector({
  sourceObject,
  targetObjectId,
  objectTypes = [],
  onObjectChange
}: ObjectMappingSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium mb-2">Source Object</h3>
          <div className="p-3 border rounded-md bg-muted">
            {sourceObject.name}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Target Object</h3>
          <Select 
            value={targetObjectId || undefined} 
            onValueChange={onObjectChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target object" />
            </SelectTrigger>
            <SelectContent>
              {objectTypes?.map(obj => (
                <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
