
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ObjectRecord } from "@/types/ObjectFieldTypes";

interface PublicRecordHeaderProps {
  record: ObjectRecord;
  allowEdit: boolean;
  editMode: boolean;
  isSaving: boolean;
  onBackClick: () => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveChanges: () => void;
  hasChanges: boolean;
}

export function PublicRecordHeader({
  record,
  allowEdit,
  editMode,
  isSaving,
  onBackClick,
  onEditClick,
  onCancelEdit,
  onSaveChanges,
  hasChanges
}: PublicRecordHeaderProps) {
  const recordName = record.displayName || "Record";

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        
        {allowEdit && (
          <div>
            {editMode ? (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={onSaveChanges}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onEditClick}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{recordName}</h1>
        {record.objectName && (
          <p className="text-muted-foreground">
            {record.objectName}
          </p>
        )}
      </div>
    </header>
  );
}
