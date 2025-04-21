
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses } from "@/hooks/useDealStatuses";

interface StatusFormProps {
  dealStatuses: any[];
  createStatus: ReturnType<typeof useDealStatuses>["createStatus"];
  isPending: boolean;
}

export function StatusForm({ dealStatuses, createStatus, isPending }: StatusFormProps) {
  const { toast } = useToast();
  const [newStatusName, setNewStatusName] = useState("");

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

  return (
    <div className="flex gap-4 mb-6">
      <Input
        placeholder="Neuen Status eingeben"
        value={newStatusName}
        onChange={(e) => setNewStatusName(e.target.value)}
      />
      <Button onClick={handleCreateStatus} disabled={isPending}>
        <Plus className="mr-2 h-4 w-4" />
        Hinzufügen
      </Button>
    </div>
  );
}
