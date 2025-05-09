
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface FieldOrderManagerProps {
  objectTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FieldOrderManager({ objectTypeId, open, onOpenChange }: FieldOrderManagerProps) {
  const { fields, isLoading, updateFieldOrder } = useObjectFields(objectTypeId);
  const [orderedFields, setOrderedFields] = useState<ObjectField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize ordered fields when component loads or fields change
  useEffect(() => {
    if (fields && fields.length > 0) {
      setOrderedFields([...fields].sort((a, b) => a.display_order - b.display_order));
    }
  }, [fields]);

  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = Array.from(orderedFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the state with the new order
    setOrderedFields(items);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create an array of objects with id and new display_order values
      const updatedFieldOrders = orderedFields.map((field, index) => ({
        id: field.id,
        display_order: index + 1
      }));

      // Call the mutation to update field orders
      await updateFieldOrder.mutateAsync(updatedFieldOrders);
      
      toast.success("Field order updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating field order:", error);
      toast.error("Failed to update field order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Field Order</DialogTitle>
          <DialogDescription>
            Drag and drop fields to change the order they appear on the Record Detail page.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 max-h-[60vh] overflow-y-auto py-2"
                >
                  {orderedFields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors"
                        >
                          <div {...provided.dragHandleProps} className="mr-2 flex-shrink-0">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{field.name}</div>
                            <div className="text-xs text-muted-foreground">{field.api_name}</div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
