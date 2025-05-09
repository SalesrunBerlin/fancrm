
import { useState, useEffect, KeyboardEvent, FormEvent } from "react";
import { useObjectType } from "@/hooks/useObjectType";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface QuickCreateListProps {
  objectTypeId: string;
  nameFieldApiName?: string;
  onRecordCreated?: (recordId: string) => void;
}

export function QuickCreateList({
  objectTypeId,
  nameFieldApiName = "name",
  onRecordCreated,
}: QuickCreateListProps) {
  const [newItemName, setNewItemName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { objectType } = useObjectType(objectTypeId);
  const { records, isLoading, refetch, createRecord } = useObjectRecords(objectTypeId);

  // Handle form submission and Enter key press
  const handleCreateRecord = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!newItemName.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      
      // Create a new record with just the name field
      await createRecord.mutateAsync({
        [nameFieldApiName]: newItemName.trim()
      });
      
      toast.success("Record created successfully");
      setNewItemName("");
      refetch();
      
      if (onRecordCreated) {
        // We don't have the new record ID immediately, but the UI will refresh
        onRecordCreated("created");
      }
    } catch (error) {
      console.error("Failed to create record:", error);
      toast.error("Failed to create record");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateRecord();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateRecord} className="flex items-center gap-2">
        <PlusCircle className="h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={`Add new ${objectType?.name || "item"}...`}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isCreating}
          className="flex-1"
        />
        {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : records && records.length > 0 ? (
        <div className="space-y-2">
          {records.map((record) => {
            const displayName = record.field_values?.[nameFieldApiName] || record.record_id;
            return (
              <div 
                key={record.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <Checkbox id={record.id} checked={true} disabled />
                <label
                  htmlFor={record.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {displayName}
                </label>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-4 text-muted-foreground italic">
          No items yet. Add your first one above.
        </div>
      )}
    </div>
  );
}
