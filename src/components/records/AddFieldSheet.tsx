
import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ObjectFieldForm } from "@/components/settings/ObjectFieldForm";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AddFieldSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectTypeId: string;
  onFieldCreated: () => void;
  initialName?: string;
}

export function AddFieldSheet({ 
  open, 
  onOpenChange, 
  objectTypeId,
  onFieldCreated,
  initialName
}: AddFieldSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader className="mb-5">
          <SheetTitle>Add New Field</SheetTitle>
          <SheetDescription>
            Create a new field for this object. This field will be available for all records of this object type.
          </SheetDescription>
        </SheetHeader>
        
        <div className="absolute right-4 top-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ObjectFieldForm 
          objectTypeId={objectTypeId} 
          onComplete={() => {
            onFieldCreated();
            onOpenChange(false);
          }}
          initialName={initialName}
        />
      </SheetContent>
    </Sheet>
  );
}
