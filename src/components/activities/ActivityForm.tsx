
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityFormProps {
  onSuccess: () => void;
}

export function ActivityForm({ onSuccess }: ActivityFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState<"open" | "done">("open");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("activities").insert({
      owner_id: user.id,
      type: "call",
      subject,
      description,
      scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
      outcome,
      status,
    });

    setLoading(false);
    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Gespeichert", description: "Anruf gespeichert." });
    setSubject("");
    setDescription("");
    setScheduledAt("");
    setOutcome("");
    setStatus("open");
    onSuccess();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Input
          placeholder="Betreff*"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div>
        <Textarea
          placeholder="Beschreibung / Notizen"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            type="datetime-local"
            placeholder="Termin"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Input
            placeholder="Ergebnis (z.B. erreicht, nicht erreicht)"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <label>
          <input
            type="radio"
            name="status"
            value="open"
            checked={status === "open"}
            onChange={() => setStatus("open")}
            disabled={loading}
          />{" "}
          Offen
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="done"
            checked={status === "done"}
            onChange={() => setStatus("done")}
            disabled={loading}
          />{" "}
          Erledigt
        </label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Speichern..." : "Speichern"}
      </Button>
    </form>
  );
}
