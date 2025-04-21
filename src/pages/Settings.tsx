
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Settings() {
  const { toast } = useToast();
  const [newStatusName, setNewStatusName] = useState("");
  const [editingStatus, setEditingStatus] = useState<{ id: string; name: string; type: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const { 
    dealStatuses, 
    isLoading, 
    createStatus, 
    updateStatus, 
    deleteStatus,
    initializeDefaultStatuses 
  } = useDealStatuses();

  // Initialize default statuses if needed
  useEffect(() => {
    if (dealStatuses && dealStatuses.length === 0 && !isLoading) {
      console.log("No statuses found, initializing defaults");
      initializeDefaultStatuses();
    }
  }, [dealStatuses, isLoading, initializeDefaultStatuses]);

  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen für den Status ein",
        variant: "destructive",
      });
      return;
    }

    try {
      await createStatus.mutateAsync({
        name: newStatusName.trim(),
        order_position: (dealStatuses?.length || 0) + 1,
        type: "open", // Default type
      });
      setNewStatusName("");
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich erstellt",
      });
    } catch (error) {
      console.error("Error creating status:", error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStatus = async (id: string) => {
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
    setEditingStatus({ id, name, type: type || "open" });
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Einstellungen</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Deal Status Verwaltung</h2>
        
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Neuen Status eingeben"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
          />
          <Button onClick={handleCreateStatus} disabled={createStatus.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Hinzufügen
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Lädt...</TableCell>
              </TableRow>
            ) : !dealStatuses || dealStatuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Keine Status gefunden</TableCell>
              </TableRow>
            ) : (
              dealStatuses.map((status) => {
                // Der Typ kann fehlen, also Standardwert "open"
                const type = status.type || "open";
                return (
                  <TableRow key={status.id}>
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
                        type === "won" ? "Gewonnen" : 
                        type === "lost" ? "Verloren" : "Offen"
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
                            onClick={() => handleEditStatus(status.id, status.name, type)}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
      
      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Status löschen"
        description="Sind Sie sicher, dass Sie diesen Status löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
}
