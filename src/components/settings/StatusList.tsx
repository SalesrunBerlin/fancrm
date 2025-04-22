
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface StatusListProps {
  dealStatuses: any[];
  isLoading: boolean;
  updateStatus: ReturnType<typeof useDealStatuses>["updateStatus"];
  deleteStatus: ReturnType<typeof useDealStatuses>["deleteStatus"];
}

export function StatusList({
  dealStatuses,
  isLoading,
  updateStatus,
  deleteStatus,
}: StatusListProps) {
  const { toast } = useToast();
  const [editingStatus, setEditingStatus] = useState<{ id: string; name: string; type: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);

  const handleDeleteStatus = (id: string) => {
    setStatusToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!statusToDelete) return;
    try {
      await deleteStatus.mutateAsync(statusToDelete);
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich gelöscht",
      });
      setDeleteDialogOpen(false);
      setStatusToDelete(null);
    } catch (error) {
      console.error("Error deleting status:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const handleEditStatus = (id: string, name: string, type: string) => {
    setEditingStatus({ id, name, type });
  };

  const handleSaveEdit = async () => {
    if (!editingStatus) return;
    try {
      await updateStatus.mutateAsync({
        id: editingStatus.id,
        name: editingStatus.name,
        type: editingStatus.type,
      });
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich aktualisiert",
      });
      setEditingStatus(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(dealStatuses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order positions for all affected items
    const updates = items.map((item, index) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      order_position: index + 1
    }));

    try {
      // Update each status with its new order position
      for (const update of updates) {
        await updateStatus.mutateAsync(update);
      }

      toast({
        title: "Erfolg",
        description: "Reihenfolge wurde aktualisiert",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Fehler",
        description: "Reihenfolge konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="statuses">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Lädt...</TableCell>
                    </TableRow>
                  ) : !dealStatuses || dealStatuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Keine Status gefunden</TableCell>
                    </TableRow>
                  ) : (
                    dealStatuses
                      .sort((a, b) => a.order_position - b.order_position)
                      .map((status, index) => (
                        <Draggable 
                          key={status.id} 
                          draggableId={status.id} 
                          index={index}
                        >
                          {(provided) => (
                            <TableRow 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <TableCell>
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </div>
                              </TableCell>
                              <TableCell>
                                {editingStatus?.id === status.id ? (
                                  <Input
                                    value={editingStatus.name}
                                    onChange={(e) => setEditingStatus({
                                      ...editingStatus,
                                      name: e.target.value
                                    })}
                                  />
                                ) : (
                                  status.name
                                )}
                              </TableCell>
                              <TableCell>
                                {editingStatus?.id === status.id ? (
                                  <Select
                                    value={editingStatus.type}
                                    onValueChange={(value) => setEditingStatus({
                                      ...editingStatus,
                                      type: value
                                    })}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Typ auswählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Offen</SelectItem>
                                      <SelectItem value="won">Gewonnen</SelectItem>
                                      <SelectItem value="lost">Verloren</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  status.type === "won" ? "Gewonnen" : 
                                  status.type === "lost" ? "Verloren" : "Offen"
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {editingStatus?.id === status.id ? (
                                  <Button variant="outline" onClick={handleSaveEdit}>
                                    Speichern
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleEditStatus(status.id, status.name, status.type)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteStatus(status.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))
                  )}
                  {provided.placeholder}
                </TableBody>
              </Table>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Status löschen"
        description="Sind Sie sicher, dass Sie diesen Status löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </>
  );
}
