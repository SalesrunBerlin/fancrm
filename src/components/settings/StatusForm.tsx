
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StatusFormProps {
  dealStatuses: any[];
  createStatus: ReturnType<typeof useDealStatuses>["createStatus"];
  isPending: boolean;
}

export function StatusForm({ dealStatuses, createStatus, isPending }: StatusFormProps) {
  const { toast } = useToast();
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusType, setNewStatusType] = useState("open");

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
        type: newStatusType, // Use the selected type
      });
      setNewStatusName("");
      setNewStatusType("open"); // Reset to default
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

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status-name">Status Name</Label>
          <Input
            id="status-name"
            placeholder="Neuen Status eingeben"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-type">Status Typ</Label>
          <Select value={newStatusType} onValueChange={setNewStatusType}>
            <SelectTrigger id="status-type">
              <SelectValue placeholder="Typ auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Offen</SelectItem>
              <SelectItem value="won">Gewonnen</SelectItem>
              <SelectItem value="lost">Verloren</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleCreateStatus} disabled={isPending} className="w-full md:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Hinzufügen
      </Button>
    </div>
  );
}
