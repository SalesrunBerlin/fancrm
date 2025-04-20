
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { Grip, Plus, X } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [newStatusName, setNewStatusName] = useState("");
  const { dealStatuses, isLoading, createStatus, deleteStatus } = useDealStatuses();

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
      });
      setNewStatusName("");
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich erstellt",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStatus = async (id: string) => {
    try {
      await deleteStatus.mutateAsync(id);
      toast({
        title: "Erfolg",
        description: "Status wurde erfolgreich gelöscht",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht gelöscht werden",
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

        <div className="space-y-2">
          {isLoading ? (
            <div>Lädt...</div>
          ) : dealStatuses?.map((status) => (
            <div
              key={status.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Grip className="h-4 w-4 text-muted-foreground" />
                <span>{status.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteStatus(status.id)}
                disabled={deleteStatus.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
